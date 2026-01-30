import { AvatarConfig, defaultAvatarConfig } from "./avatarParts";
import { cn } from "@/lib/utils";

export type TeacherExpression = "neutral" | "happy" | "thinking" | "encouraging" | "celebrating";

interface TeacherAvatarProps {
  config?: AvatarConfig;
  expression?: TeacherExpression;
  size?: number;
  className?: string;
  animated?: boolean;
}

export const TeacherAvatar = ({ 
  config = defaultAvatarConfig, 
  expression = "neutral", 
  size = 80, 
  className = "",
  animated = true 
}: TeacherAvatarProps) => {
  const getFaceShape = () => {
    switch (config.faceShape) {
      case "oval":
        return { rx: size * 0.35, ry: size * 0.42 };
      case "square":
        return { rx: size * 0.32, ry: size * 0.35 };
      default:
        return { rx: size * 0.38, ry: size * 0.38 };
    }
  };

  const faceShape = getFaceShape();
  const cx = size / 2;
  const cy = size / 2;
  const eyeY = cy - faceShape.ry * 0.1;
  const eyeSpacing = faceShape.rx * 0.45;
  const eyeSize = size * 0.06;
  const mouthY = cy + faceShape.ry * 0.35;

  // Expression-specific eye rendering
  const renderExpressionEyes = () => {
    switch (expression) {
      case "happy":
      case "celebrating":
        // Happy curved eyes (closed happy)
        return (
          <g>
            <path
              d={`M ${cx - eyeSpacing - eyeSize} ${eyeY} Q ${cx - eyeSpacing} ${eyeY - eyeSize * 1.8} ${cx - eyeSpacing + eyeSize} ${eyeY}`}
              stroke={config.eyeColor}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
            />
            <path
              d={`M ${cx + eyeSpacing - eyeSize} ${eyeY} Q ${cx + eyeSpacing} ${eyeY - eyeSize * 1.8} ${cx + eyeSpacing + eyeSize} ${eyeY}`}
              stroke={config.eyeColor}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
            />
          </g>
        );
      case "thinking":
        // One eye looking up, one squinting
        return (
          <g>
            <circle cx={cx - eyeSpacing} cy={eyeY - 3} r={eyeSize} fill="white" stroke="#333" strokeWidth={1} />
            <circle cx={cx - eyeSpacing + 2} cy={eyeY - 5} r={eyeSize * 0.5} fill={config.eyeColor} />
            <ellipse cx={cx + eyeSpacing} cy={eyeY} rx={eyeSize} ry={eyeSize * 0.4} fill={config.eyeColor} />
          </g>
        );
      case "encouraging":
        // Warm, open eyes with sparkle
        return (
          <g>
            <circle cx={cx - eyeSpacing} cy={eyeY} r={eyeSize * 1.1} fill="white" stroke="#333" strokeWidth={1} />
            <circle cx={cx - eyeSpacing} cy={eyeY} r={eyeSize * 0.55} fill={config.eyeColor} />
            <circle cx={cx - eyeSpacing - eyeSize * 0.2} cy={eyeY - eyeSize * 0.2} r={eyeSize * 0.15} fill="white" />
            <circle cx={cx + eyeSpacing} cy={eyeY} r={eyeSize * 1.1} fill="white" stroke="#333" strokeWidth={1} />
            <circle cx={cx + eyeSpacing} cy={eyeY} r={eyeSize * 0.55} fill={config.eyeColor} />
            <circle cx={cx + eyeSpacing - eyeSize * 0.2} cy={eyeY - eyeSize * 0.2} r={eyeSize * 0.15} fill="white" />
          </g>
        );
      default: // neutral
        return (
          <g>
            <circle cx={cx - eyeSpacing} cy={eyeY} r={eyeSize} fill="white" stroke="#333" strokeWidth={1} />
            <circle cx={cx - eyeSpacing} cy={eyeY} r={eyeSize * 0.5} fill={config.eyeColor} />
            <circle cx={cx + eyeSpacing} cy={eyeY} r={eyeSize} fill="white" stroke="#333" strokeWidth={1} />
            <circle cx={cx + eyeSpacing} cy={eyeY} r={eyeSize * 0.5} fill={config.eyeColor} />
          </g>
        );
    }
  };

  // Expression-specific mouth rendering
  const renderExpressionMouth = () => {
    const mouthWidth = faceShape.rx * 0.25;
    
    switch (expression) {
      case "happy":
        // Wide smile
        return (
          <path
            d={`M ${cx - mouthWidth * 1.3} ${mouthY} Q ${cx} ${mouthY + 15} ${cx + mouthWidth * 1.3} ${mouthY}`}
            stroke="#E57373"
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
          />
        );
      case "celebrating":
        // Open mouth smile (excited)
        return (
          <g>
            <path
              d={`M ${cx - mouthWidth * 1.2} ${mouthY} Q ${cx} ${mouthY + 18} ${cx + mouthWidth * 1.2} ${mouthY}`}
              stroke="#E57373"
              strokeWidth={2}
              fill="#FFCDD2"
              strokeLinecap="round"
            />
            {/* Teeth hint */}
            <line 
              x1={cx - mouthWidth * 0.6} 
              y1={mouthY + 3} 
              x2={cx + mouthWidth * 0.6} 
              y2={mouthY + 3} 
              stroke="white" 
              strokeWidth={4}
            />
          </g>
        );
      case "thinking":
        // Slightly pursed/wavy mouth
        return (
          <path
            d={`M ${cx - mouthWidth * 0.8} ${mouthY + 2} Q ${cx - mouthWidth * 0.3} ${mouthY - 3} ${cx} ${mouthY + 2} Q ${cx + mouthWidth * 0.3} ${mouthY + 5} ${cx + mouthWidth * 0.8} ${mouthY}`}
            stroke="#E57373"
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
          />
        );
      case "encouraging":
        // Warm, gentle smile
        return (
          <path
            d={`M ${cx - mouthWidth} ${mouthY} Q ${cx} ${mouthY + 12} ${cx + mouthWidth} ${mouthY}`}
            stroke="#E57373"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
        );
      default: // neutral
        return (
          <path
            d={`M ${cx - mouthWidth} ${mouthY} Q ${cx} ${mouthY + 10} ${cx + mouthWidth} ${mouthY}`}
            stroke="#E57373"
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
          />
        );
    }
  };

  // Expression-specific extras (blush, sweat, sparkles)
  const renderExpressionExtras = () => {
    switch (expression) {
      case "happy":
      case "encouraging":
        // Blush marks
        return (
          <g opacity={0.4}>
            <ellipse cx={cx - faceShape.rx * 0.6} cy={eyeY + faceShape.ry * 0.3} rx={size * 0.06} ry={size * 0.04} fill="#FFB6C1" />
            <ellipse cx={cx + faceShape.rx * 0.6} cy={eyeY + faceShape.ry * 0.3} rx={size * 0.06} ry={size * 0.04} fill="#FFB6C1" />
          </g>
        );
      case "celebrating":
        // Sparkles around head
        return (
          <g fill="hsl(var(--primary))">
            <polygon points={`${cx - faceShape.rx * 1.2},${cy - faceShape.ry * 0.8} ${cx - faceShape.rx * 1.15},${cy - faceShape.ry * 0.7} ${cx - faceShape.rx * 1.25},${cy - faceShape.ry * 0.7}`} />
            <polygon points={`${cx + faceShape.rx * 1.2},${cy - faceShape.ry * 0.6} ${cx + faceShape.rx * 1.15},${cy - faceShape.ry * 0.5} ${cx + faceShape.rx * 1.25},${cy - faceShape.ry * 0.5}`} />
            <circle cx={cx - faceShape.rx * 0.9} cy={cy - faceShape.ry * 1.1} r={size * 0.02} />
            <circle cx={cx + faceShape.rx * 0.7} cy={cy - faceShape.ry * 1.15} r={size * 0.025} />
            {/* Blush too */}
            <ellipse cx={cx - faceShape.rx * 0.6} cy={eyeY + faceShape.ry * 0.3} rx={size * 0.06} ry={size * 0.04} fill="#FFB6C1" opacity={0.5} />
            <ellipse cx={cx + faceShape.rx * 0.6} cy={eyeY + faceShape.ry * 0.3} rx={size * 0.06} ry={size * 0.04} fill="#FFB6C1" opacity={0.5} />
          </g>
        );
      case "thinking":
        // Thought bubble dots
        return (
          <g fill="hsl(var(--muted-foreground))" opacity={0.6}>
            <circle cx={cx + faceShape.rx * 1.1} cy={cy - faceShape.ry * 0.5} r={size * 0.02} />
            <circle cx={cx + faceShape.rx * 1.25} cy={cy - faceShape.ry * 0.75} r={size * 0.025} />
            <circle cx={cx + faceShape.rx * 1.35} cy={cy - faceShape.ry * 1.0} r={size * 0.03} />
          </g>
        );
      default:
        return null;
    }
  };

  // Simple hair renderer (simplified from AvatarPreview)
  const renderHair = () => {
    const hairTop = cy - faceShape.ry;
    
    switch (config.hairStyle) {
      case "short":
        return (
          <path
            d={`M ${cx - faceShape.rx * 0.9} ${cy - faceShape.ry * 0.3}
                Q ${cx - faceShape.rx} ${hairTop - 15} ${cx} ${hairTop - 20}
                Q ${cx + faceShape.rx} ${hairTop - 15} ${cx + faceShape.rx * 0.9} ${cy - faceShape.ry * 0.3}
                Q ${cx + faceShape.rx * 0.5} ${hairTop - 5} ${cx} ${hairTop}
                Q ${cx - faceShape.rx * 0.5} ${hairTop - 5} ${cx - faceShape.rx * 0.9} ${cy - faceShape.ry * 0.3}`}
            fill={config.hairColor}
          />
        );
      case "medium":
        return (
          <path
            d={`M ${cx - faceShape.rx * 1.1} ${cy + faceShape.ry * 0.3}
                Q ${cx - faceShape.rx * 1.2} ${hairTop - 10} ${cx} ${hairTop - 25}
                Q ${cx + faceShape.rx * 1.2} ${hairTop - 10} ${cx + faceShape.rx * 1.1} ${cy + faceShape.ry * 0.3}
                L ${cx + faceShape.rx * 0.9} ${cy + faceShape.ry * 0.2}
                Q ${cx + faceShape.rx * 0.5} ${hairTop + 5} ${cx} ${hairTop + 5}
                Q ${cx - faceShape.rx * 0.5} ${hairTop + 5} ${cx - faceShape.rx * 0.9} ${cy + faceShape.ry * 0.2}
                Z`}
            fill={config.hairColor}
          />
        );
      case "bald":
      default:
        return null;
    }
  };

  const animationClass = animated ? {
    "happy": "animate-bounce-gentle",
    "celebrating": "animate-celebrate",
    "thinking": "animate-think",
    "encouraging": "animate-pulse-soft",
    "neutral": ""
  }[expression] : "";

  return (
    <div className={cn("relative inline-flex", className, animationClass)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle cx={cx} cy={cy} r={size * 0.48} fill="hsl(var(--muted))" />
        
        {/* Face */}
        <ellipse
          cx={cx}
          cy={cy}
          rx={faceShape.rx}
          ry={faceShape.ry}
          fill={config.skinTone}
          stroke="hsl(var(--border))"
          strokeWidth={1}
        />
        
        {/* Ears */}
        <ellipse cx={cx - faceShape.rx} cy={cy} rx={size * 0.05} ry={size * 0.08} fill={config.skinTone} />
        <ellipse cx={cx + faceShape.rx} cy={cy} rx={size * 0.05} ry={size * 0.08} fill={config.skinTone} />
        
        {/* Hair */}
        {renderHair()}
        
        {/* Eyebrows - adjust based on expression */}
        {expression === "thinking" ? (
          <>
            <line
              x1={cx - faceShape.rx * 0.55}
              y1={cy - faceShape.ry * 0.42}
              x2={cx - faceShape.rx * 0.25}
              y2={cy - faceShape.ry * 0.38}
              stroke={config.hairColor}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <line
              x1={cx + faceShape.rx * 0.25}
              y1={cy - faceShape.ry * 0.35}
              x2={cx + faceShape.rx * 0.55}
              y2={cy - faceShape.ry * 0.42}
              stroke={config.hairColor}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            <line
              x1={cx - faceShape.rx * 0.55}
              y1={cy - faceShape.ry * 0.35}
              x2={cx - faceShape.rx * 0.25}
              y2={cy - faceShape.ry * 0.38}
              stroke={config.hairColor}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <line
              x1={cx + faceShape.rx * 0.25}
              y1={cy - faceShape.ry * 0.38}
              x2={cx + faceShape.rx * 0.55}
              y2={cy - faceShape.ry * 0.35}
              stroke={config.hairColor}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </>
        )}
        
        {/* Eyes */}
        {renderExpressionEyes()}
        
        {/* Nose */}
        <path
          d={`M ${cx} ${cy} L ${cx - 4} ${cy + faceShape.ry * 0.18} L ${cx + 4} ${cy + faceShape.ry * 0.18}`}
          stroke="hsl(var(--muted-foreground) / 0.3)"
          strokeWidth={1.5}
          fill="none"
        />
        
        {/* Mouth */}
        {renderExpressionMouth()}
        
        {/* Expression extras */}
        {renderExpressionExtras()}
      </svg>
      
      {/* Expression indicator badge */}
      {expression !== "neutral" && (
        <div className="absolute -bottom-1 -right-1 text-sm">
          {expression === "happy" && "😊"}
          {expression === "thinking" && "🤔"}
          {expression === "encouraging" && "👍"}
          {expression === "celebrating" && "🎉"}
        </div>
      )}
    </div>
  );
};
