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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
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
      disputes: {
        Row: {
          admin_notes: string | null
          buyer_id: string
          created_at: string | null
          description: string | null
          id: string
          negotiation_id: string
          reason: string
          resolved_at: string | null
          status: string
          supplier_id: string
          supplier_responded_at: string | null
          supplier_response: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          buyer_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          negotiation_id: string
          reason?: string
          resolved_at?: string | null
          status?: string
          supplier_id: string
          supplier_responded_at?: string | null
          supplier_response?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          buyer_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          negotiation_id?: string
          reason?: string
          resolved_at?: string | null
          status?: string
          supplier_id?: string
          supplier_responded_at?: string | null
          supplier_response?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disputes_negotiation_id_fkey"
            columns: ["negotiation_id"]
            isOneToOne: false
            referencedRelation: "negotiations"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: string | null
          success: boolean
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          success?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          success?: boolean
        }
        Relationships: []
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
      negotiations: {
        Row: {
          agreed_price: number
          buyer_confirmed_delivery: boolean | null
          buyer_data: Json | null
          buyer_id: string
          cancel_reason: string | null
          created_at: string
          delivery_check_sent: boolean | null
          delivery_confirmed_at: string | null
          expected_delivery: string | null
          id: string
          invoice_url: string | null
          notes: string | null
          payment_confirmed_at: string | null
          payment_contested_reason: string | null
          payment_method: string
          payment_proof_url: string | null
          payment_reference: string | null
          payment_reported_at: string | null
          payment_state: string
          product_id: string | null
          product_name: string
          quantity: number
          refund_state: string
          sale_unit: string | null
          shipping_confirmed_at: string | null
          status: string
          supplier_confirmed_shipping: boolean | null
          supplier_id: string
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          agreed_price: number
          buyer_confirmed_delivery?: boolean | null
          buyer_data?: Json | null
          buyer_id: string
          cancel_reason?: string | null
          created_at?: string
          delivery_check_sent?: boolean | null
          delivery_confirmed_at?: string | null
          expected_delivery?: string | null
          id?: string
          invoice_url?: string | null
          notes?: string | null
          payment_confirmed_at?: string | null
          payment_contested_reason?: string | null
          payment_method?: string
          payment_proof_url?: string | null
          payment_reference?: string | null
          payment_reported_at?: string | null
          payment_state?: string
          product_id?: string | null
          product_name: string
          quantity?: number
          refund_state?: string
          sale_unit?: string | null
          shipping_confirmed_at?: string | null
          status?: string
          supplier_confirmed_shipping?: boolean | null
          supplier_id: string
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          agreed_price?: number
          buyer_confirmed_delivery?: boolean | null
          buyer_data?: Json | null
          buyer_id?: string
          cancel_reason?: string | null
          created_at?: string
          delivery_check_sent?: boolean | null
          delivery_confirmed_at?: string | null
          expected_delivery?: string | null
          id?: string
          invoice_url?: string | null
          notes?: string | null
          payment_confirmed_at?: string | null
          payment_contested_reason?: string | null
          payment_method?: string
          payment_proof_url?: string | null
          payment_reference?: string | null
          payment_reported_at?: string | null
          payment_state?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          refund_state?: string
          sale_unit?: string | null
          shipping_confirmed_at?: string | null
          status?: string
          supplier_confirmed_shipping?: boolean | null
          supplier_id?: string
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "negotiations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
          payment_confirmed_at: string | null
          payment_contested_reason: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_proof_url: string | null
          payment_reference: string | null
          payment_reported_at: string | null
          payment_state: string
          proof_url: string | null
          shipping_company: string | null
          subtotal: number
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
          payment_confirmed_at?: string | null
          payment_contested_reason?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_proof_url?: string | null
          payment_reference?: string | null
          payment_reported_at?: string | null
          payment_state?: string
          proof_url?: string | null
          shipping_company?: string | null
          subtotal: number
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
          payment_confirmed_at?: string | null
          payment_contested_reason?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_proof_url?: string | null
          payment_reference?: string | null
          payment_reported_at?: string | null
          payment_state?: string
          proof_url?: string | null
          shipping_company?: string | null
          subtotal?: number
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
      phone_verification_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string
          id: string
          phone: string
          user_id: string
          verified: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          phone: string
          user_id: string
          verified?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          phone?: string
          user_id?: string
          verified?: boolean | null
        }
        Relationships: []
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
      product_drafts: {
        Row: {
          created_at: string
          current_step: number
          draft_data: Json
          id: string
          sale_type: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_step?: number
          draft_data?: Json
          id?: string
          sale_type?: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_step?: number
          draft_data?: Json
          id?: string
          sale_type?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: []
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
      product_views: {
        Row: {
          created_at: string
          id: string
          product_id: string
          viewer_id: string | null
          visitor_fingerprint: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          viewer_id?: string | null
          visitor_fingerprint?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          viewer_id?: string | null
          visitor_fingerprint?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_views_product_id_fkey"
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
          age_group: string | null
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
          gender: string | null
          height_cm: number | null
          id: string
          imagens: string[] | null
          is_cnpj_only: boolean | null
          is_international: boolean | null
          is_kit: boolean | null
          keywords: string[] | null
          kit_items: Json | null
          material: string | null
          max_order_quantity: number | null
          min_order_quantity: number | null
          model: string | null
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
          warranty_days: number | null
          weight_grams: number | null
          what_is_in_the_box: string | null
          width_cm: number | null
        }
        Insert: {
          affiliate_commission_percent?: number | null
          age_group?: string | null
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
          gender?: string | null
          height_cm?: number | null
          id?: string
          imagens?: string[] | null
          is_cnpj_only?: boolean | null
          is_international?: boolean | null
          is_kit?: boolean | null
          keywords?: string[] | null
          kit_items?: Json | null
          material?: string | null
          max_order_quantity?: number | null
          min_order_quantity?: number | null
          model?: string | null
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
          warranty_days?: number | null
          weight_grams?: number | null
          what_is_in_the_box?: string | null
          width_cm?: number | null
        }
        Update: {
          affiliate_commission_percent?: number | null
          age_group?: string | null
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
          gender?: string | null
          height_cm?: number | null
          id?: string
          imagens?: string[] | null
          is_cnpj_only?: boolean | null
          is_international?: boolean | null
          is_kit?: boolean | null
          keywords?: string[] | null
          kit_items?: Json | null
          material?: string | null
          max_order_quantity?: number | null
          min_order_quantity?: number | null
          model?: string | null
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
          warranty_days?: number | null
          weight_grams?: number | null
          what_is_in_the_box?: string | null
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
          client_onboarding_completed: boolean | null
          created_at: string | null
          descricao_loja: string | null
          document: string | null
          email: string
          endereco_principal: Json | null
          foto_perfil_url: string | null
          id: string
          last_seen_at: string | null
          min_order_quantity: number | null
          min_order_value: number | null
          nome: string
          onboarding_completed: boolean | null
          phone_verified: boolean | null
          phone_verified_at: string | null
          pinned_suppliers: Json | null
          service_provider_code: string | null
          shipping_city: string | null
          shipping_state: string | null
          store_slug: string | null
          telefone: string | null
          tipo: Database["public"]["Enums"]["user_type"]
          tour_completed: boolean | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          banner_loja_url?: string | null
          client_onboarding_completed?: boolean | null
          created_at?: string | null
          descricao_loja?: string | null
          document?: string | null
          email: string
          endereco_principal?: Json | null
          foto_perfil_url?: string | null
          id: string
          last_seen_at?: string | null
          min_order_quantity?: number | null
          min_order_value?: number | null
          nome: string
          onboarding_completed?: boolean | null
          phone_verified?: boolean | null
          phone_verified_at?: string | null
          pinned_suppliers?: Json | null
          service_provider_code?: string | null
          shipping_city?: string | null
          shipping_state?: string | null
          store_slug?: string | null
          telefone?: string | null
          tipo: Database["public"]["Enums"]["user_type"]
          tour_completed?: boolean | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          banner_loja_url?: string | null
          client_onboarding_completed?: boolean | null
          created_at?: string | null
          descricao_loja?: string | null
          document?: string | null
          email?: string
          endereco_principal?: Json | null
          foto_perfil_url?: string | null
          id?: string
          last_seen_at?: string | null
          min_order_quantity?: number | null
          min_order_value?: number | null
          nome?: string
          onboarding_completed?: boolean | null
          phone_verified?: boolean | null
          phone_verified_at?: string | null
          pinned_suppliers?: Json | null
          service_provider_code?: string | null
          shipping_city?: string | null
          shipping_state?: string | null
          store_slug?: string | null
          telefone?: string | null
          tipo?: Database["public"]["Enums"]["user_type"]
          tour_completed?: boolean | null
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
      supplier_applications: {
        Row: {
          address_cep: string
          address_city: string
          address_complement: string | null
          address_neighborhood: string
          address_number: string
          address_state: string
          address_street: string
          business_description: string | null
          business_type: Database["public"]["Enums"]["business_type"]
          cnpj: string | null
          company_name: string | null
          cpf: string | null
          created_at: string
          document_back_url: string | null
          document_front_url: string | null
          extra_document_url: string | null
          full_name: string
          id: string
          phone: string
          product_category: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string | null
          status: Database["public"]["Enums"]["supplier_application_status"]
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_cep: string
          address_city: string
          address_complement?: string | null
          address_neighborhood: string
          address_number: string
          address_state: string
          address_street: string
          business_description?: string | null
          business_type: Database["public"]["Enums"]["business_type"]
          cnpj?: string | null
          company_name?: string | null
          cpf?: string | null
          created_at?: string
          document_back_url?: string | null
          document_front_url?: string | null
          extra_document_url?: string | null
          full_name: string
          id?: string
          phone: string
          product_category?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: Database["public"]["Enums"]["supplier_application_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_cep?: string
          address_city?: string
          address_complement?: string | null
          address_neighborhood?: string
          address_number?: string
          address_state?: string
          address_street?: string
          business_description?: string | null
          business_type?: Database["public"]["Enums"]["business_type"]
          cnpj?: string | null
          company_name?: string | null
          cpf?: string | null
          created_at?: string
          document_back_url?: string | null
          document_front_url?: string | null
          extra_document_url?: string | null
          full_name?: string
          id?: string
          phone?: string
          product_category?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: Database["public"]["Enums"]["supplier_application_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
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
      supplier_shipping_config: {
        Row: {
          created_at: string
          free_shipping_above: number | null
          id: string
          melhor_envio_token: string | null
          origin_cep: string | null
          origin_city: string | null
          origin_state: string | null
          supplier_id: string
          updated_at: string
          use_melhor_envio: boolean
        }
        Insert: {
          created_at?: string
          free_shipping_above?: number | null
          id?: string
          melhor_envio_token?: string | null
          origin_cep?: string | null
          origin_city?: string | null
          origin_state?: string | null
          supplier_id: string
          updated_at?: string
          use_melhor_envio?: boolean
        }
        Update: {
          created_at?: string
          free_shipping_above?: number | null
          id?: string
          melhor_envio_token?: string | null
          origin_cep?: string | null
          origin_city?: string | null
          origin_state?: string | null
          supplier_id?: string
          updated_at?: string
          use_melhor_envio?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "supplier_shipping_config_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_shipping_config_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: true
            referencedRelation: "public_supplier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_shipping_regions: {
        Row: {
          active: boolean
          allows_pickup: boolean
          created_at: string
          delivery_days_max: number | null
          delivery_days_min: number | null
          free_above: number | null
          id: string
          price: number
          region: Database["public"]["Enums"]["shipping_region"]
          supplier_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          allows_pickup?: boolean
          created_at?: string
          delivery_days_max?: number | null
          delivery_days_min?: number | null
          free_above?: number | null
          id?: string
          price?: number
          region: Database["public"]["Enums"]["shipping_region"]
          supplier_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          allows_pickup?: boolean
          created_at?: string
          delivery_days_max?: number | null
          delivery_days_min?: number | null
          free_above?: number | null
          id?: string
          price?: number
          region?: Database["public"]["Enums"]["shipping_region"]
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_shipping_regions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_shipping_regions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "public_supplier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_subscriptions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          notes: string | null
          payment_confirmed_by: string | null
          payment_method: string | null
          plan_name: string
          price: number
          started_at: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          supplier_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          payment_confirmed_by?: string | null
          payment_method?: string | null
          plan_name?: string
          price?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          supplier_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          payment_confirmed_by?: string | null
          payment_method?: string | null
          plan_name?: string
          price?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_subscriptions_payment_confirmed_by_fkey"
            columns: ["payment_confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_subscriptions_payment_confirmed_by_fkey"
            columns: ["payment_confirmed_by"]
            isOneToOne: false
            referencedRelation: "public_supplier_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_subscriptions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_subscriptions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "public_supplier_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      admin_approve_supplier_application: {
        Args: { _application_id: string }
        Returns: boolean
      }
      admin_confirm_subscription: {
        Args: { _admin_id: string; _notes?: string; _subscription_id: string }
        Returns: undefined
      }
      admin_reject_supplier_application: {
        Args: { _application_id: string; _reason: string }
        Returns: boolean
      }
      admin_resolve_negotiation_dispute: {
        Args: { p_action: string; p_admin_notes?: string; p_dispute_id: string }
        Returns: undefined
      }
      admin_update_report: {
        Args: { _report_id: string; _status: string }
        Returns: boolean
      }
      admin_update_support_ticket: {
        Args: { _resposta_admin?: string; _status?: string; _ticket_id: string }
        Returns: boolean
      }
      bytea_to_text: { Args: { data: string }; Returns: string }
      check_chat_message_limit: { Args: { _user_id: string }; Returns: Json }
      check_login_blocked: { Args: { _email: string }; Returns: Json }
      cleanup_old_push_logs: { Args: never; Returns: undefined }
      format_brl: { Args: { value: number }; Returns: string }
      generate_order_number: { Args: never; Returns: string }
      generate_store_slug: { Args: { store_name: string }; Returns: string }
      get_admin_chat_messages: {
        Args: { _chat_id: string }
        Returns: {
          created_at: string
          from_name: string
          from_user: string
          id: string
          text: string
          to_name: string
          to_user: string
        }[]
      }
      get_admin_conversations: {
        Args: { _search?: string }
        Returns: {
          chat_id: string
          last_message: string
          last_message_at: string
          message_count: number
          user1_id: string
          user1_name: string
          user2_id: string
          user2_name: string
        }[]
      }
      get_admin_disputes: {
        Args: never
        Returns: {
          admin_notes: string
          agreed_price: number
          buyer_data: Json
          buyer_id: string
          buyer_name: string
          created_at: string
          description: string
          id: string
          invoice_url: string
          negotiation_id: string
          negotiation_status: string
          payment_contested_reason: string
          payment_method: string
          payment_proof_url: string
          payment_reference: string
          payment_state: string
          product_name: string
          quantity: number
          reason: string
          resolved_at: string
          status: string
          supplier_id: string
          supplier_name: string
          supplier_responded_at: string
          supplier_response: string
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
          telefone: string
          tipo: string
        }[]
      }
      get_admin_reports: {
        Args: never
        Returns: {
          created_at: string
          description: string
          id: string
          reason: string
          reporter_id: string
          reporter_name: string
          status: string
          target_id: string
          target_type: string
        }[]
      }
      get_admin_stats: {
        Args: never
        Returns: {
          active_suppliers: number
          total_orders: number
          total_revenue: number
          total_users: number
        }[]
      }
      get_admin_subscriptions: {
        Args: never
        Returns: {
          created_at: string
          expires_at: string
          id: string
          notes: string
          payment_method: string
          plan_name: string
          price: number
          started_at: string
          status: string
          supplier_email: string
          supplier_id: string
          supplier_name: string
        }[]
      }
      get_admin_supplier_applications: {
        Args: never
        Returns: {
          address_cep: string
          address_city: string
          address_complement: string
          address_neighborhood: string
          address_number: string
          address_state: string
          address_street: string
          business_description: string
          business_type: Database["public"]["Enums"]["business_type"]
          cnpj: string
          company_name: string
          cpf: string
          created_at: string
          document_back_url: string
          document_front_url: string
          extra_document_url: string
          full_name: string
          id: string
          phone: string
          product_category: string
          rejection_reason: string
          reviewed_at: string
          reviewed_by: string
          selfie_url: string
          status: Database["public"]["Enums"]["supplier_application_status"]
          submitted_at: string
          updated_at: string
          user_email: string
          user_id: string
          user_name: string
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
      get_chat_participant_profiles: {
        Args: { _user_ids: string[] }
        Returns: {
          foto_perfil_url: string
          id: string
          nome: string
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
      get_my_activity_logs: {
        Args: never
        Returns: {
          action: string
          created_at: string
          description: string
          id: string
          ip_address: string
          user_agent: string
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
      get_story_views: {
        Args: { _story_id: string }
        Returns: {
          viewed_at: string
          viewer_id: string
          viewer_name: string
          viewer_photo: string
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
      get_supplier_product_views: {
        Args: { _supplier_id: string }
        Returns: {
          total_views: number
          views_last_30_days: number
        }[]
      }
      get_supplier_subscription: {
        Args: { _supplier_id: string }
        Returns: {
          days_remaining: number
          expires_at: string
          id: string
          plan_name: string
          price: number
          started_at: string
          status: string
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
      is_supplier_verified: { Args: { _supplier_id: string }; Returns: boolean }
      log_activity: {
        Args: {
          _action: string
          _description?: string
          _ip_address?: string
          _user_agent?: string
          _user_id: string
        }
        Returns: undefined
      }
      record_login_attempt: {
        Args: { _email: string; _ip_address?: string; _success: boolean }
        Returns: undefined
      }
      text_to_bytea: { Args: { data: string }; Returns: string }
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
      app_role: "admin" | "fornecedor" | "cliente"
      business_type: "individual" | "company"
      collection_item_type: "product" | "supplier"
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
      payout_status: "requested" | "approved" | "paid" | "rejected"
      proposal_status: "pending" | "accepted" | "rejected"
      quotation_status: "open" | "closed" | "cancelled"
      service_provider_status: "pending" | "active" | "suspended"
      shipping_region: "norte" | "nordeste" | "centro_oeste" | "sudeste" | "sul"
      subscription_status: "active" | "pending" | "expired" | "cancelled"
      supplier_application_status:
        | "pending"
        | "under_review"
        | "approved"
        | "rejected"
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
      app_role: ["admin", "fornecedor", "cliente"],
      business_type: ["individual", "company"],
      collection_item_type: ["product", "supplier"],
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
      payout_status: ["requested", "approved", "paid", "rejected"],
      proposal_status: ["pending", "accepted", "rejected"],
      quotation_status: ["open", "closed", "cancelled"],
      service_provider_status: ["pending", "active", "suspended"],
      shipping_region: ["norte", "nordeste", "centro_oeste", "sudeste", "sul"],
      subscription_status: ["active", "pending", "expired", "cancelled"],
      supplier_application_status: [
        "pending",
        "under_review",
        "approved",
        "rejected",
      ],
      support_status: ["open", "pending", "closed"],
      transaction_type: ["sale", "platform_fee", "payout", "refund"],
      user_type: ["cliente", "fornecedor", "admin"],
    },
  },
} as const
