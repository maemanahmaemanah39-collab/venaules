-- Seed Data for Vena Pictures Dashboard
-- Insert sample users, profiles, and packages as requested

-- Sample Users
INSERT INTO users (id, email, password_hash, full_name, company_name, role, permissions, is_approved) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@venapictures.com', '$2a$10$hashedpassword1', 'Admin Vena Pictures', 'Vena Pictures', 'Admin', ARRAY['Dashboard', 'Prospek', 'Booking', 'Manajemen Klien', 'Proyek', 'Freelancer', 'Keuangan', 'Kalender', 'Laporan Klien', 'Input Package', 'Kode Promo', 'Manajemen Aset', 'Kontrak Kerja', 'Perencana Media Sosial', 'SOP', 'Pengaturan'], true),
('550e8400-e29b-41d4-a716-446655440002', 'manager@venapictures.com', '$2a$10$hashedpassword2', 'Manager Vena', 'Vena Pictures', 'Member', ARRAY['Dashboard', 'Prospek', 'Booking', 'Manajemen Klien', 'Proyek', 'Keuangan'], true),
('550e8400-e29b-41d4-a716-446655440003', 'staff@venapictures.com', '$2a$10$hashedpassword3', 'Staff Vena', 'Vena Pictures', 'Member', ARRAY['Dashboard', 'Proyek', 'Manajemen Klien'], true);

-- Sample Profile
INSERT INTO profiles (id, admin_user_id, full_name, email, phone, company_name, website, address, bank_account, authorized_signer, bio, income_categories, expense_categories, project_types, event_types, asset_categories, sop_categories, package_categories, project_status_config, notification_settings, security_settings, briefing_template, brand_color, public_page_config) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Vena Pictures Studio', 'info@venapictures.com', '+62-812-3456-7890', 'Vena Pictures', 'https://venapictures.com', 'Jakarta, Indonesia', '1234567890 - Bank BCA', 'Vena Pictures', 'Professional photography and videography studio specializing in weddings and events.',
ARRAY['Pembayaran Klien', 'Jasa Fotografi', 'Jasa Videografi', 'Penjualan Produk', 'Bonus'],
ARRAY['Operasional', 'Peralatan', 'Marketing', 'Transport', 'Akomodasi', 'Printing', 'Gaji Freelancer'],
ARRAY['Wedding', 'Prewedding', 'Engagement', 'Birthday', 'Corporate Event', 'Product Photography'],
ARRAY['Indoor', 'Outdoor', 'Studio', 'Beach', 'Garden', 'Urban'],
ARRAY['Kamera', 'Lensa', 'Lighting', 'Drone', 'Audio Equipment', 'Computer'],
ARRAY['Photography', 'Videography', 'Editing', 'Client Management', 'Equipment Maintenance'],
ARRAY['Wedding Packages', 'Event Packages', 'Portrait Packages', 'Corporate Packages'],
'[{"id": "1", "name": "Planning", "color": "#3b82f6", "subStatuses": [{"name": "Initial Consultation", "note": "Meeting with client"}], "note": "Project planning phase"}]'::jsonb,
'{"newProject": true, "paymentConfirmation": true, "deadlineReminder": true}'::jsonb,
'{"twoFactorEnabled": false}'::jsonb,
'Dear {clientName}, terima kasih telah mempercayakan momen spesial Anda kepada Vena Pictures.',
'#3b82f6',
'{"template": "modern", "title": "Vena Pictures", "introduction": "Professional Photography & Videography Studio", "galleryImages": []}'::jsonb);

-- Sample Packages
INSERT INTO packages (id, name, price, category, physical_items, digital_items, processing_time, default_printing_cost, default_transport_cost, photographers, videographers, cover_image) VALUES
('750e8400-e29b-41d4-a716-446655440001', 'Wedding Premium Package', 15000000, 'Wedding Packages', '[{"name": "Album Wedding 20x30", "price": 500000}, {"name": "USB Flashdisk Custom", "price": 150000}]'::jsonb, ARRAY['200+ Edited Photos', '5-10 Minutes Highlight Video', 'Same Day Edit', 'Raw Photos'], '2-3 Minggu', 500000, 200000, '2 Photographers', '1 Videographer', NULL),

('750e8400-e29b-41d4-a716-446655440002', 'Wedding Standard Package', 8000000, 'Wedding Packages', '[{"name": "Album Wedding 15x20", "price": 300000}, {"name": "USB Flashdisk", "price": 100000}]'::jsonb, ARRAY['100+ Edited Photos', '3-5 Minutes Highlight Video', 'Raw Photos'], '2-3 Minggu', 300000, 150000, '1 Photographer', '1 Videographer', NULL),

('750e8400-e29b-41d4-a716-446655440003', 'Prewedding Package', 3500000, 'Wedding Packages', '[{"name": "Canvas Print 30x40", "price": 200000}]'::jsonb, ARRAY['50+ Edited Photos', '2-3 Minutes Cinematic Video'], '1-2 Minggu', 200000, 100000, '1 Photographer', '1 Videographer', NULL),

('750e8400-e29b-41d4-a716-446655440004', 'Birthday Party Package', 2500000, 'Event Packages', '[{"name": "Photo Frame Set", "price": 150000}]'::jsonb, ARRAY['80+ Edited Photos', 'Highlight Video'], '1 Minggu', 150000, 100000, '1 Photographer', NULL, NULL),

