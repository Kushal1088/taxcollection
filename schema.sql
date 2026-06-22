-- Tax Collection Management System Database Schema (With Advanced Enhancements)
-- Target Platform: Supabase / PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. DROP EXISTING TABLES FOR CLEAN REBUILD
-- ==========================================
DROP TABLE IF EXISTS public.tax_notices CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.tax_records CASCADE;
DROP TABLE IF EXISTS public.tax_templates CASCADE;
DROP TABLE IF EXISTS public.property_transfers CASCADE;
DROP TABLE IF EXISTS public.property_verifications CASCADE;
DROP TABLE IF EXISTS public.property_documents CASCADE;
DROP TABLE IF EXISTS public.property_photos CASCADE;
DROP TABLE IF EXISTS public.properties CASCADE;
DROP TABLE IF EXISTS public.citizen_requests CASCADE;
DROP TABLE IF EXISTS public.collectors CASCADE;
DROP TABLE IF EXISTS public.wards CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop Sequences
DROP SEQUENCE IF EXISTS property_number_seq;
DROP SEQUENCE IF EXISTS receipt_number_seq;

-- ==========================================
-- 2. SEQUENCES FOR UNIQUE SEQUENTIAL ID GENERATION
-- ==========================================
CREATE SEQUENCE property_number_seq START WITH 1;
CREATE SEQUENCE receipt_number_seq START WITH 1;

-- ==========================================
-- 3. TABLE DEFINITIONS
-- ==========================================

-- Public Users table (linked to auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    mobile_number TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'collector', 'citizen')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Wards table
CREATE TABLE public.wards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Collectors table (extra details for collectors)
CREATE TABLE public.collectors (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    ward_id UUID REFERENCES public.wards(id) ON DELETE SET NULL,
    area TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Citizen Registration Requests table
CREATE TABLE public.citizen_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    aadhaar_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_admin_review' 
        CHECK (status IN ('pending_admin_review', 'assigned_to_collector', 'verification_completed', 'approved', 'rejected')),
    ward_id UUID REFERENCES public.wards(id) ON DELETE SET NULL,
    collector_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Properties table
CREATE TABLE public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.citizen_requests(id) ON DELETE SET NULL,
    citizen_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    collector_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ward_id UUID REFERENCES public.wards(id) ON DELETE SET NULL,
    
    -- Survey details
    ulb TEXT NOT NULL,
    property_number TEXT UNIQUE, -- Assigned upon Admin Approval
    owner_name TEXT NOT NULL,
    owner_phone TEXT NOT NULL,
    owner_photo_url TEXT,
    aadhaar_url TEXT,
    
    property_type TEXT NOT NULL CHECK (property_type IN ('Residential', 'Commercial', 'Industrial', 'Mixed Use')),
    usage_type TEXT NOT NULL,
    construction_type TEXT NOT NULL,
    number_of_floors INTEGER NOT NULL CHECK (number_of_floors >= 0),
    construction_year INTEGER NOT NULL,
    occupancy_status TEXT NOT NULL CHECK (occupancy_status IN ('Owner Occupied', 'Rented', 'Vacant')),
    status TEXT NOT NULL DEFAULT 'Registration Pending' 
        CHECK (status IN ('Registration Pending', 'Assigned To Collector', 'Survey In Progress', 'Verification Completed', 'Approved', 'Rejected', 'Tax Active', 'Tax Closed')),
    rejection_reason TEXT,
    
    -- Address
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    
    -- Metrics
    total_area NUMERIC NOT NULL CHECK (total_area >= 0),
    built_up_area NUMERIC NOT NULL CHECK (built_up_area >= 0),
    latitude NUMERIC,
    longitude NUMERIC,
    remarks TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Property photos (multiple images)
CREATE TABLE public.property_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Property documents
CREATE TABLE public.property_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    document_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Property ownership transfers table
CREATE TABLE public.property_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    previous_owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    new_owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    transfer_date TIMESTAMPTZ DEFAULT now() NOT NULL,
    transfer_reason TEXT NOT NULL,
    approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tax templates table (for defaults)
CREATE TABLE public.tax_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_type TEXT UNIQUE NOT NULL CHECK (property_type IN ('Residential', 'Commercial', 'Industrial', 'Mixed Use')),
    default_amount NUMERIC NOT NULL CHECK (default_amount >= 0)
);

-- Tax Records table (multiple years of tax history)
CREATE TABLE public.tax_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    financial_year TEXT NOT NULL, -- e.g. '2025-26', '2026-27'
    tax_amount NUMERIC NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    penalty NUMERIC NOT NULL DEFAULT 0 CHECK (penalty >= 0),
    final_amount NUMERIC NOT NULL DEFAULT 0 CHECK (final_amount >= 0),
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Overdue', 'Partial Payment')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(property_id, financial_year)
);

