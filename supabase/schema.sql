-- Sacred Foundation Grants Dashboard - Supabase Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teams table for collaboration
CREATE TABLE public.teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_members junction table
CREATE TABLE public.team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    invited_by UUID REFERENCES public.profiles(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Create grant_progress table for tracking application progress
CREATE TABLE public.grant_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    grant_id TEXT NOT NULL,
    status TEXT DEFAULT 'not-started' CHECK (status IN ('not-started', 'researching', 'drafting', 'submitted', 'awaiting', 'successful', 'unsuccessful')),
    notes TEXT,
    submitted_date DATE,
    amount_requested DECIMAL(12, 2),
    amount_received DECIMAL(12, 2),
    documents JSONB DEFAULT '[]',
    checklist JSONB DEFAULT '[]',
    reminder_date DATE,
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, grant_id)
);

-- Create grant_documents table for file attachments
CREATE TABLE public.grant_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    grant_progress_id UUID REFERENCES public.grant_progress(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create grant_comments table for team collaboration
CREATE TABLE public.grant_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    grant_progress_id UUID REFERENCES public.grant_progress(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create setup_steps table for tracking setup progress
CREATE TABLE public.setup_steps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    step_id TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    UNIQUE(user_id, step_id)
);

-- Create notifications table for reminders
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deadline', 'reminder', 'team_invite', 'status_change', 'new_grant')),
    title TEXT NOT NULL,
    message TEXT,
    grant_id TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create grant_updates table for tracking external grant changes (auto-updates)
CREATE TABLE public.grant_updates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    grant_id TEXT NOT NULL,
    field_changed TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source_url TEXT
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grant_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grant_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setup_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grant_updates ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view team members profiles" ON public.profiles
    FOR SELECT USING (
        id IN (
            SELECT tm.user_id FROM public.team_members tm
            WHERE tm.team_id IN (
                SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
            )
        )
    );

-- Teams policies
CREATE POLICY "Users can view teams they belong to" ON public.teams
    FOR SELECT USING (
        id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create teams" ON public.teams
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team admins can update teams" ON public.teams
    FOR UPDATE USING (
        id IN (
            SELECT team_id FROM public.team_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Team members policies
CREATE POLICY "Users can view team members" ON public.team_members
    FOR SELECT USING (
        team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Team admins can manage team members" ON public.team_members
    FOR ALL USING (
        team_id IN (
            SELECT team_id FROM public.team_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Grant progress policies
CREATE POLICY "Users can view their own grant progress" ON public.grant_progress
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view team grant progress" ON public.grant_progress
    FOR SELECT USING (
        team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert their own grant progress" ON public.grant_progress
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own grant progress" ON public.grant_progress
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own grant progress" ON public.grant_progress
    FOR DELETE USING (user_id = auth.uid());

-- Grant documents policies
CREATE POLICY "Users can view their own documents" ON public.grant_documents
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can upload documents" ON public.grant_documents
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own documents" ON public.grant_documents
    FOR DELETE USING (user_id = auth.uid());

-- Grant comments policies
CREATE POLICY "Users can view comments on accessible grants" ON public.grant_comments
    FOR SELECT USING (
        grant_progress_id IN (
            SELECT id FROM public.grant_progress
            WHERE user_id = auth.uid() OR team_id IN (
                SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create comments" ON public.grant_comments
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own comments" ON public.grant_comments
    FOR UPDATE USING (user_id = auth.uid());

-- Setup steps policies
CREATE POLICY "Users can manage their setup steps" ON public.setup_steps
    FOR ALL USING (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Grant updates are public (read-only for users)
CREATE POLICY "Anyone can view grant updates" ON public.grant_updates
    FOR SELECT USING (true);

-- Functions and Triggers

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_grant_progress_updated_at
    BEFORE UPDATE ON public.grant_progress
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to send deadline reminders (called by cron job)
CREATE OR REPLACE FUNCTION public.check_deadline_reminders()
RETURNS void AS $$
DECLARE
    progress_record RECORD;
BEGIN
    -- Find grants with reminders due today that haven't been sent
    FOR progress_record IN
        SELECT gp.id, gp.user_id, gp.grant_id, gp.reminder_date
        FROM public.grant_progress gp
        WHERE gp.reminder_date <= CURRENT_DATE
        AND gp.reminder_sent = FALSE
        AND gp.status NOT IN ('submitted', 'successful', 'unsuccessful')
    LOOP
        -- Create notification
        INSERT INTO public.notifications (user_id, type, title, message, grant_id)
        VALUES (
            progress_record.user_id,
            'reminder',
            'Grant Reminder',
            'Reminder for grant: ' || progress_record.grant_id,
            progress_record.grant_id
        );

        -- Mark reminder as sent
        UPDATE public.grant_progress
        SET reminder_sent = TRUE
        WHERE id = progress_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_grant_progress_user_id ON public.grant_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_grant_progress_team_id ON public.grant_progress(team_id);
CREATE INDEX IF NOT EXISTS idx_grant_progress_grant_id ON public.grant_progress(grant_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
