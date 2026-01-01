import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, BookOpen, Clock, Target } from "lucide-react";

interface QuickRevisionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStartRevision: (topic: string, timeframe: string) => void;
}

const suggestedTopics = [
  "Operating System Basics",
  "Data Structures",
  "DBMS Concepts",
  "Computer Networks",
  "OOP Principles",
  "SQL Queries",
];

const timeframes = [
  { label: "Exam in hours", value: "hours", icon: "🚨" },
  { label: "Exam tomorrow", value: "tomorrow", icon: "⏰" },
  { label: "Exam in a few days", value: "days", icon: "📅" },
];

export const QuickRevisionDialog = ({
  isOpen,
  onClose,
  onStartRevision,
}: QuickRevisionDialogProps) => {
  const [customTopic, setCustomTopic] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState("tomorrow");

  const handleStartRevision = (topic: string) => {
    onStartRevision(topic, selectedTimeframe);
    setCustomTopic("");
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTopic.trim()) {
      handleStartRevision(customTopic.trim());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Quick Revision Mode
          </DialogTitle>
          <DialogDescription>
            Focus on high-priority topics with stress-free exam prep
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Timeframe Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Clock className="w-4 h-4" />
              When is your exam?
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {timeframes.map((tf) => (
                <Button
                  key={tf.value}
                  variant={selectedTimeframe === tf.value ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setSelectedTimeframe(tf.value)}
                >
                  {tf.icon} {tf.label.split(" ").slice(-1)[0]}
                </Button>
              ))}
            </div>
          </div>

          {/* Suggested Topics */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Target className="w-4 h-4" />
              Quick pick a topic
            </Label>
            <div className="flex flex-wrap gap-2">
              {suggestedTopics.map((topic) => (
                <Button
                  key={topic}
                  variant="outline"
                  size="sm"
                  className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => handleStartRevision(topic)}
                >
                  {topic}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Topic Input */}
          <form onSubmit={handleCustomSubmit} className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <BookOpen className="w-4 h-4" />
              Or enter your topic
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Deadlock in OS, SQL Joins..."
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={!customTopic.trim()}>
                Start
              </Button>
            </div>
          </form>

          {/* Tips */}
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">💡 Quick Revision focuses on:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>High-weightage exam topics</li>
              <li>Memory tricks & mnemonics</li>
              <li>One concept at a time</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