-- Payments table (manual verification via proof upload)
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_record_id UUID NOT NULL REFERENCES public.tax_records(id) ON DELETE CASCADE,
    tax_bill_number TEXT NOT NULL,
    receipt_number TEXT UNIQUE, -- Generated upon Verification
    amount NUMERIC NOT NULL CHECK (amount > 0),
    payment_date TIMESTAMPTZ DEFAULT now() NOT NULL,
    payment_mode TEXT NOT NULL CHECK (payment_mode IN ('Cash', 'UPI', 'Card', 'Net Banking')),
    transaction_id TEXT NOT NULL UNIQUE,
    proof_url TEXT, -- Screenshot of transaction
    status TEXT NOT NULL DEFAULT 'Pending Verification' CHECK (status IN ('Pending Verification', 'Verified', 'Rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tax Notice system
CREATE TABLE public.tax_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    notice_type TEXT NOT NULL CHECK (notice_type IN ('Tax Due Soon', 'Tax Overdue', 'Penalty Applied', 'Final Notice')),
    message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Audit Logs table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    performed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==========================================
-- 4. DATABASE INDEXES FOR 100K+ SCALABILITY
-- ==========================================
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_status ON public.users(status);
CREATE INDEX idx_properties_citizen ON public.properties(citizen_id);
CREATE INDEX idx_properties_collector ON public.properties(collector_id);
CREATE INDEX idx_properties_ward ON public.properties(ward_id);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_number ON public.properties(property_number);
CREATE INDEX idx_tax_records_property ON public.tax_records(property_id);
CREATE INDEX idx_tax_records_fy ON public.tax_records(financial_year);
CREATE INDEX idx_tax_records_status ON public.tax_records(status);
CREATE INDEX idx_payments_tax_record ON public.payments(tax_record_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_property_transfers_property ON public.property_transfers(property_id);
CREATE INDEX idx_tax_notices_property_active ON public.tax_notices(property_id, is_active);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp);

-- ==========================================
-- 5. TRIGGERS & PROCEDURES
-- ==========================================

-- Trigger: auto-sync auth.users to public.users on signup and create citizen request
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'citizen');

  -- 1. Insert user profile
  INSERT INTO public.users (id, full_name, email, mobile_number, role, status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Citizen User'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'mobile_number', ''),
    v_role,
    'active'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Handle citizen_requests updates (collector assignment or rejection)
CREATE OR REPLACE FUNCTION public.handle_citizen_request_update()
RETURNS TRIGGER AS $$
BEGIN
  -- When request is approved and assigned to collector
  IF NEW.status = 'assigned_to_collector' AND OLD.status = 'pending_admin_review' THEN
    -- Check if property already exists for this request
    IF NOT EXISTS (SELECT 1 FROM public.properties WHERE request_id = NEW.id) THEN
      INSERT INTO public.properties (
        request_id, citizen_id, collector_id, ward_id, ulb, owner_name, owner_phone,
        property_type, usage_type, construction_type, number_of_floors, construction_year,
        occupancy_status, status, address, city, state, pincode, total_area, built_up_area
      ) VALUES (
        NEW.id,
        NEW.citizen_id,
        NEW.collector_id,
        NEW.ward_id,
        'Municipal Corporation Zone A',
        NEW.full_name,
        NEW.mobile_number,
        'Residential', -- default type
        '',
        '',
        0,
        2026,
        'Owner Occupied',
        'Assigned To Collector',
        NEW.address,
        'Metro City',
        'State A',
        '400001',
        0,
        0
      );
    END IF;
  END IF;

  -- When request is rejected, update user profile status to rejected
  IF NEW.status = 'rejected' AND OLD.status = 'pending_admin_review' THEN
    UPDATE public.users
    SET status = 'rejected', rejection_reason = NEW.rejection_reason
    WHERE id = NEW.citizen_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_citizen_request_updated
  AFTER UPDATE ON public.citizen_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_citizen_request_update();

-- Trigger: Update updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_citizen_requests_modtime BEFORE UPDATE ON public.citizen_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_properties_modtime BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tax_records_modtime BEFORE UPDATE ON public.tax_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- 6. SEQUENTIAL NUMBER AUTO-ASSIGN TRIGGERS
-- ==========================================

-- Trigger to auto-generate PROP ID on Property Approval
CREATE OR REPLACE FUNCTION public.assign_property_number()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'Approved' OR NEW.status = 'Tax Active') AND OLD.property_number IS NULL THEN
    NEW.property_number := 'PROP-2026-' || LPAD(nextval('public.property_number_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_property_number
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.assign_property_number();

-- Trigger to auto-generate RCT ID on Payment Verification
CREATE OR REPLACE FUNCTION public.assign_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Verified' AND OLD.receipt_number IS NULL THEN
    NEW.receipt_number := 'RCT-2026-' || LPAD(nextval('public.receipt_number_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_receipt_number
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.assign_receipt_number();

-- Trigger: Handle property activation workflows when approved or surveyed
CREATE OR REPLACE FUNCTION public.handle_property_activation()
RETURNS TRIGGER AS $$
DECLARE
  v_default_amount NUMERIC;
BEGIN
  -- 1. If collector completes survey, advance request status
  IF NEW.status = 'Verification Completed' AND OLD.status <> 'Verification Completed' THEN
    UPDATE public.citizen_requests
    SET status = 'verification_completed'
    WHERE id = NEW.request_id;
  END IF;

  -- 2. If admin approves property survey
  IF NEW.status = 'Approved' AND (OLD.status IS NULL OR OLD.status <> 'Approved') THEN
    
    -- Activate the Citizen User Profile
    UPDATE public.users
    SET status = 'active'
    WHERE id = NEW.citizen_id;

    -- Fetch default tax amount from tax_templates (fallback to 2000)
    SELECT COALESCE(default_amount, 2000) INTO v_default_amount
    FROM public.tax_templates
    WHERE property_type = NEW.property_type
    LIMIT 1;

    IF v_default_amount IS NULL THEN
      v_default_amount := 2000;
    END IF;

    -- Create Default Tax Record for FY 2025-26 if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM public.tax_records WHERE property_id = NEW.id AND financial_year = '2025-26') THEN
      INSERT INTO public.tax_records (property_id, financial_year, tax_amount, penalty, final_amount, due_date, status)
      VALUES (
        NEW.id,
        '2025-26',
        v_default_amount,
        0,
        v_default_amount,
        '2026-09-30',
        'Pending'
      );
    END IF;

    -- Create Tax Notice
    INSERT INTO public.tax_notices (property_id, notice_type, message, is_active)
    VALUES (
      NEW.id,
      'Tax Due Soon',
      'Default tax of ₹' || v_default_amount || ' generated for FY 2025-26. Due date: 2026-09-30.',
      true
    );

    -- Send Notification
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (
      NEW.citizen_id,
      'Property Approved & Activated',
      'Your property has been approved! Property Number: ' || COALESCE(NEW.property_number, 'Pending') || '. Tax Bill generated for FY 2025-26.'
    );

    -- Update citizen_requests status to approved
    UPDATE public.citizen_requests
    SET status = 'approved'
    WHERE id = NEW.request_id;

  END IF;

  -- 3. Handle rejection workflow
  IF NEW.status = 'Rejected' AND OLD.status <> 'Rejected' THEN
    UPDATE public.citizen_requests
    SET status = 'rejected', rejection_reason = NEW.rejection_reason
    WHERE id = NEW.request_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_handle_property_activation
  AFTER UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.handle_property_activation();

-- ==========================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- SECURITY DEFINER function to prevent infinite recursion on users table RLS policies
CREATE OR REPLACE FUNCTION public.check_user_role(user_id UUID, req_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND role = req_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citizen_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Wards Policies
CREATE POLICY "Allow public read of wards" ON public.wards FOR SELECT USING (true);
CREATE POLICY "Admin manage wards" ON public.wards FOR ALL USING (
  public.check_user_role(auth.uid(), 'admin')
);

-- Users Policies
CREATE POLICY "Allow users to read all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow users to update their own profiles" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin full access users" ON public.users FOR ALL USING (
  public.check_user_role(auth.uid(), 'admin')
);

-- Properties Policies
CREATE POLICY "Citizens read own properties" ON public.properties FOR SELECT USING (
  citizen_id = auth.uid() OR
  public.check_user_role(auth.uid(), 'admin') OR
  (
    public.check_user_role(auth.uid(), 'collector') AND
    (
      collector_id = auth.uid() OR 
      ward_id IN (SELECT ward_id FROM public.collectors WHERE id = auth.uid())
    )
  )
);
CREATE POLICY "Admin full access properties" ON public.properties FOR ALL USING (
  public.check_user_role(auth.uid(), 'admin')
);
CREATE POLICY "Collectors edit assigned properties" ON public.properties FOR UPDATE USING (
  public.check_user_role(auth.uid(), 'collector') AND
  (
    collector_id = auth.uid() OR 
    ward_id IN (SELECT ward_id FROM public.collectors WHERE id = auth.uid())
  )
);

-- Property Transfers Policies
CREATE POLICY "Users read relevant transfers" ON public.property_transfers FOR SELECT USING (
  previous_owner_id = auth.uid() OR 
  new_owner_id = auth.uid() OR
  public.check_user_role(auth.uid(), 'admin')
);
CREATE POLICY "Citizens insert transfers" ON public.property_transfers FOR INSERT WITH CHECK (
  previous_owner_id = auth.uid()
);
CREATE POLICY "Admin manage transfers" ON public.property_transfers FOR ALL USING (
  public.check_user_role(auth.uid(), 'admin')
);

-- Tax Records Policies
CREATE POLICY "Citizens read own taxes" ON public.tax_records FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.properties p 
    WHERE p.id = tax_records.property_id AND p.citizen_id = auth.uid()
  ) OR
  public.check_user_role(auth.uid(), 'admin') OR
  (
    public.check_user_role(auth.uid(), 'collector') AND
    EXISTS (
      SELECT 1 FROM public.properties p 
      WHERE p.id = tax_records.property_id AND p.ward_id IN (SELECT ward_id FROM public.collectors WHERE id = auth.uid())
    )
  )
);
CREATE POLICY "Admin manage taxes" ON public.tax_records FOR ALL USING (
  public.check_user_role(auth.uid(), 'admin')
);

-- Payments Policies
CREATE POLICY "Citizens read own payments" ON public.payments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tax_records t
    JOIN public.properties p ON p.id = t.property_id
    WHERE t.id = payments.tax_record_id AND p.citizen_id = auth.uid()
  ) OR
  public.check_user_role(auth.uid(), 'admin')
);
CREATE POLICY "Citizens upload payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin verify payments" ON public.payments FOR ALL USING (
  public.check_user_role(auth.uid(), 'admin')
);

