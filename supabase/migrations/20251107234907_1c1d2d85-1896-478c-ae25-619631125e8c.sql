-- =============================================
-- NELLOR MARKETPLACE - DATABASE SCHEMA
-- =============================================

-- 1. CREATE ENUMS
CREATE TYPE public.user_type AS ENUM ('cliente', 'fornecedor', 'admin');
CREATE TYPE public.app_role AS ENUM ('admin', 'fornecedor', 'cliente');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'refunded', 'cancelled');
CREATE TYPE public.order_status AS ENUM ('pending', 'preparing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE public.payment_method AS ENUM ('pix', 'boleto', 'cartao');
CREATE TYPE public.transaction_type AS ENUM ('sale', 'platform_fee', 'payout', 'refund');
CREATE TYPE public.payout_status AS ENUM ('requested', 'approved', 'paid', 'rejected');
CREATE TYPE public.coupon_type AS ENUM ('percentage', 'fixed');
CREATE TYPE public.notification_type AS ENUM ('order_update', 'message', 'alert', 'payout', 'admin');
CREATE TYPE public.support_status AS ENUM ('open', 'pending', 'closed');

-- =============================================
-- 2. USER ROLES TABLE (Security Critical)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 3. PROFILES TABLE
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  tipo user_type NOT NULL,
  document TEXT,
  telefone TEXT,
  pix_key TEXT,
  stripe_account_id TEXT,
  foto_perfil_url TEXT,
  banner_loja_url TEXT,
  descricao_loja TEXT,
  endereco_principal JSONB,
  onboarding_completed BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, tipo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'tipo')::user_type, 'cliente')
  );
  
  -- Auto-assign role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'tipo')::app_role, 'cliente')
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 4. CATEGORIES TABLE
-- =============================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  imagem_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 5. PRODUCTS TABLE
-- =============================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  descricao_curta TEXT,
  descricao_longa TEXT,
  preco DECIMAL(10,2) NOT NULL CHECK (preco >= 0),
  estoque INTEGER NOT NULL DEFAULT 0 CHECK (estoque >= 0),
  categoria_id UUID REFERENCES public.categories(id),
  variacoes JSONB,
  imagens TEXT[] DEFAULT '{}',
  ativo BOOLEAN DEFAULT true,
  rating_medio DECIMAL(3,2) DEFAULT 0 CHECK (rating_medio >= 0 AND rating_medio <= 5),
  total_reviews INTEGER DEFAULT 0,
  peso DECIMAL(10,2),
  dimensoes JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone"
  ON public.products FOR SELECT
  USING (ativo = true OR supplier_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Suppliers can manage their own products"
  ON public.products FOR ALL
  USING (supplier_id = auth.uid() AND public.has_role(auth.uid(), 'fornecedor'));

CREATE POLICY "Admins can manage all products"
  ON public.products FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create index for better performance
CREATE INDEX idx_products_supplier ON public.products(supplier_id);
CREATE INDEX idx_products_category ON public.products(categoria_id);
CREATE INDEX idx_products_ativo ON public.products(ativo);

-- =============================================
-- 6. ORDERS TABLE
-- =============================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  itens JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  frete DECIMAL(10,2) DEFAULT 0,
  desconto DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  endereco_entrega JSONB NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  order_status order_status DEFAULT 'pending',
  tracking_code TEXT,
  proof_url TEXT,
  shipping_company TEXT,
  estimated_delivery DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view their own orders"
  ON public.orders FOR SELECT
  USING (buyer_id = auth.uid());

CREATE POLICY "Suppliers can view their orders"
  ON public.orders FOR SELECT
  USING (supplier_id = auth.uid());

CREATE POLICY "Buyers can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Suppliers can update their orders"
  ON public.orders FOR UPDATE
  USING (supplier_id = auth.uid());

CREATE POLICY "Buyers can update payment proof"
  ON public.orders FOR UPDATE
  USING (buyer_id = auth.uid());

CREATE POLICY "Admins can manage all orders"
  ON public.orders FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Generate unique order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'PED' || LPAD(FLOOR(RANDOM() * 999999999)::TEXT, 9, '0');
END;
$$;

-- Auto-generate order number
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := public.generate_order_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_order_number();

CREATE INDEX idx_orders_buyer ON public.orders(buyer_id);
CREATE INDEX idx_orders_supplier ON public.orders(supplier_id);
CREATE INDEX idx_orders_status ON public.orders(order_status);

-- =============================================
-- 7. MESSAGES TABLE
-- =============================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id TEXT NOT NULL,
  from_user UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  to_user UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
  ON public.messages FOR SELECT
  USING (from_user = auth.uid() OR to_user = auth.uid());

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (from_user = auth.uid());

CREATE POLICY "Users can mark messages as read"
  ON public.messages FOR UPDATE
  USING (to_user = auth.uid());

CREATE POLICY "Admins can view all messages"
  ON public.messages FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_messages_chat ON public.messages(chat_id);
CREATE INDEX idx_messages_from ON public.messages(from_user);
CREATE INDEX idx_messages_to ON public.messages(to_user);

-- =============================================
-- 8. TRANSACTIONS TABLE
-- =============================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  type transaction_type NOT NULL,
  status payment_status DEFAULT 'pending',
  method payment_method,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can view their transactions"
  ON public.transactions FOR SELECT
  USING (supplier_id = auth.uid());

CREATE POLICY "Admins can manage all transactions"
  ON public.transactions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_transactions_supplier ON public.transactions(supplier_id);
CREATE INDEX idx_transactions_order ON public.transactions(order_id);

-- =============================================
-- 9. PAYOUTS TABLE
-- =============================================
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  pix_key TEXT NOT NULL,
  status payout_status DEFAULT 'requested',
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can view their payouts"
  ON public.payouts FOR SELECT
  USING (supplier_id = auth.uid());

CREATE POLICY "Suppliers can create payouts"
  ON public.payouts FOR INSERT
  WITH CHECK (supplier_id = auth.uid() AND public.has_role(auth.uid(), 'fornecedor'));

CREATE POLICY "Admins can manage all payouts"
  ON public.payouts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_payouts_supplier ON public.payouts(supplier_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);

-- =============================================
-- 10. REVIEWS TABLE
-- =============================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, buyer_id, order_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Buyers can create reviews for their orders"
  ON public.reviews FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Buyers can update their own reviews"
  ON public.reviews FOR UPDATE
  USING (buyer_id = auth.uid());

CREATE POLICY "Admins can manage all reviews"
  ON public.reviews FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_reviews_product ON public.reviews(product_id);
CREATE INDEX idx_reviews_buyer ON public.reviews(buyer_id);

-- Update product rating when review is added/updated
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.products
  SET 
    rating_medio = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM public.reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_product_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_product_rating();

-- =============================================
-- 11. COUPONS TABLE
-- =============================================
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  codigo TEXT NOT NULL,
  tipo coupon_type NOT NULL,
  valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
  expira_em TIMESTAMPTZ,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supplier_id, codigo)
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active coupons are viewable by everyone"
  ON public.coupons FOR SELECT
  USING (ativo = true AND (expira_em IS NULL OR expira_em > now()));

