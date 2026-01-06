import { useState } from 'react';
import { Download, Image, FileText, Presentation, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { downloadAsPNG, downloadAsPDF, downloadAsPPT, generateFilename } from '@/utils/downloadUtils';

interface DownloadOptionsProps {
  images: string[];
  contentTitle?: string;
  messageContent?: string;
}

type DownloadFormat = 'png' | 'pdf' | 'ppt';

export const DownloadOptions = ({ images, contentTitle, messageContent = '' }: DownloadOptionsProps) => {
  const [downloading, setDownloading] = useState<DownloadFormat | null>(null);
  const [completed, setCompleted] = useState<DownloadFormat | null>(null);

  const getTitle = () => {
    if (contentTitle) return contentTitle;
    // Extract title from message content
    const lines = messageContent.split('\n');
    const titleLine = lines.find(line => line.startsWith('#') || line.startsWith('**'));
    if (titleLine) {
      return titleLine.replace(/[#*]/g, '').trim();
    }
    return 'StudyBuddy Content';
  };

  const handleDownload = async (format: DownloadFormat) => {
    if (images.length === 0) {
      toast.error('No images to download');
      return;
    }

    setDownloading(format);
    setCompleted(null);

    try {
      const title = getTitle();
      const filename = generateFilename(title, format === 'ppt' ? 'pptx' : format);

      switch (format) {
        case 'png':
          // Download first image or all as separate files
          if (images.length === 1) {
            await downloadAsPNG(images[0], filename);
          } else {
            // Download all images
            for (let i = 0; i < images.length; i++) {
              const imgFilename = generateFilename(`${title}_Panel_${i + 1}`, 'png');
              await downloadAsPNG(images[i], imgFilename);
            }
          }
          toast.success(`Downloaded ${images.length} image${images.length > 1 ? 's' : ''} as PNG`);
          break;

        case 'pdf':
          await downloadAsPDF(images, title, filename);
          toast.success('PDF downloaded successfully');
          break;

        case 'ppt':
          await downloadAsPPT(images, title, filename);
          toast.success('PowerPoint presentation downloaded');
          break;
      }

      setCompleted(format);
      setTimeout(() => setCompleted(null), 2000);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const getRecommendedFormat = (): DownloadFormat => {
    if (images.length === 1) return 'png';
    if (images.length >= 3) return 'ppt';
    return 'pdf';
  };

  const recommended = getRecommendedFormat();

  return (
    <>
      <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 gap-1.5 text-xs bg-background/50 hover:bg-primary/10 border-border/50"
            >
              <Download className="w-3 h-3" />
              Save Content
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Choose format
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={() => handleDownload('png')}
              disabled={downloading !== null}
              className="gap-2"
            >
              {downloading === 'png' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : completed === 'png' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Image className="w-4 h-4" />
              )}
              <span>PNG Image{images.length > 1 ? 's' : ''}</span>
              {recommended === 'png' && (
                <span className="ml-auto text-[10px] bg-primary/20 text-primary px-1.5 rounded">Best</span>
              )}
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => handleDownload('pdf')}
              disabled={downloading !== null}
              className="gap-2"
            >
              {downloading === 'pdf' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : completed === 'pdf' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span>PDF Document</span>
              {recommended === 'pdf' && (
                <span className="ml-auto text-[10px] bg-primary/20 text-primary px-1.5 rounded">Best</span>
              )}
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => handleDownload('ppt')}
              disabled={downloading !== null}
              className="gap-2"
            >
              {downloading === 'ppt' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : completed === 'ppt' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Presentation className="w-4 h-4" />
              )}
              <span>PowerPoint</span>
              {recommended === 'ppt' && (
                <span className="ml-auto text-[10px] bg-primary/20 text-primary px-1.5 rounded">Best</span>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick action buttons */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs hover:bg-primary/10"
          onClick={() => handleDownload('png')}
          disabled={downloading !== null}
        >
          {downloading === 'png' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Image className="w-3 h-3" />}
        </Button>
    </>
  );
};
