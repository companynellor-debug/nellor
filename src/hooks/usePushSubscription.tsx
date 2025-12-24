import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

// Cache for VAPID public key
let cachedVapidKey: string | null = null;

async function getVapidPublicKey(): Promise<string | null> {
  if (cachedVapidKey) return cachedVapidKey;
  
  try {
    const { data, error } = await supabase.functions.invoke('get-vapid-key');
    if (error) throw error;
    cachedVapidKey = data?.vapidPublicKey || null;
    return cachedVapidKey;
  } catch (err) {
    console.error('❌ Error fetching VAPID key:', err);
    return null;
  }
}

export const usePushSubscription = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already subscribed (and keep DB in sync)
  const checkSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('❌ Push notifications not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        console.log('✅ Already subscribed to push');
        setIsSubscribed(true);

        // Ensure the subscription exists in DB (server push depends on this)
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const json = subscription.toJSON();
            const endpoint = subscription.endpoint;
            const p256dh = json.keys?.p256dh || '';
            const auth = json.keys?.auth || '';

            if (p256dh && auth) {
              const { error: syncError } = await supabase
                .from('push_subscriptions')
                .upsert({
                  user_id: user.id,
                  endpoint,
                  p256dh,
                  auth,
                  user_agent: navigator.userAgent,
                  updated_at: new Date().toISOString(),
                }, {
                  onConflict: 'user_id,endpoint',
                });

              if (syncError) {
                console.warn('⚠️ Could not sync push subscription to DB:', syncError);
              } else {
                console.log('✅ Push subscription synced to DB');
              }
            }
          }
        } catch (syncErr) {
          console.warn('⚠️ Push subscription DB sync failed:', syncErr);
        }

        return true;
      }

      console.log('📱 Not subscribed to push yet');
      setIsSubscribed(false);
      return false;
    } catch (err) {
      console.error('❌ Error checking subscription:', err);
      return false;
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setError('Push notifications not supported in this browser');
      return false;
    }

    setIsSubscribing(true);
    setError(null);

    try {
      // Request notification permission first
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('Notification permission denied');
        setIsSubscribing(false);
        return false;
      }

      // Get the service worker registration
      const registration = await navigator.serviceWorker.ready;
      console.log('📱 Service worker ready, subscribing to push...');

      // Get VAPID public key
      const vapidKey = await getVapidPublicKey();
      if (!vapidKey) {
        throw new Error('Could not fetch VAPID public key');
      }

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Subscribe to push
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
        console.log('✅ Push subscription created');
      } else {
        console.log('✅ Using existing push subscription');
      }

      // Get the subscription keys
      const subscriptionJson = subscription.toJSON();
      const endpoint = subscription.endpoint;
      const p256dh = subscriptionJson.keys?.p256dh || '';
      const auth = subscriptionJson.keys?.auth || '';

      if (!p256dh || !auth) {
        throw new Error('Invalid subscription keys');
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('💾 Saving subscription to database...');

      // Save to database (upsert to handle duplicates)
      const { error: dbError } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint,
          p256dh,
          auth,
          user_agent: navigator.userAgent,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,endpoint',
        });

      if (dbError) {
        console.error('❌ Error saving subscription:', dbError);
        throw dbError;
      }

      console.log('✅ Push subscription saved successfully');
      setIsSubscribed(true);
      setIsSubscribing(false);
      return true;
    } catch (err: any) {
      console.error('❌ Error subscribing to push:', err);
      setError(err.message || 'Failed to subscribe');
      setIsSubscribing(false);
      return false;
    }
  }, []);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Unsubscribe from browser
        await subscription.unsubscribe();
        
        // Remove from database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('endpoint', subscription.endpoint);
        }
      }

      setIsSubscribed(false);
      console.log('✅ Unsubscribed from push notifications');
      return true;
    } catch (err: any) {
      console.error('❌ Error unsubscribing:', err);
      setError(err.message || 'Failed to unsubscribe');
      return false;
    }
  }, []);

  // Check subscription on mount
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  return {
    isSubscribed,
    isSubscribing,
    error,
    subscribe,
    unsubscribe,
    checkSubscription,
  };
};