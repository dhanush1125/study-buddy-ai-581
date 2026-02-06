import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { CalendarIcon, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduleReportFormProps {
  shareToken: string;
  existingEmail?: string | null;
  existingDate?: string | null;
  existingSentAt?: string | null;
  onScheduled?: () => void;
}

export function ScheduleReportForm({
  shareToken,
  existingEmail,
  existingDate,
  existingSentAt,
  onScheduled,
}: ScheduleReportFormProps) {
  const [email, setEmail] = useState(existingEmail || '');
  const [date, setDate] = useState<Date | undefined>(
    existingDate ? new Date(existingDate) : undefined
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScheduled, setIsScheduled] = useState(!!existingDate && !existingSentAt);

  const tomorrow = addDays(new Date(), 1);

  const handleSchedule = async () => {
    if (!email || !date) {
      toast({
        title: 'Missing Information',
        description: 'Please enter your email and select a date.',
        variant: 'destructive',
      });
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('parent_share_links')
        .update({
          report_email: email,
          report_scheduled_date: format(date, 'yyyy-MM-dd'),
          report_sent_at: null, // Reset in case rescheduling
        })
        .eq('share_token', shareToken);

      if (error) throw error;

      setIsScheduled(true);
      toast({
        title: 'Report Scheduled! 📧',
        description: `You'll receive the progress report at ${email} on ${format(date, 'MMMM d, yyyy')}.`,
      });
      onScheduled?.();
    } catch (error) {
      console.error('Error scheduling report:', error);
      toast({
        title: 'Scheduling Failed',
        description: 'Could not schedule the report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('parent_share_links')
        .update({
          report_scheduled_date: null,
          report_sent_at: null,
        })
        .eq('share_token', shareToken);

      if (error) throw error;

      setIsScheduled(false);
      setDate(undefined);
      toast({
        title: 'Schedule Cancelled',
        description: 'The scheduled report has been cancelled.',
      });
      onScheduled?.();
    } catch (error) {
      console.error('Error cancelling schedule:', error);
      toast({
        title: 'Error',
        description: 'Could not cancel the schedule. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If report was already sent
  if (existingSentAt) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <div>
              <p className="font-medium">Report Sent!</p>
              <p className="text-sm text-green-600">
                The report was sent to {existingEmail} on{' '}
                {format(new Date(existingSentAt), 'MMMM d, yyyy')}.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Schedule Report for Meeting
        </CardTitle>
        <CardDescription>
          Receive a comprehensive progress report via email before your parent-teacher meeting.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isScheduled ? (
          <div className="space-y-4">
            <div className="bg-accent rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CalendarIcon className="h-5 w-5 text-accent-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-accent-foreground">Report Scheduled</p>
                  <p className="text-sm text-muted-foreground">
                    A progress report will be sent to <span className="font-medium">{email}</span> on{' '}
                    <span className="font-medium">{date && format(date, 'MMMM d, yyyy')}</span>.
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Cancel Schedule
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="email">Your Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="parent@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Meeting Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : 'Select your meeting date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(d) => isBefore(startOfDay(d), startOfDay(tomorrow))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Report will be sent the day before your meeting.
              </p>
            </div>

            <Button
              className="w-full"
              onClick={handleSchedule}
              disabled={isSubmitting || !email || !date}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Schedule Report
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