-- Notices Policies
CREATE POLICY "Citizens read own notices" ON public.tax_notices FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.properties p 
    WHERE p.id = tax_notices.property_id AND p.citizen_id = auth.uid()
  ) OR
  public.check_user_role(auth.uid(), 'admin')
);
CREATE POLICY "Admin manage notices" ON public.tax_notices FOR ALL USING (
  public.check_user_role(auth.uid(), 'admin')
);

-- Notifications Policies
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System/Admin create notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- ==========================================
-- 8. MISSING RLS POLICIES FOR SECURE OPERATIONS
-- ==========================================

-- Citizen Requests Policies
CREATE POLICY "Citizens manage own requests" ON public.citizen_requests FOR ALL USING (
  citizen_id = auth.uid()
);
CREATE POLICY "Admin full access citizen_requests" ON public.citizen_requests FOR ALL USING (
  public.check_user_role(auth.uid(), 'admin')
);
CREATE POLICY "Collectors read assigned citizen_requests" ON public.citizen_requests FOR SELECT USING (
  public.check_user_role(auth.uid(), 'collector') AND (
    collector_id = auth.uid() OR
    ward_id IN (SELECT ward_id FROM public.collectors WHERE id = auth.uid())
  )
);

-- Collectors Policies
CREATE POLICY "Allow authenticated read of collectors" ON public.collectors FOR SELECT USING (
  auth.uid() IS NOT NULL
);
CREATE POLICY "Admin manage collectors" ON public.collectors FOR ALL USING (
  public.check_user_role(auth.uid(), 'admin')
);

