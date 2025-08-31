-- Create notification tracking table to prevent duplicates
CREATE TABLE IF NOT EXISTS public.notification_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    entity_id TEXT NOT NULL, -- bill_id, budget_category, etc.
    entity_type TEXT NOT NULL, -- 'bill', 'budget', 'insight', 'security'
    last_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, notification_type, entity_id, entity_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_tracking_user_id ON public.notification_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_tracking_entity ON public.notification_tracking(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_notification_tracking_last_sent ON public.notification_tracking(last_sent_at);

-- Enable Row Level Security
ALTER TABLE public.notification_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notification tracking" ON public.notification_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification tracking" ON public.notification_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification tracking" ON public.notification_tracking
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification tracking" ON public.notification_tracking
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_notification_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_tracking_updated_at BEFORE UPDATE ON public.notification_tracking
    FOR EACH ROW EXECUTE FUNCTION update_notification_tracking_updated_at();