CREATE POLICY "Suppliers can manage their coupons"
  ON public.coupons FOR ALL
  USING (supplier_id = auth.uid() AND public.has_role(auth.uid(), 'fornecedor'));

CREATE POLICY "Admins can manage all coupons"
  ON public.coupons FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_coupons_supplier ON public.coupons(supplier_id);
CREATE INDEX idx_coupons_codigo ON public.coupons(codigo);

-- =============================================
-- 12. NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  type notification_type NOT NULL,
  sound BOOLEAN DEFAULT false,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can mark their notifications as read"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);

-- =============================================
-- 13. ANALYTICS TABLE
-- =============================================
CREATE TABLE public.analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_vendas DECIMAL(10,2) DEFAULT 0,
  total_pedidos INTEGER DEFAULT 0,
  ticket_medio DECIMAL(10,2) DEFAULT 0,
  lucro_estimado DECIMAL(10,2) DEFAULT 0,
  mes_referencia DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supplier_id, mes_referencia)
);

ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can view their analytics"
  ON public.analytics FOR SELECT
  USING (supplier_id = auth.uid());

CREATE POLICY "Admins can view all analytics"
  ON public.analytics FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_analytics_supplier ON public.analytics(supplier_id);
CREATE INDEX idx_analytics_mes ON public.analytics(mes_referencia);

-- =============================================
-- 14. BANNERS TABLE
-- =============================================
CREATE TABLE public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  link_url TEXT,
  ativo BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active banners are viewable by everyone"
  ON public.banners FOR SELECT
  USING (ativo = true);

CREATE POLICY "Admins can manage banners"
  ON public.banners FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_banners_ativo ON public.banners(ativo);
CREATE INDEX idx_banners_order ON public.banners(order_index);

-- =============================================
-- 15. SUPPORT TICKETS TABLE
-- =============================================
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  assunto TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  status support_status DEFAULT 'open',
  resposta_admin TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets"
  ON public.support_tickets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all tickets"
  ON public.support_tickets FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_support_user ON public.support_tickets(user_id);
CREATE INDEX idx_support_status ON public.support_tickets(status);

-- =============================================
-- AUTOMATION TRIGGERS
-- =============================================

-- Update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notification automation for orders
CREATE OR REPLACE FUNCTION public.notify_order_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_title TEXT;
  notification_body TEXT;
