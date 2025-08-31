-- Create bills table
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'PKR',
    due_date DATE NOT NULL,
    recurring BOOLEAN NOT NULL DEFAULT false,
    category TEXT,
    notes TEXT,
    paid BOOLEAN NOT NULL DEFAULT false,
    paid_at TIMESTAMP WITH TIME ZONE,
    paid_amount DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON public.bills(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON public.bills(due_date);
CREATE INDEX IF NOT EXISTS idx_bills_paid ON public.bills(paid);

-- Enable Row Level Security
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own bills" ON public.bills
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bills" ON public.bills
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bills" ON public.bills
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bills" ON public.bills
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON public.bills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
