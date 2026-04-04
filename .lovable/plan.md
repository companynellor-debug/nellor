

# Plan: Generate WebViewApp Android Project ZIP

This is a **file generation task** -- I will create a complete Android Studio project with all specified files and package it as a downloadable ZIP.

## What will be generated

A complete Android native project (`WebViewApp.zip`) containing:

### Core Java files
- **SplashActivity.java** -- Fullscreen splash screen with configurable duration, navigates to MainActivity
- **MainActivity.java** -- Full WebView implementation with JavaScript bridge (`AndroidBridge`), custom WebViewClient/WebChromeClient, connectivity handling, file chooser, progress bar, back button navigation, and lifecycle management
- **MyFirebaseMessagingService.java** -- FCM push notification handler with notification channel, foreground/background behavior, and token management

### Android resources
- Layouts: `activity_main.xml` (WebView + progress bar + offline layout), `activity_splash.xml`
- Values: `strings.xml` (configurable URL, app name), `colors.xml`, `themes.xml` (fullscreen, no ActionBar)
- Drawable: `ic_notification.xml` (vector icon)
- XML: `network_security_config.xml`

### Build configuration
- Root `build.gradle`, `settings.gradle`, `gradle.properties`
- App `build.gradle` with Firebase BOM, AndroidX, Material, WebKit dependencies
- `proguard-rules.pro` with Firebase/WebView rules
- `google-services.json.example` placeholder
- `AndroidManifest.xml` with all permissions (INTERNET, CAMERA, LOCATION, POST_NOTIFICATIONS, etc.)

### JavaScript Bridge methods
The `AndroidBridge` interface exposed to the web page:
- `showNotification(title, body)` -- native Android notification
- `getDeviceToken(callback)` -- FCM token retrieval
- `setStatusBarColor(hexColor)` -- dynamic status bar color
- `openExternalUrl(url)` -- open in system browser
- `shareContent(title, text, url)` -- native share intent
- `vibrate(ms)` -- device vibration
- `getAppVersion()` -- returns app version

### Documentation
- Complete `README.md` with setup instructions for URL config, Firebase, APK generation, and JS Bridge usage

## Technical notes
- Target: API 21 (Android 5.0) through API 34 (Android 14)
- The `target_url` in `strings.xml` will default to `https://nellor.lovable.app`
- All files will be written to `/tmp/WebViewApp/` then zipped to `/mnt/documents/WebViewApp.zip`
- The project will sync in Android Studio once the user adds their own `google-services.json`

