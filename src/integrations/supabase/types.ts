export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          complement: string | null
          created_at: string | null
          document: string
          id: string
          is_default: boolean | null
          label: string
          name: string
          neighborhood: string
          number: string
          state: string
          street: string
          updated_at: string | null
          user_id: string
          zip_code: string
        }
        Insert: {
          city: string
          complement?: string | null
          created_at?: string | null
          document: string
          id?: string
          is_default?: boolean | null
          label: string
          name: string
          neighborhood: string
          number: string
          state: string
          street: string
          updated_at?: string | null
          user_id: string
          zip_code: string
        }
        Update: {
          city?: string
          complement?: string | null
          created_at?: string | null
          document?: string
          id?: string
          is_default?: boolean | null
          label?: string
          name?: string
          neighborhood?: string
          number?: string
          state?: string
          street?: string
          updated_at?: string | null
          user_id?: string
          zip_code?: string
        }
        Relationships: []
      }
      affiliate_attributions: {
        Row: {
          affiliate_link_id: string
          buyer_id: string | null
          clicked_at: string | null
          converted: boolean | null
          expires_at: string
          id: string
          supplier_id: string
          visitor_id: string | null
        }
        Insert: {
          affiliate_link_id: string
          buyer_id?: string | null
          clicked_at?: string | null
          converted?: boolean | null
          expires_at: string
          id?: string
          supplier_id: string
          visitor_id?: string | null
        }
        Update: {
          affiliate_link_id?: string
          buyer_id?: string | null
          clicked_at?: string | null
          converted?: boolean | null
          expires_at?: string
          id?: string
          supplier_id?: string
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_attributions_affiliate_link_id_fkey"
            columns: ["affiliate_link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_commission_items: {
        Row: {
          commission_amount: number
          commission_id: string
          commission_percent: number
          created_at: string
          id: string
          line_total: number
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          commission_amount: number
          commission_id: string
          commission_percent: number
          created_at?: string
          id?: string
          line_total: number
          product_id: string
          quantity?: number
          unit_price: number
        }
        Update: {
          commission_amount?: number
          commission_id?: string
          commission_percent?: number
          created_at?: string
          id?: string
          line_total?: number
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commission_items_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "affiliate_commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commission_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          amount: number
          attribution_id: string | null
          commission_percent: number | null
          created_at: string | null
          id: string
          order_id: string
          order_total: number | null
          paid_at: string | null
          status: Database["public"]["Enums"]["commission_status"] | null
          stripe_transfer_id: string | null
          supplier_id: string | null
        }
        Insert: {
          affiliate_id: string
          amount: number
          attribution_id?: string | null
          commission_percent?: number | null
          created_at?: string | null
          id?: string
          order_id: string
          order_total?: number | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["commission_status"] | null
          stripe_transfer_id?: string | null
          supplier_id?: string | null
        }
        Update: {
          affiliate_id?: string
          amount?: number
          attribution_id?: string | null
          commission_percent?: number | null
          created_at?: string | null
          id?: string
          order_id?: string
          order_total?: number | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["commission_status"] | null
          stripe_transfer_id?: string | null
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_attribution_id_fkey"
            columns: ["attribution_id"]
            isOneToOne: false
            referencedRelation: "affiliate_attributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_links: {
        Row: {
          affiliate_id: string
          clicks: number | null
          code: string
          conversions: number | null
          created_at: string | null
          id: string
          product_id: string | null
          supplier_id: string
        }
        Insert: {
          affiliate_id: string
          clicks?: number | null
          code: string
          conversions?: number | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          supplier_id: string
        }
        Update: {
          affiliate_id?: string
          clicks?: number | null
          code?: string
          conversions?: number | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          created_at: string | null
          document_number: string | null
          document_type: string | null
          email: string | null
          full_name: string | null
          id: string
          pending_earnings: number | null
          pix_key: string | null
          registration_step: number | null
          status: Database["public"]["Enums"]["affiliate_status"]
          stripe_account_id: string | null
          stripe_ready: boolean | null
          terms_accepted_at: string | null
          total_earnings: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          pending_earnings?: number | null
          pix_key?: string | null
          registration_step?: number | null
          status?: Database["public"]["Enums"]["affiliate_status"]
          stripe_account_id?: string | null
          stripe_ready?: boolean | null
          terms_accepted_at?: string | null
          total_earnings?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          pending_earnings?: number | null
          pix_key?: string | null
          registration_step?: number | null
          status?: Database["public"]["Enums"]["affiliate_status"]
          stripe_account_id?: string | null
          stripe_ready?: boolean | null
          terms_accepted_at?: string | null
          total_earnings?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      analytics: {
        Row: {
          created_at: string | null
          id: string
          lucro_estimado: number | null
          mes_referencia: string
          supplier_id: string | null
          ticket_medio: number | null
          total_pedidos: number | null
          total_vendas: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lucro_estimado?: number | null
          mes_referencia: string
          supplier_id?: string | null
          ticket_medio?: number | null
          total_pedidos?: number | null
          total_vendas?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lucro_estimado?: number | null
          mes_referencia?: string
          supplier_id?: string | null
          ticket_medio?: number | null
          total_pedidos?: number | null
          total_vendas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "public_supplier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          image_url: string
          link_url: string | null
          order_index: number | null
          subtitle: string | null
          title: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          image_url: string
          link_url?: string | null
          order_index?: number | null
          subtitle?: string | null
          title?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          image_url?: string
          link_url?: string | null
          order_index?: number | null
          subtitle?: string | null
          title?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          imagem_url: string | null
          nome: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          imagem_url?: string | null
          nome: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          imagem_url?: string | null
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      client_drop_products: {
        Row: {
          client_id: string
          created_at: string | null
          custom_price: number
          id: string
          is_active: boolean | null
          margin_type: string | null
          margin_value: number | null
          product_drop_setting_id: string
          product_id: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          custom_price: number
          id?: string
          is_active?: boolean | null
          margin_type?: string | null
          margin_value?: number | null
          product_drop_setting_id: string
          product_id: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          custom_price?: number
          id?: string
          is_active?: boolean | null
          margin_type?: string | null
          margin_value?: number | null
          product_drop_setting_id?: string
          product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_drop_products_product_drop_setting_id_fkey"
            columns: ["product_drop_setting_id"]
            isOneToOne: false
            referencedRelation: "product_drop_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_drop_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      client_drop_profiles: {
        Row: {
          business_name: string | null
          created_at: string | null
          drop_enabled: boolean | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_name?: string | null
          created_at?: string | null
          drop_enabled?: boolean | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_name?: string | null
          created_at?: string | null
          drop_enabled?: boolean | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      collection_items: {
        Row: {
          added_at: string | null
          collection_id: string
          id: string
          reference_id: string
          type: Database["public"]["Enums"]["collection_item_type"]
        }
        Insert: {
          added_at?: string | null
          collection_id: string
          id?: string
          reference_id: string
          type: Database["public"]["Enums"]["collection_item_type"]
        }
        Update: {
          added_at?: string | null
          collection_id?: string
          id?: string
          reference_id?: string
          type?: Database["public"]["Enums"]["collection_item_type"]
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_members: {
        Row: {
          added_at: string | null
          collection_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          collection_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          collection_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_members_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          share_token: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          share_token?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          share_token?: string | null
          user_id?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          ativo: boolean | null
          codigo: string
          created_at: string | null
          expira_em: string | null
          id: string
          product_id: string | null
          supplier_id: string
          tipo: Database["public"]["Enums"]["coupon_type"]
          uso_atual: number | null
          uso_maximo: number | null
          valor: number
          valor_minimo: number | null
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          created_at?: string | null
          expira_em?: string | null
          id?: string
          product_id?: string | null
          supplier_id: string
          tipo: Database["public"]["Enums"]["coupon_type"]
          uso_atual?: number | null
          uso_maximo?: number | null
          valor: number
          valor_minimo?: number | null
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          created_at?: string | null
          expira_em?: string | null
          id?: string
          product_id?: string | null
          supplier_id?: string
          tipo?: Database["public"]["Enums"]["coupon_type"]
          uso_atual?: number | null
          uso_maximo?: number | null
          valor?: number
          valor_minimo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "public_supplier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      drop_audit_log: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      drop_orders: {
        Row: {
          base_price: number
          buyer_document: string | null
          buyer_email: string | null
          buyer_name: string
          buyer_phone: string | null
          client_drop_product_id: string
          client_id: string
          client_margin: number
          created_at: string | null
          delivered_at: string | null
          estimated_delivery: string | null
          external_marketplace: string | null
          external_order_id: string | null
          id: string
          order_number: string
          order_status: string | null
          paid_at: string | null
          payment_status: string | null
          platform_fee: number | null
          product_id: string
          quantity: number
          sale_price: number
          shipped_at: string | null
          shipping_address: Json
          shipping_company: string | null
          supplier_amount: number
          supplier_id: string
          total: number
          tracking_code: string | null
          updated_at: string | null
        }
        Insert: {
          base_price: number
          buyer_document?: string | null
          buyer_email?: string | null
          buyer_name: string
          buyer_phone?: string | null
          client_drop_product_id: string
          client_id: string
          client_margin: number
          created_at?: string | null
          delivered_at?: string | null
          estimated_delivery?: string | null
          external_marketplace?: string | null
          external_order_id?: string | null
          id?: string
          order_number?: string
          order_status?: string | null
          paid_at?: string | null
          payment_status?: string | null
          platform_fee?: number | null
          product_id: string
          quantity?: number
          sale_price: number
          shipped_at?: string | null
          shipping_address: Json
          shipping_company?: string | null
          supplier_amount: number
          supplier_id: string
          total: number
          tracking_code?: string | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          buyer_document?: string | null
          buyer_email?: string | null
          buyer_name?: string
          buyer_phone?: string | null
          client_drop_product_id?: string
          client_id?: string
          client_margin?: number
          created_at?: string | null
          delivered_at?: string | null
          estimated_delivery?: string | null
          external_marketplace?: string | null
          external_order_id?: string | null
          id?: string
          order_number?: string
          order_status?: string | null
          paid_at?: string | null
          payment_status?: string | null
          platform_fee?: number | null
          product_id?: string
          quantity?: number
          sale_price?: number
          shipped_at?: string | null
          shipping_address?: Json
          shipping_company?: string | null
          supplier_amount?: number
          supplier_id?: string
          total?: number
          tracking_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drop_orders_client_drop_product_id_fkey"
            columns: ["client_drop_product_id"]
            isOneToOne: false
            referencedRelation: "client_drop_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drop_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: string[] | null
          chat_id: string
          created_at: string | null
          from_user: string
          id: string
          read: boolean | null
          text: string
          to_user: string
        }
        Insert: {
          attachments?: string[] | null
          chat_id: string
          created_at?: string | null
          from_user: string
          id?: string
          read?: boolean | null
          text: string
          to_user: string
        }
        Update: {
          attachments?: string[] | null
          chat_id?: string
          created_at?: string | null
          from_user?: string
          id?: string
          read?: boolean | null
          text?: string
          to_user?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_from_user_fkey"
            columns: ["from_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_from_user_fkey"
            columns: ["from_user"]
            isOneToOne: false
            referencedRelation: "public_supplier_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_to_user_fkey"
            columns: ["to_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_to_user_fkey"
            columns: ["to_user"]
            isOneToOne: false
            referencedRelation: "public_supplier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          delivery_updates: boolean
          email_enabled: boolean
          id: string
          messages: boolean
          order_updates: boolean
          payment_confirmations: boolean
          price_alerts: boolean
          promotions: boolean
          push_enabled: boolean
          sound_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_updates?: boolean
          email_enabled?: boolean
          id?: string
          messages?: boolean
          order_updates?: boolean
          payment_confirmations?: boolean
          price_alerts?: boolean
          promotions?: boolean
          push_enabled?: boolean
          sound_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_updates?: boolean
          email_enabled?: boolean
          id?: string
          messages?: boolean
          order_updates?: boolean
          payment_confirmations?: boolean
          price_alerts?: boolean
          promotions?: boolean
          push_enabled?: boolean
          sound_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_sent_events: {
        Row: {
          created_at: string
          event_key: string
          id: string
        }
        Insert: {
          created_at?: string
          event_key: string
          id?: string
        }
        Update: {
          created_at?: string
          event_key?: string
          id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          id: string
          read: boolean | null
          sound: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          id?: string
          read?: boolean | null
          sound?: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          read?: boolean | null
          sound?: boolean | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_supplier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string | null
          created_at: string | null
          desconto: number | null
          endereco_entrega: Json
          estimated_delivery: string | null
          frete: number | null
          id: string
          itens: Json
          order_number: string
          order_status: Database["public"]["Enums"]["order_status"] | null
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          payment_status_label: string | null
          platform_fee: number | null
          proof_url: string | null
          shipping_company: string | null
          status_label: string | null
          stripe_payment_amount: number | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          subtotal: number
          supplier_amount: number | null
          supplier_id: string
          total: number
          tracking_code: string | null
          updated_at: string | null
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string | null
          desconto?: number | null
          endereco_entrega: Json
          estimated_delivery?: string | null
          frete?: number | null
          id?: string
          itens: Json
          order_number: string
          order_status?: Database["public"]["Enums"]["order_status"] | null
          paid_at?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          payment_status_label?: string | null
          platform_fee?: number | null
          proof_url?: string | null
          shipping_company?: string | null
          status_label?: string | null
          stripe_payment_amount?: number | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal: number
          supplier_amount?: number | null
          supplier_id: string
          total: number
          tracking_code?: string | null
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string | null
          created_at?: string | null
          desconto?: number | null
          endereco_entrega?: Json
          estimated_delivery?: string | null
          frete?: number | null
          id?: string
          itens?: Json
          order_number?: string
          order_status?: Database["public"]["Enums"]["order_status"] | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          payment_status_label?: string | null
          platform_fee?: number | null
          proof_url?: string | null
          shipping_company?: string | null
          status_label?: string | null
          stripe_payment_amount?: number | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal?: number
          supplier_amount?: number | null
          supplier_id?: string
          total?: number
          tracking_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "public_supplier_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "public_supplier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          card_brand: string | null
          card_expiry: string | null
          card_holder: string | null
          card_number_last4: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          pix_key: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          card_brand?: string | null
          card_expiry?: string | null
          card_holder?: string | null
          card_number_last4?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          pix_key?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          card_brand?: string | null
          card_expiry?: string | null
          card_holder?: string | null
          card_number_last4?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          pix_key?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payouts: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string | null
          id: string
          pix_key: string
          status: Database["public"]["Enums"]["payout_status"] | null
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string | null
          id?: string
          pix_key: string
          status?: Database["public"]["Enums"]["payout_status"] | null
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string | null
          id?: string
          pix_key?: string
          status?: Database["public"]["Enums"]["payout_status"] | null
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "public_supplier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          id: string
          price: number
          product_id: string
          recorded_at: string | null
          variation_id: string | null
        }
        Insert: {
          id?: string
          price: number
          product_id: string
          recorded_at?: string | null
          variation_id?: string | null
        }
        Update: {
          id?: string
          price?: number
          product_id?: string
          recorded_at?: string | null
          variation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_drop_settings: {
        Row: {
          allow_affiliates: boolean | null
          allow_service_providers: boolean | null
          commission_percent: number | null
          created_at: string | null
          drop_enabled: boolean | null
          id: string
          max_commission_percent: number | null
          min_resale_price: number | null
          product_id: string
          shipping_days_estimate: number | null
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          allow_affiliates?: boolean | null
          allow_service_providers?: boolean | null
          commission_percent?: number | null
          created_at?: string | null
          drop_enabled?: boolean | null
          id?: string
          max_commission_percent?: number | null
          min_resale_price?: number | null
          product_id: string
          shipping_days_estimate?: number | null
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          allow_affiliates?: boolean | null
          allow_service_providers?: boolean | null
          commission_percent?: number | null
          created_at?: string | null
          drop_enabled?: boolean | null
          id?: string
          max_commission_percent?: number | null
          min_resale_price?: number | null
          product_id?: string
          shipping_days_estimate?: number | null
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_drop_settings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_price_tiers: {
        Row: {
          created_at: string | null
          id: string
          max_quantity: number | null
          min_quantity: number
          price_per_unit: number
          product_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_quantity?: number | null
          min_quantity: number
          price_per_unit: number
          product_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          max_quantity?: number | null
          min_quantity?: number
          price_per_unit?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_price_tiers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variations: {
        Row: {
          color: string | null
          color_hex: string | null
          created_at: string | null
          id: string
          image_url: string | null
          price: number | null
          product_id: string
          size: string | null
          stock: number
          updated_at: string | null
          variation_label: string | null
          variation_type: string | null
          variation_value: string | null
        }
        Insert: {
          color?: string | null
          color_hex?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          price?: number | null
          product_id: string
          size?: string | null
          stock?: number
          updated_at?: string | null
          variation_label?: string | null
          variation_type?: string | null
          variation_value?: string | null
        }
        Update: {
          color?: string | null
          color_hex?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          price?: number | null
          product_id?: string
          size?: string | null
          stock?: number
          updated_at?: string | null
          variation_label?: string | null
          variation_type?: string | null
          variation_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          affiliate_commission_percent: number | null
          ativo: boolean | null
          brand: string | null
          categoria_id: string | null
          condition: string | null
          cores: Json | null
          created_at: string | null
          depth_cm: number | null
          descricao_curta: string | null
          descricao_longa: string | null
          dimensoes: Json | null
          estoque: number
          height_cm: number | null
          id: string
          imagens: string[] | null
          is_cnpj_only: boolean | null
          is_international: boolean | null
          is_kit: boolean | null
          kit_items: Json | null
          material: string | null
          min_order_quantity: number | null
          ncm_code: string | null
          nome: string
          origin: string | null
          peso: number | null
          preco: number
          rating_medio: number | null
          sale_unit: string | null
          supplier_id: string
          tamanhos: Json | null
          total_reviews: number | null
          units_per_sale_unit: number | null
          updated_at: string | null
          variacoes: Json | null
          vendas_count: number | null
          weight_grams: number | null
          width_cm: number | null
        }
        Insert: {
          affiliate_commission_percent?: number | null
          ativo?: boolean | null
          brand?: string | null
          categoria_id?: string | null
          condition?: string | null
          cores?: Json | null
          created_at?: string | null
          depth_cm?: number | null
          descricao_curta?: string | null
          descricao_longa?: string | null
          dimensoes?: Json | null
          estoque?: number
          height_cm?: number | null
          id?: string
          imagens?: string[] | null
          is_cnpj_only?: boolean | null
          is_international?: boolean | null
          is_kit?: boolean | null
          kit_items?: Json | null
          material?: string | null
          min_order_quantity?: number | null
          ncm_code?: string | null
          nome: string
          origin?: string | null
          peso?: number | null
          preco: number
          rating_medio?: number | null
          sale_unit?: string | null
          supplier_id: string
          tamanhos?: Json | null
          total_reviews?: number | null
          units_per_sale_unit?: number | null
          updated_at?: string | null
          variacoes?: Json | null
          vendas_count?: number | null
          weight_grams?: number | null
          width_cm?: number | null
        }
        Update: {
          affiliate_commission_percent?: number | null
          ativo?: boolean | null
          brand?: string | null
          categoria_id?: string | null
          condition?: string | null
          cores?: Json | null
          created_at?: string | null
          depth_cm?: number | null
          descricao_curta?: string | null
          descricao_longa?: string | null
          dimensoes?: Json | null
          estoque?: number
          height_cm?: number | null
          id?: string
          imagens?: string[] | null
          is_cnpj_only?: boolean | null
          is_international?: boolean | null
          is_kit?: boolean | null
          kit_items?: Json | null
          material?: string | null
          min_order_quantity?: number | null
          ncm_code?: string | null
          nome?: string
          origin?: string | null
          peso?: number | null
          preco?: number
          rating_medio?: number | null
          sale_unit?: string | null
          supplier_id?: string
          tamanhos?: Json | null
          total_reviews?: number | null
          units_per_sale_unit?: number | null
          updated_at?: string | null
          variacoes?: Json | null
          vendas_count?: number | null
          weight_grams?: number | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "public_supplier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean | null
          banner_loja_url: string | null
          created_at: string | null
          descricao_loja: string | null
          document: string | null
          email: string
          endereco_principal: Json | null
          foto_perfil_url: string | null
          id: string
          min_order_quantity: number | null
          min_order_value: number | null
          nome: string
          onboarding_completed: boolean | null
          pix_key: string | null
          service_provider_code: string | null
          shipping_city: string | null
          shipping_state: string | null
          store_slug: string | null
          stripe_account_id: string | null
          stripe_ready: boolean | null
          telefone: string | null
          tipo: Database["public"]["Enums"]["user_type"]
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          banner_loja_url?: string | null
          created_at?: string | null
          descricao_loja?: string | null
          document?: string | null
          email: string
          endereco_principal?: Json | null
          foto_perfil_url?: string | null
          id: string
          min_order_quantity?: number | null
          min_order_value?: number | null
          nome: string
          onboarding_completed?: boolean | null
          pix_key?: string | null
          service_provider_code?: string | null
          shipping_city?: string | null
          shipping_state?: string | null
          store_slug?: string | null
          stripe_account_id?: string | null
          stripe_ready?: boolean | null
          telefone?: string | null
          tipo: Database["public"]["Enums"]["user_type"]
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          banner_loja_url?: string | null
          created_at?: string | null
          descricao_loja?: string | null
          document?: string | null
          email?: string
          endereco_principal?: Json | null
          foto_perfil_url?: string | null
          id?: string
          min_order_quantity?: number | null
          min_order_value?: number | null
          nome?: string
          onboarding_completed?: boolean | null
          pix_key?: string | null
          service_provider_code?: string | null
          shipping_city?: string | null
          shipping_state?: string | null
          store_slug?: string | null
          stripe_account_id?: string | null
          stripe_ready?: boolean | null
          telefone?: string | null
          tipo?: Database["public"]["Enums"]["user_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      push_notification_logs: {
        Row: {
          body: string
          created_at: string
          endpoint: string
          error_message: string | null
          http_status: number | null
          id: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          endpoint: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          status: string
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          endpoint?: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_notification_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_notification_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_supplier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_supplier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      refund_requests: {
        Row: {
          buyer_id: string
          confirmed_at: string | null
          created_at: string
          id: string
          order_id: string
          reason: string
          resolved_at: string | null
          status: string
          supplier_id: string
        }
        Insert: {
          buyer_id: string
          confirmed_at?: string | null
          created_at?: string
          id?: string
          order_id: string
          reason?: string
          resolved_at?: string | null
          status?: string
          supplier_id: string
        }
        Update: {
          buyer_id?: string
          confirmed_at?: string | null
          created_at?: string
          id?: string
          order_id?: string
          reason?: string
          resolved_at?: string | null
          status?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_id: string
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          buyer_id: string
          comment: string | null
          created_at: string | null
          id: string
          order_id: string | null
          photos: string[] | null
          product_id: string
          rating: number
        }
        Insert: {
          buyer_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          photos?: string[] | null
          product_id: string
          rating: number
        }
        Update: {
          buyer_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          photos?: string[] | null
          product_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "public_supplier_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      service_provider_contract_requests: {
        Row: {
          contract_type: string
          created_at: string
          id: string
          monthly_value: number | null
          notes: string | null
          rejected_reason: string | null
          requested_at: string
          responded_at: string | null
          service_provider_id: string
          status: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          contract_type: string
          created_at?: string
          id?: string
          monthly_value?: number | null
          notes?: string | null
          rejected_reason?: string | null
          requested_at?: string
          responded_at?: string | null
          service_provider_id: string
          status?: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          contract_type?: string
          created_at?: string
          id?: string
          monthly_value?: number | null
          notes?: string | null
          rejected_reason?: string | null
          requested_at?: string
          responded_at?: string | null
          service_provider_id?: string
          status?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_provider_contract_requests_service_provider_id_fkey"
            columns: ["service_provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_provider_crm: {
        Row: {
          client_email: string | null
          client_name: string
          client_phone: string | null
          contract_type: Database["public"]["Enums"]["crm_contract_type"] | null
          created_at: string | null
          id: string
          monthly_value: number | null
          next_billing_date: string | null
          notes: string | null
          service_provider_id: string
          updated_at: string | null
        }
        Insert: {
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          contract_type?:
            | Database["public"]["Enums"]["crm_contract_type"]
            | null
          created_at?: string | null
          id?: string
          monthly_value?: number | null
          next_billing_date?: string | null
          notes?: string | null
          service_provider_id: string
          updated_at?: string | null
        }
        Update: {
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          contract_type?:
            | Database["public"]["Enums"]["crm_contract_type"]
            | null
          created_at?: string | null
          id?: string
          monthly_value?: number | null
          next_billing_date?: string | null
          notes?: string | null
          service_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_provider_crm_service_provider_id_fkey"
            columns: ["service_provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_provider_requests: {
        Row: {
          created_at: string
          id: string
          requested_at: string
          responded_at: string | null
          service_provider_id: string
          status: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          requested_at?: string
          responded_at?: string | null
          service_provider_id: string
          status?: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          requested_at?: string
          responded_at?: string | null
          service_provider_id?: string
          status?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_provider_requests_service_provider_id_fkey"
            columns: ["service_provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_provider_requests_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_provider_requests_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "public_supplier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_provider_suppliers: {
        Row: {
          created_at: string | null
          id: string
          service_provider_id: string
          supplier_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          service_provider_id: string
          supplier_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          service_provider_id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_provider_suppliers_service_provider_id_fkey"
            columns: ["service_provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_providers: {
        Row: {
          business_name: string
          created_at: string | null
          description: string | null
          id: string
          service_type: string
          status: Database["public"]["Enums"]["service_provider_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_name: string
          created_at?: string | null
          description?: string | null
          id?: string
          service_type: string
          status?: Database["public"]["Enums"]["service_provider_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          service_type?: string
          status?: Database["public"]["Enums"]["service_provider_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shared_carts: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          items: Json
          share_token: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          items?: Json
          share_token?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          items?: Json
          share_token?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sponsored_products: {
        Row: {
          approved_at: string | null
          banner_url: string | null
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          product_id: string
          status: string
          supplier_id: string
        }
        Insert: {
          approved_at?: string | null
          banner_url?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          product_id: string
          status?: string
          supplier_id: string
        }
        Update: {
          approved_at?: string | null
          banner_url?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          product_id?: string
          status?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsored_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_affiliate_settings: {
        Row: {
          allow_affiliates: boolean | null
          allow_recurring_commission: boolean | null
          commission_duration_days: number
          created_at: string | null
          default_commission_percent: number | null
          id: string
          recurring_duration_months: number | null
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          allow_affiliates?: boolean | null
          allow_recurring_commission?: boolean | null
          commission_duration_days?: number
          created_at?: string | null
          default_commission_percent?: number | null
          id?: string
          recurring_duration_months?: number | null
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          allow_affiliates?: boolean | null
          allow_recurring_commission?: boolean | null
          commission_duration_days?: number
          created_at?: string | null
          default_commission_percent?: number | null
          id?: string
          recurring_duration_months?: number | null
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      supplier_categories: {
        Row: {
          created_at: string
          id: string
          nome: string
          slug: string
          supplier_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          slug: string
          supplier_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          slug?: string
          supplier_id?: string
        }
        Relationships: []
      }
      supplier_drop_settings: {
        Row: {
          allow_affiliates_on_drop: boolean | null
          allow_service_providers_on_drop: boolean | null
          created_at: string | null
          default_commission_percent: number | null
          drop_enabled: boolean | null
          id: string
          min_order_value: number | null
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          allow_affiliates_on_drop?: boolean | null
          allow_service_providers_on_drop?: boolean | null
          created_at?: string | null
          default_commission_percent?: number | null
          drop_enabled?: boolean | null
          id?: string
          min_order_value?: number | null
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          allow_affiliates_on_drop?: boolean | null
          allow_service_providers_on_drop?: boolean | null
          created_at?: string | null
          default_commission_percent?: number | null
          drop_enabled?: boolean | null
          id?: string
          min_order_value?: number | null
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      supplier_service_provider_settings: {
        Row: {
          allow_service_providers: boolean | null
          can_edit_description: boolean | null
          can_edit_photos: boolean | null
          can_edit_price: boolean | null
          can_edit_stock: boolean | null
          created_at: string | null
          id: string
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          allow_service_providers?: boolean | null
          can_edit_description?: boolean | null
          can_edit_photos?: boolean | null
          can_edit_price?: boolean | null
          can_edit_stock?: boolean | null
          created_at?: string | null
          id?: string
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          allow_service_providers?: boolean | null
          can_edit_description?: boolean | null
          can_edit_photos?: boolean | null
          can_edit_price?: boolean | null
          can_edit_stock?: boolean | null
          created_at?: string | null
          id?: string
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assunto: string
          created_at: string | null
          id: string
          mensagem: string
          resposta_admin: string | null
          status: Database["public"]["Enums"]["support_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assunto: string
          created_at?: string | null
          id?: string
          mensagem: string
          resposta_admin?: string | null
          status?: Database["public"]["Enums"]["support_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assunto?: string
          created_at?: string | null
          id?: string
          mensagem?: string
          resposta_admin?: string | null
          status?: Database["public"]["Enums"]["support_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_supplier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"] | null
          order_id: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          supplier_id: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          order_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          supplier_id: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          order_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          supplier_id?: string
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "public_supplier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trend_requests: {
        Row: {
          approved_at: string | null
          created_at: string
          id: string
          product_id: string
          status: string
          supplier_id: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          id?: string
          product_id: string
          status?: string
          supplier_id: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          id?: string
          product_id?: string
          status?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trend_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_reviews: {
        Row: {
          buyer_first_name: string | null
          comment: string | null
          created_at: string | null
          id: string | null
          photos: string[] | null
          product_id: string | null
          rating: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      public_supplier_profiles: {
        Row: {
          ativo: boolean | null
          banner_loja_url: string | null
          created_at: string | null
          descricao_loja: string | null
          foto_perfil_url: string | null
          id: string | null
          nome: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_service_provider_invite: {
        Args: { _service_provider_id: string; _supplier_id: string }
        Returns: boolean
      }
      admin_update_support_ticket: {
        Args: {
          _resposta_admin?: string
          _status?: Database["public"]["Enums"]["support_status"]
          _ticket_id: string
        }
        Returns: boolean
      }
      bytea_to_text: { Args: { data: string }; Returns: string }
      create_affiliate_commission_for_order: {
        Args: { _order_id: string }
        Returns: undefined
      }
      generate_affiliate_code: { Args: never; Returns: string }
      generate_or_get_supplier_code: {
        Args: { _supplier_id: string }
        Returns: string
      }
      generate_order_number: { Args: never; Returns: string }
      generate_supplier_code: { Args: never; Returns: string }
      get_active_attribution: {
        Args: { _buyer_id: string; _supplier_id: string }
        Returns: {
          affiliate_id: string
          affiliate_link_id: string
          attribution_id: string
          clicked_at: string
          expires_at: string
        }[]
      }
      get_admin_affiliates: {
        Args: never
        Returns: {
          clicks_count: number
          conversions_count: number
          created_at: string
          document_number: string
          document_type: string
          email: string
          full_name: string
          id: string
          links_count: number
          pending_earnings: number
          registration_step: number
          status: string
          stripe_ready: boolean
          total_earnings: number
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      get_admin_commissions: {
        Args: never
        Returns: {
          affiliate_id: string
          affiliate_name: string
          amount: number
          commission_percent: number
          created_at: string
          id: string
          order_id: string
          order_number: string
          order_total: number
          paid_at: string
          status: string
        }[]
      }
      get_admin_contract_requests: {
        Args: never
        Returns: {
          contract_type: string
          id: string
          monthly_value: number
          notes: string
          rejected_reason: string
          requested_at: string
          responded_at: string
          service_provider_id: string
          sp_name: string
          status: string
          supplier_id: string
          supplier_name: string
        }[]
      }
      get_admin_orders: {
        Args: never
        Returns: {
          buyer_id: string
          buyer_name: string
          created_at: string
          desconto: number
          endereco_entrega: Json
          frete: number
          id: string
          itens: Json
          order_number: string
          order_status: string
          payment_method: string
          payment_status: string
          proof_url: string
          subtotal: number
          supplier_id: string
          supplier_name: string
          total: number
          tracking_code: string
          updated_at: string
        }[]
      }
      get_admin_profiles: {
        Args: never
        Returns: {
          ativo: boolean
          created_at: string
          email: string
          id: string
          nome: string
          onboarding_completed: boolean
          stripe_account_id: string
          telefone: string
          tipo: string
        }[]
      }
      get_admin_service_providers: {
        Args: never
        Returns: {
          business_name: string
          created_at: string
          crm_clients_count: number
          description: string
          id: string
          pending_contracts: number
          service_type: string
          status: string
          suppliers_count: number
          user_email: string
          user_id: string
          user_name: string
          user_photo: string
        }[]
      }
      get_admin_stats: {
        Args: never
        Returns: {
          active_suppliers: number
          delivered_orders: number
          paid_orders: number
          total_orders: number
          total_revenue: number
          total_users: number
        }[]
      }
      get_admin_support_tickets: {
        Args: never
        Returns: {
          assunto: string
          created_at: string
          id: string
          mensagem: string
          resposta_admin: string
          status: string
          updated_at: string
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      get_client_drop_stats: {
        Args: { _client_id: string }
        Returns: {
          active_products: number
          avg_commission: number
          pending_orders: number
          total_profit: number
          total_sales: number
        }[]
      }
      get_drop_admin_stats: {
        Args: never
        Returns: {
          active_drop_clients: number
          active_drop_suppliers: number
          paid_drop_orders: number
          pending_commissions: number
          total_client_margin: number
          total_drop_orders: number
          total_gmv: number
          total_platform_fees: number
        }[]
      }
      get_drop_catalog: {
        Args: never
        Returns: {
          allow_affiliates: boolean
          allow_service_providers: boolean
          base_price: number
          commission_percent: number
          max_commission_percent: number
          min_resale_price: number
          product_description: string
          product_id: string
          product_images: string[]
          product_name: string
          shipping_days: number
          stock: number
          supplier_avatar: string
          supplier_id: string
          supplier_name: string
        }[]
      }
      get_drop_clients_admin: {
        Args: never
        Returns: {
          business_name: string
          client_id: string
          client_name: string
          created_at: string
          drop_enabled: boolean
          products_count: number
          total_margin: number
          total_orders: number
          total_revenue: number
        }[]
      }
      get_drop_suppliers_admin: {
        Args: never
        Returns: {
          drop_enabled: boolean
          products_in_drop: number
          supplier_id: string
          supplier_name: string
          total_orders: number
          total_sales: number
        }[]
      }
      get_public_store_profile: {
        Args: { _id: string }
        Returns: {
          ativo: boolean
          banner_loja_url: string
          created_at: string
          descricao_loja: string
          foto_perfil_url: string
          id: string
          nome: string
        }[]
      }
      get_public_store_profiles: {
        Args: never
        Returns: {
          ativo: boolean
          banner_loja_url: string
          created_at: string
          descricao_loja: string
          foto_perfil_url: string
          id: string
          nome: string
        }[]
      }
      get_supplier_drop_stats: {
        Args: { _supplier_id: string }
        Returns: {
          pending_orders: number
          products_in_drop: number
          total_orders: number
          total_sales: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "http_request"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_delete:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_get:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
        SetofOptions: {
          from: "*"
          to: "http_header"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_list_curlopt: {
        Args: never
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_post:
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_reset_curlopt: { Args: never; Returns: boolean }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      regenerate_supplier_code: {
        Args: { _supplier_id: string }
        Returns: string
      }
      request_supplier_integration: { Args: { _code: string }; Returns: Json }
      respond_to_sp_request: {
        Args: { _approve: boolean; _request_id: string }
        Returns: Json
      }
      text_to_bytea: { Args: { data: string }; Returns: string }
      track_affiliate_click: {
        Args: {
          _buyer_id?: string
          _code: string
          _user_agent?: string
          _visitor_id?: string
        }
        Returns: Json
      }
      update_affiliate_earnings: {
        Args: { _affiliate_id: string; _amount: number }
        Returns: undefined
      }
      urlencode:
        | { Args: { data: Json }; Returns: string }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
    }
    Enums: {
      affiliate_status: "pending" | "active" | "suspended"
      app_role: "admin" | "fornecedor" | "cliente"
      collection_item_type: "product" | "supplier"
      commission_status: "pending" | "confirmed" | "paid" | "cancelled"
      coupon_type: "percentage" | "fixed"
      crm_contract_type: "single" | "monthly"
      notification_type:
        | "order_update"
        | "message"
        | "alert"
        | "payout"
        | "admin"
      order_status:
        | "pending"
        | "preparing"
        | "shipped"
        | "delivered"
        | "cancelled"
      payment_method: "pix" | "boleto" | "cartao"
      payment_status: "pending" | "paid" | "refunded" | "cancelled"
      payout_status: "requested" | "approved" | "paid" | "rejected"
      service_provider_status: "pending" | "active" | "suspended"
      support_status: "open" | "pending" | "closed"
      transaction_type: "sale" | "platform_fee" | "payout" | "refund"
      user_type: "cliente" | "fornecedor" | "admin"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      affiliate_status: ["pending", "active", "suspended"],
      app_role: ["admin", "fornecedor", "cliente"],
      collection_item_type: ["product", "supplier"],
      commission_status: ["pending", "confirmed", "paid", "cancelled"],
      coupon_type: ["percentage", "fixed"],
      crm_contract_type: ["single", "monthly"],
      notification_type: [
        "order_update",
        "message",
        "alert",
        "payout",
        "admin",
      ],
      order_status: [
        "pending",
        "preparing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      payment_method: ["pix", "boleto", "cartao"],
      payment_status: ["pending", "paid", "refunded", "cancelled"],
      payout_status: ["requested", "approved", "paid", "rejected"],
      service_provider_status: ["pending", "active", "suspended"],
      support_status: ["open", "pending", "closed"],
      transaction_type: ["sale", "platform_fee", "payout", "refund"],
      user_type: ["cliente", "fornecedor", "admin"],
    },
  },
} as const
