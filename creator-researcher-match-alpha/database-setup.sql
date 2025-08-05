-- Database setup for Creator-Researcher Match Alpha
-- Run these SQL commands in your Supabase SQL editor

-- Enable Row Level Security (RLS)
ALTER TABLE IF EXISTS creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS researchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS research_groups ENABLE ROW LEVEL SECURITY;

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS creators CASCADE;
DROP TABLE IF EXISTS researchers CASCADE;
DROP TABLE IF EXISTS research_groups CASCADE;

-- Create creators table
CREATE TABLE creators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    specialization TEXT,
    platforms JSONB DEFAULT '[]'::jsonb,
    audience_size TEXT,
    bio TEXT,
    topics JSONB DEFAULT '[]'::jsonb,
    collaboration_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create researchers table
CREATE TABLE researchers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    institution TEXT,
    field TEXT,
    expertise TEXT,
    bio TEXT,
    topics JSONB DEFAULT '[]'::jsonb,
    availability TEXT,
    publications INTEGER DEFAULT 0,
    h_index INTEGER DEFAULT 0,
    recent_work TEXT,
    collaboration_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create research_groups table
CREATE TABLE research_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    university TEXT NOT NULL,
    university_location TEXT,
    department TEXT NOT NULL,
    lab TEXT NOT NULL,
    lab_head TEXT,
    lab_focus TEXT,
    members JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_creators_name ON creators USING GIN (to_tsvector('english', name));
CREATE INDEX idx_creators_specialization ON creators USING GIN (to_tsvector('english', specialization));
CREATE INDEX idx_creators_topics ON creators USING GIN (topics);

CREATE INDEX idx_researchers_name ON researchers USING GIN (to_tsvector('english', name));
CREATE INDEX idx_researchers_field ON researchers USING GIN (to_tsvector('english', field));
CREATE INDEX idx_researchers_expertise ON researchers USING GIN (to_tsvector('english', expertise));
CREATE INDEX idx_researchers_topics ON researchers USING GIN (topics);

CREATE INDEX idx_research_groups_university ON research_groups (university);
CREATE INDEX idx_research_groups_department ON research_groups (department);
CREATE INDEX idx_research_groups_lab ON research_groups (lab);
CREATE INDEX idx_research_groups_focus ON research_groups USING GIN (to_tsvector('english', lab_focus));

-- Set up Row Level Security policies
-- Allow read access to all authenticated users
CREATE POLICY "Allow read access for authenticated users" ON creators
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access for authenticated users" ON researchers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access for authenticated users" ON research_groups
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow insert/update/delete for authenticated users (you may want to restrict this further)
CREATE POLICY "Allow full access for authenticated users" ON creators
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow full access for authenticated users" ON researchers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow full access for authenticated users" ON research_groups
    FOR ALL USING (auth.role() = 'authenticated');

-- Update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_creators_updated_at BEFORE UPDATE ON creators
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_researchers_updated_at BEFORE UPDATE ON researchers
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_research_groups_updated_at BEFORE UPDATE ON research_groups
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();