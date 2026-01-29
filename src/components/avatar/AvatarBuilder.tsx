import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AvatarPreview } from "./AvatarPreview";
import {
  AvatarConfig,
  defaultAvatarConfig,
  faceShapes,
  skinTones,
  hairStyles,
  hairColors,
  eyeStyles,
  eyeColors,
  accessories,
  accessoryColors,
} from "./avatarParts";
import { cn } from "@/lib/utils";
import { Shuffle, Save, RotateCcw } from "lucide-react";

interface AvatarBuilderProps {
  initialConfig?: AvatarConfig;
  onSave: (config: AvatarConfig) => void;
  isSaving?: boolean;
}

export const AvatarBuilder = ({ initialConfig, onSave, isSaving }: AvatarBuilderProps) => {
  const [config, setConfig] = useState<AvatarConfig>(initialConfig || defaultAvatarConfig);

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const updateConfig = (key: keyof AvatarConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const randomize = () => {
    const randomFrom = <T extends { id: string }>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)].id;
    setConfig({
      faceShape: randomFrom(faceShapes),
      skinTone: randomFrom(skinTones),
      hairStyle: randomFrom(hairStyles),
      hairColor: randomFrom(hairColors),
      eyeStyle: randomFrom(eyeStyles),
      eyeColor: randomFrom(eyeColors),
      accessory: randomFrom(accessories),
      accessoryColor: randomFrom(accessoryColors),
    });
  };

  const reset = () => {
    setConfig(defaultAvatarConfig);
  };

  const ColorButton = ({
    color,
    isSelected,
    onClick,
    label,
  }: {
    color: string;
    isSelected: boolean;
    onClick: () => void;
    label: string;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "w-10 h-10 rounded-full border-2 transition-all hover:scale-110",
        isSelected ? "border-primary ring-2 ring-primary/30" : "border-border"
      )}
      style={{ backgroundColor: color }}
      title={label}
    />
  );

  const OptionButton = ({
    isSelected,
    onClick,
    children,
  }: {
    isSelected: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
        isSelected
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background border-border hover:bg-muted"
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Preview */}
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-soft">
          <AvatarPreview config={config} size={200} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={randomize} className="gap-1.5">
            <Shuffle className="w-4 h-4" />
            Random
          </Button>
          <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>
      </div>

      {/* Options */}
      <div className="flex-1">
        <Tabs defaultValue="face" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="face">Face</TabsTrigger>
            <TabsTrigger value="hair">Hair</TabsTrigger>
            <TabsTrigger value="eyes">Eyes</TabsTrigger>
            <TabsTrigger value="extras">Extras</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[280px] mt-4">
            <TabsContent value="face" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Face Shape</Label>
                <div className="flex flex-wrap gap-2">
                  {faceShapes.map((shape) => (
                    <OptionButton
                      key={shape.id}
                      isSelected={config.faceShape === shape.id}
                      onClick={() => updateConfig("faceShape", shape.id)}
                    >
                      {shape.label}
                    </OptionButton>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Skin Tone</Label>
                <div className="flex flex-wrap gap-2">
                  {skinTones.map((tone) => (
                    <ColorButton
                      key={tone.id}
                      color={tone.id}
                      isSelected={config.skinTone === tone.id}
                      onClick={() => updateConfig("skinTone", tone.id)}
                      label={tone.label}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="hair" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Hair Style</Label>
                <div className="flex flex-wrap gap-2">
                  {hairStyles.map((style) => (
                    <OptionButton
                      key={style.id}
                      isSelected={config.hairStyle === style.id}
                      onClick={() => updateConfig("hairStyle", style.id)}
                    >
                      {style.label}
                    </OptionButton>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Hair Color</Label>
                <div className="flex flex-wrap gap-2">
                  {hairColors.map((color) => (
                    <ColorButton
                      key={color.id}
                      color={color.id}
                      isSelected={config.hairColor === color.id}
                      onClick={() => updateConfig("hairColor", color.id)}
                      label={color.label}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="eyes" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Eye Style</Label>
                <div className="flex flex-wrap gap-2">
                  {eyeStyles.map((style) => (
                    <OptionButton
                      key={style.id}
                      isSelected={config.eyeStyle === style.id}
                      onClick={() => updateConfig("eyeStyle", style.id)}
                    >
                      {style.label}
                    </OptionButton>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Eye Color</Label>
                <div className="flex flex-wrap gap-2">
                  {eyeColors.map((color) => (
                    <ColorButton
                      key={color.id}
                      color={color.id}
                      isSelected={config.eyeColor === color.id}
                      onClick={() => updateConfig("eyeColor", color.id)}
                      label={color.label}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="extras" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Accessory</Label>
                <div className="flex flex-wrap gap-2">
                  {accessories.map((acc) => (
                    <OptionButton
                      key={acc.id}
                      isSelected={config.accessory === acc.id}
                      onClick={() => updateConfig("accessory", acc.id)}
                    >
                      {acc.label}
                    </OptionButton>
                  ))}
                </div>
              </div>

              {config.accessory !== "none" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Accessory Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {accessoryColors.map((color) => (
                      <ColorButton
                        key={color.id}
                        color={color.id}
                        isSelected={config.accessoryColor === color.id}
                        onClick={() => updateConfig("accessoryColor", color.id)}
                        label={color.label}
                      />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="mt-6">
          <Button onClick={() => onSave(config)} disabled={isSaving} className="w-full gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Avatar"}
          </Button>
        </div>
      </div>
    </div>
  );
};
