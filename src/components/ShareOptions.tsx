import { useState } from 'react';
import { Mail, Share2, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { generateFilename } from '@/utils/downloadUtils';

interface ShareOptionsProps {
  images: string[];
  contentTitle?: string;
  messageContent?: string;
}

export const ShareOptions = ({ images, contentTitle, messageContent = '' }: ShareOptionsProps) => {
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [email, setEmail] = useState('');

  const getTitle = () => {
    if (contentTitle) return contentTitle;
    const lines = messageContent.split('\n');
    const titleLine = lines.find(line => line.startsWith('#') || line.startsWith('**'));
    if (titleLine) {
      return titleLine.replace(/[#*]/g, '').trim();
    }
    return 'StudyBuddy Content';
  };

  const getShareText = () => {
    const title = getTitle();
    return `Check out this learning content: ${title}\n\nGenerated with StudyBuddy - Your AI Learning Companion`;
  };

  const handleNativeShare = async () => {
    const title = getTitle();
    
    if (navigator.share) {
      try {
        // Try to share with images if supported
        if (images.length > 0 && navigator.canShare) {
          const imageBlobs = await Promise.all(
            images.slice(0, 1).map(async (url) => {
              const response = await fetch(url);
              const blob = await response.blob();
              return new File([blob], `${generateFilename(title, 'png')}`, { type: 'image/png' });
            })
          );
          
          const shareData = {
            title,
            text: getShareText(),
            files: imageBlobs,
          };
          
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            toast.success('Shared successfully!');
            return;
          }
        }
        
        // Fallback to text-only share
        await navigator.share({
          title,
          text: getShareText(),
        });
        toast.success('Shared successfully!');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      toast.error('Sharing not supported on this device');
    }
  };

  const handleCopyLink = async () => {
    setCopying(true);
    try {
      // Copy the first image URL or a summary
      const textToCopy = images.length > 0 
        ? `${getTitle()}\n\nImage: ${images[0]}\n\n${getShareText()}`
        : getShareText();
      
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    } finally {
      setCopying(false);
    }
  };

  const handleEmailShare = () => {
    const title = getTitle();
    const subject = encodeURIComponent(`StudyBuddy: ${title}`);
    const body = encodeURIComponent(
      `Hi!\n\nI wanted to share this learning content with you:\n\n` +
      `Topic: ${title}\n\n` +
      (images.length > 0 ? `View the image: ${images[0]}\n\n` : '') +
      `Generated with StudyBuddy - Your AI Learning Companion\n\n` +
      `Happy learning! 📚`
    );
    
    const mailtoLink = email 
      ? `mailto:${email}?subject=${subject}&body=${body}`
      : `mailto:?subject=${subject}&body=${body}`;
    
    window.open(mailtoLink, '_blank');
    setEmailDialogOpen(false);
    setEmail('');
    toast.success('Opening email client...');
  };

  const supportsNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 gap-1.5 text-xs bg-background/50 hover:bg-primary/10 border-border/50"
          >
            <Share2 className="w-3 h-3" />
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Share this content
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {supportsNativeShare && (
            <DropdownMenuItem onClick={handleNativeShare} className="gap-2">
              <Share2 className="w-4 h-4" />
              <span>Share...</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem onClick={() => setEmailDialogOpen(true)} className="gap-2">
            <Mail className="w-4 h-4" />
            <span>Send via Email</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleCopyLink} className="gap-2">
            {copying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share via Email</DialogTitle>
            <DialogDescription>
              Enter an email address or leave blank to open your email client
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Recipient Email (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEmailShare}>
                <Mail className="w-4 h-4 mr-2" />
                Open Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
