-- Vena Pictures Dashboard Database Schema for Supabase
-- This schema creates all tables needed for the application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Authentication and Profiles
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    role VARCHAR(20) CHECK (role IN ('Admin', 'Member')) DEFAULT 'Member',
    permissions TEXT[], -- Array of ViewType permissions
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profile (Business/Company settings)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company_name VARCHAR(255),
    website VARCHAR(255),
    address TEXT,
    bank_account VARCHAR(255),
    authorized_signer VARCHAR(255),
    id_number VARCHAR(100),
    bio TEXT,
    income_categories TEXT[],
    expense_categories TEXT[],
    project_types TEXT[],
    event_types TEXT[],
    asset_categories TEXT[],
    sop_categories TEXT[],
    package_categories TEXT[],
    project_status_config JSONB,
    notification_settings JSONB,
    security_settings JSONB,
    briefing_template TEXT,
    terms_and_conditions TEXT,
    contract_template TEXT,
    logo_base64 TEXT,
    brand_color VARCHAR(7),
    public_page_config JSONB,
    package_share_template TEXT,
    booking_form_template TEXT,
    chat_templates JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    since TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    instagram VARCHAR(255),
    status VARCHAR(20) CHECK (status IN ('Prospek', 'Aktif', 'Tidak Aktif', 'Hilang')) DEFAULT 'Prospek',
    client_type VARCHAR(20) CHECK (client_type IN ('Langsung', 'Vendor')) DEFAULT 'Langsung',
    last_contact TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    portal_access_id UUID DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Packages
CREATE TABLE packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    category VARCHAR(255),
    physical_items JSONB, -- Array of {name, price}
    digital_items TEXT[], -- Array of strings
    processing_time VARCHAR(255),
    default_printing_cost DECIMAL(15,2),
    default_transport_cost DECIMAL(15,2),
    photographers VARCHAR(255),
    videographers VARCHAR(255),
    cover_image TEXT, -- base64 image string
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add-ons
CREATE TABLE add_ons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team Members (Freelancers)
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    standard_fee DECIMAL(15,2) DEFAULT 0,
    no_rek VARCHAR(255),
    reward_balance DECIMAL(15,2) DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 0,
    performance_notes JSONB, -- Array of performance notes
    portal_access_id UUID DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_name VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    project_type VARCHAR(255),
    package_name VARCHAR(255),
    package_id UUID REFERENCES packages(id),
    add_ons JSONB, -- Array of add-on objects
    date TIMESTAMP WITH TIME ZONE,
    deadline_date TIMESTAMP WITH TIME ZONE,
    location VARCHAR(255),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    status VARCHAR(255),
    active_sub_statuses TEXT[],
    total_cost DECIMAL(15,2) DEFAULT 0,
    amount_paid DECIMAL(15,2) DEFAULT 0,
    payment_status VARCHAR(20) CHECK (payment_status IN ('Lunas', 'DP Terbayar', 'Belum Bayar')) DEFAULT 'Belum Bayar',
    team JSONB, -- Array of assigned team members
    notes TEXT,
    accommodation TEXT,
    drive_link VARCHAR(500),
    client_drive_link VARCHAR(500),
    final_drive_link VARCHAR(500),
    start_time VARCHAR(10),
    end_time VARCHAR(10),
    image VARCHAR(500),
    revisions JSONB,
    promo_code_id UUID,
    discount_amount DECIMAL(15,2),
    shipping_details TEXT,
    dp_proof_url VARCHAR(500),
    printing_details JSONB,
    printing_cost DECIMAL(15,2),
    transport_cost DECIMAL(15,2),
    is_editing_confirmed_by_client BOOLEAN DEFAULT false,
    is_printing_confirmed_by_client BOOLEAN DEFAULT false,
    is_delivery_confirmed_by_client BOOLEAN DEFAULT false,
    confirmed_sub_statuses TEXT[],
    client_sub_status_notes JSONB,
    sub_status_confirmation_sent_at JSONB,
    completed_digital_items TEXT[],
    invoice_signature TEXT,
    custom_sub_statuses JSONB,
    booking_status VARCHAR(20) CHECK (booking_status IN ('Baru', 'Terkonfirmasi', 'Ditolak')),
    rejection_reason TEXT,
    chat_history JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial Cards
CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_holder_name VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    card_type VARCHAR(20) CHECK (card_type IN ('Prabayar', 'Kredit', 'Debit', 'Tunai')) NOT NULL,
    last_four_digits VARCHAR(4),
    expiry_date VARCHAR(5), -- MM/YY
    balance DECIMAL(15,2) DEFAULT 0,
    color_gradient VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial Pockets
