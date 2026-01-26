import { useState, useRef, useEffect } from "react";
import { Play } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { AspectRatio } from "./ui/aspect-ratio";

interface VideoPlayerProps {
  src: string;
  className?: string;
}

const isExternalUrl = (url: string) => {
  try {
    return new URL(url).origin !== window.location.origin;
  } catch {
    return false;
  }
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface VideoMetadata {
  thumbnail: string | null;
  duration: number | null;
}

const extractVideoMetadata = (videoUrl: string): Promise<VideoMetadata> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");

    // CRITICAL: Must set crossOrigin BEFORE setting src for external URLs
    if (isExternalUrl(videoUrl)) {
      video.crossOrigin = "anonymous";
    }

    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";

    let duration: number | null = null;

    video.onloadedmetadata = () => {
      duration = video.duration;
    };

    video.onloadeddata = () => {
      video.currentTime = 1; // Seek to the first second for a better frame
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          resolve({ thumbnail: dataUrl, duration });
        } else {
          resolve({ thumbnail: null, duration });
        }
      } catch (error) {
        // CORS blocked canvas export - fallback to no thumbnail but keep duration
        resolve({ thumbnail: null, duration });
      }
    };

    video.onerror = () => reject(new Error("Video load failed"));

    // Timeout fallback
    setTimeout(() => reject(new Error("Metadata extraction timeout")), 10000);
  });
};

export const VideoPlayer = ({ src, className }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(true);
  const [thumbnailError, setThumbnailError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadMetadata = async () => {
      setIsLoadingThumbnail(true);
      try {
        const metadata = await extractVideoMetadata(src);
        if (isMounted) {
          setThumbnail(metadata.thumbnail);
          setDuration(metadata.duration);
          setThumbnailError(!metadata.thumbnail);
        }
      } catch (error) {
        console.warn("Metadata extraction failed:", error);
        if (isMounted) {
          setThumbnailError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoadingThumbnail(false);
        }
      }
    };

    loadMetadata();

    return () => {
      isMounted = false;
    };
  }, [src]);

  const handlePlay = async () => {
    setIsPlaying(true);
    // Small delay to ensure video element is rendered
    setTimeout(async () => {
      const video = videoRef.current;
      if (video) {
        try {
          await video.play();
        } catch (error) {
          console.error("Video play failed:", error);
        }
      }
    }, 100);
  };

  if (isPlaying) {
    return (
      <video
        ref={videoRef}
        src={src}
        controls
        autoPlay
        className={className || "w-full h-auto max-h-96"}
        preload="auto"
      >
        Your browser does not support the video tag.
      </video>
    );
  }

  return (
    <div 
      className="relative cursor-pointer group"
      onClick={handlePlay}
    >
      <AspectRatio ratio={16 / 9}>
        {isLoadingThumbnail ? (
          <Skeleton className="w-full h-full rounded-lg" />
        ) : thumbnail && !thumbnailError ? (
          <img
            src={thumbnail}
            alt="Video thumbnail"
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          // Fallback: show a gradient placeholder
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 rounded-lg flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Video Preview</span>
          </div>
        )}
      </AspectRatio>
      
      {/* Duration badge */}
      {duration !== null && !isLoadingThumbnail && (
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs font-medium">
          {formatDuration(duration)}
        </div>
      )}
      
      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
          <Play className="w-7 h-7 text-primary fill-primary ml-1" />
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
    </div>
  );
};
