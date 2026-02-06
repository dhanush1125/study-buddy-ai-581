
-- Add scheduled report fields to parent_share_links table
ALTER TABLE public.parent_share_links 
ADD COLUMN IF NOT EXISTS report_scheduled_date date,
ADD COLUMN IF NOT EXISTS report_email text,
ADD COLUMN IF NOT EXISTS report_sent_at timestamp with time zone;

-- Create index for efficient cron job queries
CREATE INDEX IF NOT EXISTS idx_parent_share_links_scheduled_reports 
ON public.parent_share_links (report_scheduled_date) 
WHERE report_scheduled_date IS NOT NULL AND report_sent_at IS NULL AND is_active = true;
