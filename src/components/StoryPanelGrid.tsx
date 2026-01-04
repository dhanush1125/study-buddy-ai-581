import { cn } from "@/lib/utils";
import { BookOpen, Sparkles } from "lucide-react";

interface StoryPanelGridProps {
  images: string[];
  className?: string;
}

export const StoryPanelGrid = ({ images, className }: StoryPanelGridProps) => {
  if (!images || images.length === 0) return null;

  // Determine grid layout based on number of panels
  const getGridClass = () => {
    switch (images.length) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-3";
      case 4:
        return "grid-cols-2 sm:grid-cols-2";
      case 5:
        return "grid-cols-2 sm:grid-cols-3";
      default:
        return "grid-cols-2 sm:grid-cols-3";
    }
  };

  return (
    <div className={cn("mt-4", className)}>
      {/* Story Mode Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
          <BookOpen className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">Story Panels</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Sparkles className="w-3 h-3" />
          <span>Visual learning mode</span>
        </div>
      </div>

      {/* Panel Grid */}
      <div className={cn("grid gap-3", getGridClass())}>
        {images.map((imgUrl, idx) => (
          <div
            key={idx}
            className="group relative rounded-xl overflow-hidden border-2 border-border/50 bg-card shadow-soft hover:shadow-lg hover:border-primary/30 transition-all duration-300"
          >
            {/* Panel Number Badge */}
            <div className="absolute top-2 left-2 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-md">
              {idx + 1}
            </div>

            {/* Anime Style Badge */}
            <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm text-[10px] font-medium text-muted-foreground border border-border/50">
              🎌 Panel
            </div>

            {/* Image Container */}
            <div className="aspect-square sm:aspect-[4/3] overflow-hidden bg-muted/30">
              <img
                src={imgUrl}
                alt={`Story panel ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-xs font-medium text-foreground">
                  Panel {idx + 1} of {images.length}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Story Flow Indicator */}
      {images.length > 1 && (
        <div className="flex items-center justify-center mt-4 gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-xs text-muted-foreground px-2 flex items-center gap-1.5">
            <span className="inline-block w-4 h-0.5 bg-primary rounded-full" />
            Read panels left to right
            <span className="inline-block w-4 h-0.5 bg-primary rounded-full" />
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
      )}
    </div>
  );
};