('750e8400-e29b-41d4-a716-446655440005', 'Corporate Event Package', 5000000, 'Corporate Packages', '[{"name": "USB Branded", "price": 200000}]'::jsonb, ARRAY['150+ Event Photos', 'Company Profile Video', 'Documentation Video'], '1-2 Minggu', 200000, 150000, '2 Photographers', '1 Videographer', NULL),

('750e8400-e29b-41d4-a716-446655440006', 'Product Photography Package', 1500000, 'Corporate Packages', '[]'::jsonb, ARRAY['20+ Product Photos', 'Retouched Images', 'Multiple Angles'], '3-5 Hari', 0, 50000, '1 Photographer', NULL, NULL);

-- Sample Add-ons
INSERT INTO add_ons (id, name, price) VALUES
('850e8400-e29b-41d4-a716-446655440001', 'Extra Photographer', 1500000),
('850e8400-e29b-41d4-a716-446655440002', 'Drone Photography', 1000000),
('850e8400-e29b-41d4-a716-446655440003', 'Same Day Edit', 2000000),
('850e8400-e29b-41d4-a716-446655440004', 'Extra Album', 500000),
('850e8400-e29b-41d4-a716-446655440005', 'Extended Coverage (+2 hours)', 1000000),
('850e8400-e29b-41d4-a716-446655440006', 'Photo Booth Service', 2500000);

-- Sample Financial Cards
INSERT INTO cards (id, card_holder_name, bank_name, card_type, last_four_digits, expiry_date, balance, color_gradient) VALUES
('950e8400-e29b-41d4-a716-446655440001', 'Vena Pictures', 'BCA', 'Debit', '3090', '12/27', 15000000, 'from-blue-500 to-blue-600'),
('950e8400-e29b-41d4-a716-446655440002', 'Vena Pictures', 'Mandiri', 'Kredit', '5678', '08/26', 5000000, 'from-green-500 to-green-600'),
('950e8400-e29b-41d4-a716-446655440003', 'Cash Management', 'Tunai', 'Tunai', '0000', NULL, 2000000, 'from-gray-500 to-gray-600');

-- Sample Financial Pockets
INSERT INTO financial_pockets (id, name, description, icon, type, amount, goal_amount, source_card_id) VALUES
('a50e8400-e29b-41d4-a716-446655440001', 'Emergency Fund', 'Dana darurat untuk kebutuhan mendesak', 'piggy-bank', 'Nabung & Bayar', 5000000, 10000000, '950e8400-e29b-41d4-a716-446655440001'),
('a50e8400-e29b-41d4-a716-446655440002', 'Equipment Upgrade', 'Tabungan untuk upgrade peralatan', 'piggy-bank', 'Nabung & Bayar', 3000000, 15000000, '950e8400-e29b-41d4-a716-446655440001'),
('a50e8400-e29b-41d4-a716-446655440003', 'Freelancer Rewards', 'Pool hadiah untuk freelancer terbaik', 'star', 'Tabungan Hadiah Freelancer', 1000000, 5000000, '950e8400-e29b-41d4-a716-446655440002');

-- Create the default profile for the application
INSERT INTO profiles (id, admin_user_id, full_name, email, phone, company_name, website, address, bank_account, authorized_signer, bio, income_categories, expense_categories, project_types, event_types, asset_categories, sop_categories, package_categories, project_status_config, notification_settings, security_settings, briefing_template, brand_color, public_page_config) VALUES
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 'Vena Pictures Studio', 'info@venapictures.com', '+62-812-3456-7890', 'Vena Pictures', 'https://venapictures.com', 'Jakarta, Indonesia', '1234567890 - Bank BCA', 'Vena Pictures', 'Professional photography and videography studio specializing in weddings and events.',
ARRAY['Pembayaran Klien', 'Jasa Fotografi', 'Jasa Videografi', 'Penjualan Produk', 'Bonus'],
ARRAY['Operasional', 'Peralatan', 'Marketing', 'Transport', 'Akomodasi', 'Printing', 'Gaji Freelancer'],
ARRAY['Wedding', 'Prewedding', 'Engagement', 'Birthday', 'Corporate Event', 'Product Photography'],
ARRAY['Indoor', 'Outdoor', 'Studio', 'Beach', 'Garden', 'Urban'],
ARRAY['Kamera', 'Lensa', 'Lighting', 'Drone', 'Audio Equipment', 'Computer'],
ARRAY['Photography', 'Videography', 'Editing', 'Client Management', 'Equipment Maintenance'],
ARRAY['Wedding Packages', 'Event Packages', 'Portrait Packages', 'Corporate Packages'],
'[{"id": "1", "name": "Planning", "color": "#3b82f6", "subStatuses": [{"name": "Initial Consultation", "note": "Meeting with client"}], "note": "Project planning phase"}]'::jsonb,
'{"newProject": true, "paymentConfirmation": true, "deadlineReminder": true}'::jsonb,
'{"twoFactorEnabled": false}'::jsonb,
'Dear {clientName}, terima kasih telah mempercayakan momen spesial Anda kepada Vena Pictures.',
'#3b82f6',
'{"template": "modern", "title": "Vena Pictures", "introduction": "Professional Photography & Videography Studio", "galleryImages": []}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  company_name = EXCLUDED.company_name;

-- Sample Notifications
INSERT INTO notifications (id, title, message, timestamp, is_read, icon) VALUES
('b50e8400-e29b-41d4-a716-446655440001', 'Welcome to Vena Pictures Dashboard', 'Your dashboard has been successfully integrated with Supabase database.', NOW(), false, 'completed'),
('b50e8400-e29b-41d4-a716-446655440002', 'Database Migration Complete', 'All your data has been migrated from local storage to Supabase.', NOW(), false, 'completed');