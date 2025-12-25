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
      products: {
        Row: {
          ativo: boolean | null
          categoria_id: string | null
          created_at: string | null
          descricao_curta: string | null
          descricao_longa: string | null
          dimensoes: Json | null
          estoque: number
          id: string
          imagens: string[] | null
          nome: string
          peso: number | null
          preco: number
          rating_medio: number | null
          supplier_id: string
          total_reviews: number | null
          updated_at: string | null
          variacoes: Json | null
          vendas_count: number | null
        }
        Insert: {
          ativo?: boolean | null
          categoria_id?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          descricao_longa?: string | null
          dimensoes?: Json | null
          estoque?: number
          id?: string
          imagens?: string[] | null
          nome: string
          peso?: number | null
          preco: number
          rating_medio?: number | null
          supplier_id: string
          total_reviews?: number | null
          updated_at?: string | null
          variacoes?: Json | null
          vendas_count?: number | null
        }
        Update: {
          ativo?: boolean | null
          categoria_id?: string | null
          created_at?: string | null
          descricao_curta?: string | null
          descricao_longa?: string | null
          dimensoes?: Json | null
          estoque?: number
          id?: string
          imagens?: string[] | null
          nome?: string
          peso?: number | null
          preco?: number
          rating_medio?: number | null
          supplier_id?: string
          total_reviews?: number | null
          updated_at?: string | null
          variacoes?: Json | null
          vendas_count?: number | null
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
          nome: string
          onboarding_completed: boolean | null
          pix_key: string | null
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
          nome: string
          onboarding_completed?: boolean | null
          pix_key?: string | null
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
          nome?: string
          onboarding_completed?: boolean | null
          pix_key?: string | null
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
      admin_update_support_ticket: {
        Args: {
          _resposta_admin?: string
          _status?: Database["public"]["Enums"]["support_status"]
          _ticket_id: string
        }
        Returns: boolean
      }
      bytea_to_text: { Args: { data: string }; Returns: string }
      generate_order_number: { Args: never; Returns: string }
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
      coupon_type: "percentage" | "fixed"
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
      coupon_type: ["percentage", "fixed"],
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
      support_status: ["open", "pending", "closed"],
      transaction_type: ["sale", "platform_fee", "payout", "refund"],
      user_type: ["cliente", "fornecedor", "admin"],
    },
  },
} as const