BEGIN
  -- New order notification to supplier
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, title, body, type, sound, data)
    VALUES (
      NEW.supplier_id,
      'Novo Pedido Recebido!',
      'Você recebeu um novo pedido #' || NEW.order_number,
      'order_update',
      true,
      jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number)
    );
    
    -- Notification to buyer
    INSERT INTO public.notifications (user_id, title, body, type, sound, data)
    VALUES (
      NEW.buyer_id,
      'Pedido Criado!',
      'Seu pedido #' || NEW.order_number || ' foi criado com sucesso',
      'order_update',
      true,
      jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number)
    );
  END IF;
  
  -- Order status change notification
  IF TG_OP = 'UPDATE' AND OLD.order_status != NEW.order_status THEN
    notification_title := CASE NEW.order_status
      WHEN 'preparing' THEN 'Pedido em Preparação'
      WHEN 'shipped' THEN 'Pedido Enviado!'
      WHEN 'delivered' THEN 'Pedido Entregue!'
      WHEN 'cancelled' THEN 'Pedido Cancelado'
      ELSE 'Atualização do Pedido'
    END;
    
    notification_body := CASE NEW.order_status
      WHEN 'preparing' THEN 'Seu pedido #' || NEW.order_number || ' está sendo preparado'
      WHEN 'shipped' THEN 'Seu pedido #' || NEW.order_number || ' foi enviado! Código: ' || COALESCE(NEW.tracking_code, 'N/A')
      WHEN 'delivered' THEN 'Seu pedido #' || NEW.order_number || ' foi entregue!'
      WHEN 'cancelled' THEN 'Seu pedido #' || NEW.order_number || ' foi cancelado'
      ELSE 'Status atualizado para: ' || NEW.order_status
    END;
    
    INSERT INTO public.notifications (user_id, title, body, type, sound, data)
    VALUES (
      NEW.buyer_id,
      notification_title,
      notification_body,
      'order_update',
      true,
      jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'status', NEW.order_status)
    );
  END IF;
  
  -- Payment confirmation notification
  IF TG_OP = 'UPDATE' AND OLD.payment_status != NEW.payment_status AND NEW.payment_status = 'paid' THEN
    INSERT INTO public.notifications (user_id, title, body, type, sound, data)
    VALUES (
      NEW.supplier_id,
      'Pagamento Confirmado!',
      'Pagamento do pedido #' || NEW.order_number || ' foi confirmado',
      'order_update',
      true,
      jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER order_notification_trigger
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_order_changes();

-- Notification for new messages
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sender_name TEXT;
BEGIN
  SELECT nome INTO sender_name FROM public.profiles WHERE id = NEW.from_user;
  
  INSERT INTO public.notifications (user_id, title, body, type, sound, data)
  VALUES (
    NEW.to_user,
    'Nova Mensagem',
    sender_name || ' enviou uma mensagem',
    'message',
    true,
    jsonb_build_object('chat_id', NEW.chat_id, 'from_user', NEW.from_user)
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER message_notification_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- Notification for payout requests
CREATE OR REPLACE FUNCTION public.notify_payout_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- New payout request to admin
  IF TG_OP = 'INSERT' THEN
    -- Notify all admins
    INSERT INTO public.notifications (user_id, title, body, type, sound, data)
    SELECT 
      ur.user_id,
      'Nova Solicitação de Saque',
      'Fornecedor solicitou saque de R$ ' || NEW.amount,
      'payout',
      true,
      jsonb_build_object('payout_id', NEW.id, 'amount', NEW.amount)
    FROM public.user_roles ur
    WHERE ur.role = 'admin';
  END IF;
  
  -- Payout status change notification to supplier
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO public.notifications (user_id, title, body, type, sound, data)
    VALUES (
      NEW.supplier_id,
      CASE NEW.status
        WHEN 'approved' THEN 'Saque Aprovado!'
        WHEN 'paid' THEN 'Saque Realizado!'
        WHEN 'rejected' THEN 'Saque Recusado'
        ELSE 'Atualização de Saque'
      END,
      CASE NEW.status
        WHEN 'approved' THEN 'Seu saque de R$ ' || NEW.amount || ' foi aprovado'
        WHEN 'paid' THEN 'Seu saque de R$ ' || NEW.amount || ' foi realizado!'
        WHEN 'rejected' THEN 'Seu saque foi recusado. ' || COALESCE(NEW.admin_note, '')
        ELSE 'Status do saque atualizado'
      END,
      'payout',
      true,
      jsonb_build_object('payout_id', NEW.id, 'status', NEW.status, 'amount', NEW.amount)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER payout_notification_trigger
  AFTER INSERT OR UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION public.notify_payout_changes();

-- Auto-generate tracking code when order is shipped
CREATE OR REPLACE FUNCTION public.generate_tracking_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.order_status = 'shipped' AND (OLD.order_status IS NULL OR OLD.order_status != 'shipped') AND NEW.tracking_code IS NULL THEN
    NEW.tracking_code := 'BR' || LPAD(FLOOR(RANDOM() * 999999999999)::TEXT, 12, '0') || 'NL';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_tracking_trigger
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_tracking_code();

-- Update supplier analytics on new sale
CREATE OR REPLACE FUNCTION public.update_supplier_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month DATE;
BEGIN
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    
    INSERT INTO public.analytics (supplier_id, total_vendas, total_pedidos, ticket_medio, mes_referencia)
    VALUES (
      NEW.supplier_id,
      NEW.total,
      1,
      NEW.total,
      current_month
    )
    ON CONFLICT (supplier_id, mes_referencia)
    DO UPDATE SET
      total_vendas = analytics.total_vendas + NEW.total,
      total_pedidos = analytics.total_pedidos + 1,
      ticket_medio = (analytics.total_vendas + NEW.total) / (analytics.total_pedidos + 1);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_analytics_trigger
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_supplier_analytics();