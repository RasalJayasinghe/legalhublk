-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'partner', 'pro_user', 'free_user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
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

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create partner_applications table
CREATE TABLE public.partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  firm_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  website TEXT,
  practice_areas TEXT[] NOT NULL,
  years_in_practice INTEGER,
  firm_size TEXT,
  partnership_type TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- RLS policies for partner_applications
CREATE POLICY "Users can view their own applications"
  ON public.partner_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications"
  ON public.partner_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications"
  ON public.partner_applications FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all applications"
  ON public.partner_applications FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create partner_profiles table
CREATE TABLE public.partner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  firm_name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  practice_areas TEXT[] NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  website TEXT,
  address TEXT,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  total_documents INTEGER NOT NULL DEFAULT 0,
  total_views INTEGER NOT NULL DEFAULT 0,
  total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for partner_profiles
CREATE POLICY "Anyone can view active partner profiles"
  ON public.partner_profiles FOR SELECT
  USING (is_active = true);

CREATE POLICY "Partners can view their own profile"
  ON public.partner_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Partners can update their own profile"
  ON public.partner_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profiles"
  ON public.partner_profiles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create subscription_plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  billing_period TEXT NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  max_documents INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_plans
CREATE POLICY "Anyone can view active subscription plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans"
  ON public.subscription_plans FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price, billing_period, features, max_documents) VALUES
  ('Free', 'Access to public legal documents', 0.00, 'monthly', '["Access to public documents", "Basic search", "Document viewer"]'::jsonb, NULL),
  ('Pro', 'Full access to all premium legal documents', 29.99, 'monthly', '["All Free features", "Access to premium partner documents", "Advanced search", "Unlimited downloads", "Priority support"]'::jsonb, NULL),
  ('Enterprise', 'Custom solution for law firms', 299.99, 'monthly', '["All Pro features", "Custom integrations", "Dedicated support", "Team management", "Analytics dashboard"]'::jsonb, NULL);

-- Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_subscriptions
CREATE POLICY "Users can view their own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create partner_documents table
CREATE TABLE public.partner_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  preview_image_url TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT true,
  access_level TEXT NOT NULL DEFAULT 'pro',
  views_count INTEGER NOT NULL DEFAULT 0,
  downloads_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for partner_documents
CREATE POLICY "Anyone can view published partner documents metadata"
  ON public.partner_documents FOR SELECT
  USING (status = 'published');

CREATE POLICY "Partners can manage their own documents"
  ON public.partner_documents FOR ALL
  USING (
    partner_id IN (
      SELECT id FROM public.partner_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all partner documents"
  ON public.partner_documents FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create document_views table for analytics
CREATE TABLE public.document_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.partner_documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT
);

ALTER TABLE public.document_views ENABLE ROW LEVEL SECURITY;

-- RLS policies for document_views
CREATE POLICY "Users can view their own document views"
  ON public.document_views FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert document views"
  ON public.document_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Partners can view their document analytics"
  ON public.document_views FOR SELECT
  USING (
    document_id IN (
      SELECT pd.id FROM public.partner_documents pd
      JOIN public.partner_profiles pp ON pd.partner_id = pp.id
      WHERE pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all document views"
  ON public.document_views FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for partner documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('partner-documents', 'partner-documents', false);

-- Storage policies for partner documents
CREATE POLICY "Partners can upload their own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'partner-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Partners can update their own documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'partner-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Partners can delete their own documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'partner-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Pro users can view partner documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'partner-documents' AND
    (
      public.has_role(auth.uid(), 'pro_user') OR
      public.has_role(auth.uid(), 'partner') OR
      public.has_role(auth.uid(), 'admin')
    )
  );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_partner_applications_updated_at
  BEFORE UPDATE ON public.partner_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partner_profiles_updated_at
  BEFORE UPDATE ON public.partner_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partner_documents_updated_at
  BEFORE UPDATE ON public.partner_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();