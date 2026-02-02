import { useState } from 'react';
import { useParentShare } from '@/hooks/useParentShare';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  X, 
  Plus, 
  Link2, 
  Copy, 
  Check, 
  Trash2, 
  Users,
  ExternalLink,
  Clock,
  Ban,
  Mail,
  Send,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface ParentShareManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ParentShareManager = ({ isOpen, onClose }: ParentShareManagerProps) => {
  const { shareLinks, isLoading, createShareLink, deactivateLink, deleteLink } = useParentShare();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [expiresIn, setExpiresIn] = useState<string>('never');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // Email dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailDialogLink, setEmailDialogLink] = useState<{ token: string; label: string | null } | null>(null);
  const [parentEmail, setParentEmail] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  if (!isOpen) return null;

  const getShareUrl = (token: string) => {
    return `${window.location.origin}/parent/${token}`;
  };

  const handleCopy = async (token: string, id: string) => {
    await navigator.clipboard.writeText(getShareUrl(token));
    setCopiedId(id);
    toast({ title: 'Link copied!', description: 'Share this link with your parent or mentor.' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = async () => {
    setIsCreating(true);
    const expiresInDays = expiresIn === 'never' ? undefined : parseInt(expiresIn);
    const result = await createShareLink(newLabel || undefined, expiresInDays);
    
    if (result) {
      toast({ title: 'Share link created!', description: 'You can now share this link with your parent or mentor.' });
      setNewLabel('');
      setExpiresIn('never');
      setCreateDialogOpen(false);
    } else {
      toast({ title: 'Failed to create link', variant: 'destructive' });
    }
    setIsCreating(false);
  };

  const handleDeactivate = async (id: string) => {
    const { error } = await deactivateLink(id);
    if (!error) {
      toast({ title: 'Link deactivated', description: 'This link will no longer work.' });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteLink(id);
    if (!error) {
      toast({ title: 'Link deleted' });
    }
  };

  const openEmailDialog = (token: string, label: string | null) => {
    setEmailDialogLink({ token, label });
    setParentEmail('');
    setStudentName(user?.user_metadata?.full_name || user?.email?.split('@')[0] || '');
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!emailDialogLink || !parentEmail || !studentName) return;
    
    setIsSendingEmail(true);
    try {
      const shareUrl = getShareUrl(emailDialogLink.token);
      
      const { data, error } = await supabase.functions.invoke('send-parent-invite', {
        body: {
          parentEmail,
          studentName,
          shareUrl,
          label: emailDialogLink.label
        }
      });

      if (error) throw error;

      toast({ 
        title: 'Email sent! 📧', 
        description: `Invitation sent to ${parentEmail}` 
      });
      setEmailDialogOpen(false);
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({ 
        title: 'Failed to send email', 
        description: error.message || 'Please try again',
        variant: 'destructive' 
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Parent/Mentor Access</CardTitle>
              <CardDescription>Share your progress with parents or mentors</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {/* Create New Link Section */}
          <div className="p-4 border-b bg-muted/30">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Share Link
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Share Link</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="label">Label (optional)</Label>
                    <Input
                      id="label"
                      placeholder="e.g., Mom's link, Tutor access"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expires In</Label>
                    <Select value={expiresIn} onValueChange={setExpiresIn}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Never</SelectItem>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate} disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create Link'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Existing Links */}
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : shareLinks.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No share links yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create a share link to give parents or mentors read-only access to your progress.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {shareLinks.map(link => (
                  <div key={link.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {link.label ? (
                            <span className="font-medium">{link.label}</span>
                          ) : (
                            <span className="text-muted-foreground">Untitled link</span>
                          )}
                          {!link.is_active && (
                            <Badge variant="secondary" className="gap-1">
                              <Ban className="h-3 w-3" />
                              Inactive
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <code className="bg-muted px-2 py-1 rounded text-xs truncate max-w-[200px]">
                            {link.share_token}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopy(link.share_token, link.id)}
                            disabled={!link.is_active}
                          >
                            {copiedId === link.id ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => window.open(getShareUrl(link.share_token), '_blank')}
                            disabled={!link.is_active}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Created {format(new Date(link.created_at), 'MMM d, yyyy')}
                          </span>
                          {link.expires_at && (
                            <span>
                              Expires {format(new Date(link.expires_at), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {link.is_active && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary hover:text-primary"
                              onClick={() => openEmailDialog(link.share_token, link.label)}
                              title="Send via email"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeactivate(link.id)}
                              title="Deactivate link"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(link.id)}
                          title="Delete link"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Share Link
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="studentName">Your Name</Label>
              <Input
                id="studentName"
                placeholder="How should we introduce you?"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentEmail">Parent/Mentor Email</Label>
              <Input
                id="parentEmail"
                type="email"
                placeholder="parent@example.com"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
              />
            </div>
            {emailDialogLink?.label && (
              <p className="text-sm text-muted-foreground">
                Sharing: <span className="font-medium">{emailDialogLink.label}</span>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail} 
              disabled={isSendingEmail || !parentEmail || !studentName}
              className="gap-2"
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