-- Property Photos Policies
CREATE POLICY "Authenticated read of property photos" ON public.property_photos FOR SELECT USING (
  auth.uid() IS NOT NULL
);
CREATE POLICY "Collectors/Admin manage property photos" ON public.property_photos FOR ALL USING (
  public.check_user_role(auth.uid(), 'collector') OR 
  public.check_user_role(auth.uid(), 'admin')
);

-- Property Documents Policies
CREATE POLICY "Authenticated read of property documents" ON public.property_documents FOR SELECT USING (
  auth.uid() IS NOT NULL
);
CREATE POLICY "Collectors/Admin manage property documents" ON public.property_documents FOR ALL USING (
  public.check_user_role(auth.uid(), 'collector') OR 
  public.check_user_role(auth.uid(), 'admin')
);

-- Tax Templates Policies
CREATE POLICY "Allow public read of tax templates" ON public.tax_templates FOR SELECT USING (true);
CREATE POLICY "Admin manage tax templates" ON public.tax_templates FOR ALL USING (
  public.check_user_role(auth.uid(), 'admin')
);

-- Audit Logs Policies
CREATE POLICY "Admin select audit logs" ON public.audit_logs FOR SELECT USING (
  public.check_user_role(auth.uid(), 'admin')
);
CREATE POLICY "System/Users insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

