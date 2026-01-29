// Avatar customization options and SVG definitions

export interface AvatarConfig {
  faceShape: string;
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyeStyle: string;
  eyeColor: string;
  accessory: string;
  accessoryColor: string;
}

export const defaultAvatarConfig: AvatarConfig = {
  faceShape: "round",
  skinTone: "#F5D0C5",
  hairStyle: "short",
  hairColor: "#4A3728",
  eyeStyle: "normal",
  eyeColor: "#4A90D9",
  accessory: "none",
  accessoryColor: "#FFD700",
};

export const faceShapes = [
  { id: "round", label: "Round" },
  { id: "oval", label: "Oval" },
  { id: "square", label: "Square" },
];

export const skinTones = [
  { id: "#FFECD1", label: "Light" },
  { id: "#F5D0C5", label: "Fair" },
  { id: "#D4A984", label: "Medium" },
  { id: "#C68642", label: "Tan" },
  { id: "#8D5524", label: "Brown" },
  { id: "#5C3317", label: "Dark" },
];

export const hairStyles = [
  { id: "short", label: "Short" },
  { id: "medium", label: "Medium" },
  { id: "long", label: "Long" },
  { id: "curly", label: "Curly" },
  { id: "ponytail", label: "Ponytail" },
  { id: "bald", label: "Bald" },
];

export const hairColors = [
  { id: "#0D0D0D", label: "Black" },
  { id: "#4A3728", label: "Brown" },
  { id: "#B8860B", label: "Golden" },
  { id: "#FF6B35", label: "Ginger" },
  { id: "#8B4513", label: "Auburn" },
  { id: "#C0C0C0", label: "Silver" },
  { id: "#FF69B4", label: "Pink" },
  { id: "#4169E1", label: "Blue" },
];

export const eyeStyles = [
  { id: "normal", label: "Normal" },
  { id: "happy", label: "Happy" },
  { id: "sleepy", label: "Sleepy" },
  { id: "wink", label: "Wink" },
];

export const eyeColors = [
  { id: "#4A90D9", label: "Blue" },
  { id: "#2E8B57", label: "Green" },
  { id: "#8B4513", label: "Brown" },
  { id: "#2F4F4F", label: "Dark" },
  { id: "#9370DB", label: "Purple" },
];

export const accessories = [
  { id: "none", label: "None" },
  { id: "glasses", label: "Glasses" },
  { id: "sunglasses", label: "Sunglasses" },
  { id: "headphones", label: "Headphones" },
  { id: "hat", label: "Hat" },
  { id: "bow", label: "Bow" },
];

export const accessoryColors = [
  { id: "#2C3E50", label: "Black" },
  { id: "#FFD700", label: "Gold" },
  { id: "#FF6B6B", label: "Red" },
  { id: "#4ECDC4", label: "Teal" },
  { id: "#9B59B6", label: "Purple" },
  { id: "#FFFFFF", label: "White" },
];
