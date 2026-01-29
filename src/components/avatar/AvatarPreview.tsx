import { AvatarConfig } from "./avatarParts";

interface AvatarPreviewProps {
  config: AvatarConfig;
  size?: number;
  className?: string;
}

export const AvatarPreview = ({ config, size = 200, className = "" }: AvatarPreviewProps) => {
  const getFaceShape = () => {
    switch (config.faceShape) {
      case "oval":
        return { rx: size * 0.35, ry: size * 0.42 };
      case "square":
        return { rx: size * 0.32, ry: size * 0.35 };
      default: // round
        return { rx: size * 0.38, ry: size * 0.38 };
    }
  };

  const faceShape = getFaceShape();
  const cx = size / 2;
  const cy = size / 2;

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
      case "long":
        return (
          <path
            d={`M ${cx - faceShape.rx * 1.15} ${cy + faceShape.ry * 0.9}
                Q ${cx - faceShape.rx * 1.3} ${hairTop} ${cx} ${hairTop - 30}
                Q ${cx + faceShape.rx * 1.3} ${hairTop} ${cx + faceShape.rx * 1.15} ${cy + faceShape.ry * 0.9}
                L ${cx + faceShape.rx * 1} ${cy + faceShape.ry * 0.8}
                Q ${cx + faceShape.rx * 0.6} ${hairTop + 10} ${cx} ${hairTop + 10}
                Q ${cx - faceShape.rx * 0.6} ${hairTop + 10} ${cx - faceShape.rx * 1} ${cy + faceShape.ry * 0.8}
                Z`}
            fill={config.hairColor}
          />
        );
      case "curly":
        return (
          <g fill={config.hairColor}>
            {[-1, -0.5, 0, 0.5, 1].map((offset, i) => (
              <circle
                key={i}
                cx={cx + offset * faceShape.rx * 0.7}
                cy={hairTop - 5 + Math.abs(offset) * 8}
                r={size * 0.12}
              />
            ))}
            {[-0.8, 0.8].map((offset, i) => (
              <circle
                key={`side-${i}`}
                cx={cx + offset * faceShape.rx * 1.1}
                cy={cy - faceShape.ry * 0.2}
                r={size * 0.1}
              />
            ))}
          </g>
        );
      case "ponytail":
        return (
          <>
            <path
              d={`M ${cx - faceShape.rx * 0.9} ${cy - faceShape.ry * 0.3}
                  Q ${cx - faceShape.rx} ${hairTop - 15} ${cx} ${hairTop - 20}
                  Q ${cx + faceShape.rx} ${hairTop - 15} ${cx + faceShape.rx * 0.9} ${cy - faceShape.ry * 0.3}
                  Q ${cx + faceShape.rx * 0.5} ${hairTop - 5} ${cx} ${hairTop}
                  Q ${cx - faceShape.rx * 0.5} ${hairTop - 5} ${cx - faceShape.rx * 0.9} ${cy - faceShape.ry * 0.3}`}
              fill={config.hairColor}
            />
            <ellipse
              cx={cx}
              cy={hairTop - 35}
              rx={size * 0.1}
              ry={size * 0.15}
              fill={config.hairColor}
            />
          </>
        );
      case "bald":
      default:
        return null;
    }
  };

  const renderEyes = () => {
    const eyeY = cy - faceShape.ry * 0.1;
    const eyeSpacing = faceShape.rx * 0.45;
    const eyeSize = size * 0.06;

    switch (config.eyeStyle) {
      case "happy":
        return (
          <g>
            <path
              d={`M ${cx - eyeSpacing - eyeSize} ${eyeY} Q ${cx - eyeSpacing} ${eyeY - eyeSize * 1.5} ${cx - eyeSpacing + eyeSize} ${eyeY}`}
              stroke={config.eyeColor}
              strokeWidth={2.5}
              fill="none"
            />
            <path
              d={`M ${cx + eyeSpacing - eyeSize} ${eyeY} Q ${cx + eyeSpacing} ${eyeY - eyeSize * 1.5} ${cx + eyeSpacing + eyeSize} ${eyeY}`}
              stroke={config.eyeColor}
              strokeWidth={2.5}
              fill="none"
            />
          </g>
        );
      case "sleepy":
        return (
          <g>
            <ellipse cx={cx - eyeSpacing} cy={eyeY} rx={eyeSize} ry={eyeSize * 0.4} fill={config.eyeColor} />
            <ellipse cx={cx + eyeSpacing} cy={eyeY} rx={eyeSize} ry={eyeSize * 0.4} fill={config.eyeColor} />
          </g>
        );
      case "wink":
        return (
          <g>
            <circle cx={cx - eyeSpacing} cy={eyeY} r={eyeSize} fill="white" stroke="#333" strokeWidth={1} />
            <circle cx={cx - eyeSpacing} cy={eyeY} r={eyeSize * 0.5} fill={config.eyeColor} />
            <path
              d={`M ${cx + eyeSpacing - eyeSize} ${eyeY} L ${cx + eyeSpacing + eyeSize} ${eyeY}`}
              stroke={config.eyeColor}
              strokeWidth={2.5}
            />
          </g>
        );
      default: // normal
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

  const renderAccessory = () => {
    const eyeY = cy - faceShape.ry * 0.1;
    const eyeSpacing = faceShape.rx * 0.45;

    switch (config.accessory) {
      case "glasses":
        return (
          <g fill="none" stroke={config.accessoryColor} strokeWidth={2}>
            <circle cx={cx - eyeSpacing} cy={eyeY} r={size * 0.1} />
            <circle cx={cx + eyeSpacing} cy={eyeY} r={size * 0.1} />
            <line x1={cx - eyeSpacing + size * 0.1} y1={eyeY} x2={cx + eyeSpacing - size * 0.1} y2={eyeY} />
            <line x1={cx - eyeSpacing - size * 0.1} y1={eyeY} x2={cx - faceShape.rx * 0.95} y2={eyeY - 5} />
            <line x1={cx + eyeSpacing + size * 0.1} y1={eyeY} x2={cx + faceShape.rx * 0.95} y2={eyeY - 5} />
          </g>
        );
      case "sunglasses":
        return (
          <g>
            <rect
              x={cx - eyeSpacing - size * 0.1}
              y={eyeY - size * 0.07}
              width={size * 0.2}
              height={size * 0.14}
              rx={4}
              fill={config.accessoryColor}
              opacity={0.9}
            />
            <rect
              x={cx + eyeSpacing - size * 0.1}
              y={eyeY - size * 0.07}
              width={size * 0.2}
              height={size * 0.14}
              rx={4}
              fill={config.accessoryColor}
              opacity={0.9}
            />
            <line
              x1={cx - eyeSpacing + size * 0.1}
              y1={eyeY}
              x2={cx + eyeSpacing - size * 0.1}
              y2={eyeY}
              stroke={config.accessoryColor}
              strokeWidth={3}
            />
          </g>
        );
      case "headphones":
        return (
          <g fill="none" stroke={config.accessoryColor} strokeWidth={4}>
            <path d={`M ${cx - faceShape.rx * 0.9} ${eyeY} Q ${cx - faceShape.rx * 1.1} ${cy - faceShape.ry * 1.1} ${cx} ${cy - faceShape.ry * 1.05} Q ${cx + faceShape.rx * 1.1} ${cy - faceShape.ry * 1.1} ${cx + faceShape.rx * 0.9} ${eyeY}`} />
            <circle cx={cx - faceShape.rx * 0.95} cy={eyeY + 5} r={size * 0.06} fill={config.accessoryColor} />
            <circle cx={cx + faceShape.rx * 0.95} cy={eyeY + 5} r={size * 0.06} fill={config.accessoryColor} />
          </g>
        );
      case "hat":
        return (
          <g fill={config.accessoryColor}>
            <ellipse cx={cx} cy={cy - faceShape.ry * 0.85} rx={faceShape.rx * 1.3} ry={size * 0.06} />
            <rect
              x={cx - faceShape.rx * 0.7}
              y={cy - faceShape.ry * 1.35}
              width={faceShape.rx * 1.4}
              height={faceShape.ry * 0.5}
              rx={10}
            />
          </g>
        );
      case "bow":
        return (
          <g fill={config.accessoryColor}>
            <ellipse cx={cx - size * 0.08} cy={cy - faceShape.ry * 0.95} rx={size * 0.08} ry={size * 0.05} />
            <ellipse cx={cx + size * 0.08} cy={cy - faceShape.ry * 0.95} rx={size * 0.08} ry={size * 0.05} />
            <circle cx={cx} cy={cy - faceShape.ry * 0.95} r={size * 0.03} />
          </g>
        );
      default:
        return null;
    }
  };

  // Simple mouth
  const mouthY = cy + faceShape.ry * 0.35;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
    >
      {/* Background circle */}
      <circle cx={cx} cy={cy} r={size * 0.48} fill="hsl(var(--muted))" />
      
      {/* Hair behind face (for long styles) */}
      {config.hairStyle === "long" && renderHair()}
      
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
      
      {/* Hair (in front for most styles) */}
      {config.hairStyle !== "long" && renderHair()}
      
      {/* Eyebrows */}
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
      
      {/* Eyes */}
      {renderEyes()}
      
      {/* Nose */}
      <path
        d={`M ${cx} ${cy} L ${cx - 5} ${cy + faceShape.ry * 0.2} L ${cx + 5} ${cy + faceShape.ry * 0.2}`}
        stroke="hsl(var(--muted-foreground) / 0.3)"
        strokeWidth={1.5}
        fill="none"
      />
      
      {/* Mouth - friendly smile */}
      <path
        d={`M ${cx - faceShape.rx * 0.25} ${mouthY} Q ${cx} ${mouthY + 10} ${cx + faceShape.rx * 0.25} ${mouthY}`}
        stroke="#E57373"
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Accessory */}
      {renderAccessory()}
    </svg>
  );
};