CREATE TABLE financial_pockets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    type VARCHAR(50) CHECK (type IN ('Nabung & Bayar', 'Terkunci', 'Bersama', 'Anggaran Pengeluaran', 'Tabungan Hadiah Freelancer')),
    amount DECIMAL(15,2) DEFAULT 0,
    goal_amount DECIMAL(15,2),
    lock_end_date TIMESTAMP WITH TIME ZONE,
    members JSONB, -- Array of team member objects for SHARED type
    source_card_id UUID REFERENCES cards(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('Pemasukan', 'Pengeluaran')) NOT NULL,
    project_id UUID REFERENCES projects(id),
    category VARCHAR(255),
    method VARCHAR(50) CHECK (method IN ('Transfer Bank', 'Tunai', 'E-Wallet', 'Sistem', 'Kartu')),
    pocket_id UUID REFERENCES financial_pockets(id),
    card_id UUID REFERENCES cards(id),
    printing_item_id VARCHAR(255),
    vendor_signature TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_channel VARCHAR(50) CHECK (contact_channel IN ('WhatsApp', 'Instagram', 'Website', 'Telepon', 'Referensi', 'Form Saran', 'Lainnya')),
    location VARCHAR(255),
    status VARCHAR(50) CHECK (status IN ('Sedang Diskusi', 'Menunggu Follow Up', 'Dikonversi', 'Ditolak')),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    whatsapp VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team Project Payments
CREATE TABLE team_project_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    team_member_name VARCHAR(255) NOT NULL,
    team_member_id UUID REFERENCES team_members(id),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('Paid', 'Unpaid')) DEFAULT 'Unpaid',
    fee DECIMAL(15,2) NOT NULL,
    reward DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team Payment Records
CREATE TABLE team_payment_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_number VARCHAR(255) NOT NULL,
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    project_payment_ids UUID[],
    total_amount DECIMAL(15,2) NOT NULL,
    vendor_signature TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reward Ledger Entries
CREATE TABLE reward_ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL, -- positive for deposit, negative for withdrawal
    project_id UUID REFERENCES projects(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assets
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    purchase_date TIMESTAMP WITH TIME ZONE,
    purchase_price DECIMAL(15,2),
    serial_number VARCHAR(255),
    status VARCHAR(20) CHECK (status IN ('Tersedia', 'Digunakan', 'Perbaikan')) DEFAULT 'Tersedia',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contracts
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_number VARCHAR(255) NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    signing_date TIMESTAMP WITH TIME ZONE,
    signing_location VARCHAR(255),
    client_name1 VARCHAR(255) NOT NULL,
    client_address1 TEXT NOT NULL,
    client_phone1 VARCHAR(50) NOT NULL,
    client_name2 VARCHAR(255),
    client_address2 TEXT,
    client_phone2 VARCHAR(50),
    shooting_duration VARCHAR(255),
    guaranteed_photos VARCHAR(255),
    album_details TEXT,
    digital_files_format VARCHAR(255),
    other_items TEXT,
    personnel_count VARCHAR(255),
    delivery_timeframe VARCHAR(255),
    dp_date TIMESTAMP WITH TIME ZONE,
    final_payment_date TIMESTAMP WITH TIME ZONE,
    cancellation_policy TEXT,
    jurisdiction VARCHAR(255),
    vendor_signature TEXT,
    client_signature TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client Feedback
CREATE TABLE client_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name VARCHAR(255) NOT NULL,
    satisfaction VARCHAR(50) CHECK (satisfaction IN ('Sangat Puas', 'Puas', 'Biasa Saja', 'Tidak Puas')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    is_read BOOLEAN DEFAULT false,
    icon VARCHAR(50) CHECK (icon IN ('lead', 'deadline', 'revision', 'feedback', 'payment', 'completed', 'comment')),
    link_view VARCHAR(255),
    link_action JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social Media Posts
CREATE TABLE social_media_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    post_type VARCHAR(50) CHECK (post_type IN ('Instagram Feed', 'Instagram Story', 'Instagram Reels', 'TikTok Video', 'Artikel Blog')),
    platform VARCHAR(50) CHECK (platform IN ('Instagram', 'TikTok', 'Website')),
    scheduled_date TIMESTAMP WITH TIME ZONE,
    caption TEXT,
    media_url VARCHAR(500),
    status VARCHAR(20) CHECK (status IN ('Draf', 'Terjadwal', 'Diposting', 'Dibatalkan')) DEFAULT 'Draf',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Promo Codes
CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')) NOT NULL,
    discount_value DECIMAL(15,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    max_usage INTEGER,
    expiry_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Standard Operating Procedures
CREATE TABLE sops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    content TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_package_id ON projects(package_id);
CREATE INDEX idx_projects_date ON projects(date);
CREATE INDEX idx_transactions_project_id ON transactions(project_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_team_project_payments_project_id ON team_project_payments(project_id);
CREATE INDEX idx_team_project_payments_team_member_id ON team_project_payments(team_member_id);
CREATE INDEX idx_contracts_client_id ON contracts(client_id);
CREATE INDEX idx_contracts_project_id ON contracts(project_id);
CREATE INDEX idx_social_media_posts_project_id ON social_media_posts(project_id);
CREATE INDEX idx_reward_ledger_team_member_id ON reward_ledger_entries(team_member_id);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_pockets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_project_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allowing authenticated users to access all data)
-- Note: In production, you should implement more restrictive policies based on user roles
CREATE POLICY "Allow authenticated users full access" ON users FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON profiles FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON clients FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON packages FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON add_ons FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON team_members FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON projects FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON cards FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON financial_pockets FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON leads FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON team_project_payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON team_payment_records FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON reward_ledger_entries FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON assets FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON contracts FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON client_feedback FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON notifications FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON social_media_posts FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON promo_codes FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON sops FOR ALL TO authenticated USING (true);