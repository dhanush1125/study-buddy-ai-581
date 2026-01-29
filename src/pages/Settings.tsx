import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useSpeech } from "@/hooks/useSpeech";
import { SPEECH_LANGUAGES } from "@/hooks/useSpeechRecognition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Volume2, Mic, Settings2, Check, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { AvatarBuilder, AvatarPreview, defaultAvatarConfig } from "@/components/avatar";
import type { AvatarConfig } from "@/components/avatar";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { 
    preferences, 
    isLoading: preferencesLoading, 
    isSaving,
    savePreferences,
    saveAvatarConfig,
    getAvatarConfig,
  } = useUserPreferences();
  
  const [isAvatarSaving, setIsAvatarSaving] = useState(false);
  
  const { voices, speak, stop, isSpeaking } = useSpeech({ rate: preferences.ttsRate });
  
  // Local state for form
  const [speechLanguage, setSpeechLanguage] = useState(preferences.speechLanguage);
  const [ttsVoiceName, setTtsVoiceName] = useState(preferences.ttsVoiceName);
  const [ttsRate, setTtsRate] = useState(preferences.ttsRate);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local state with preferences when loaded
  useEffect(() => {
    setSpeechLanguage(preferences.speechLanguage);
    setTtsVoiceName(preferences.ttsVoiceName);
    setTtsRate(preferences.ttsRate);
  }, [preferences]);

  // Track changes
  useEffect(() => {
    const changed = 
      speechLanguage !== preferences.speechLanguage ||
      ttsVoiceName !== preferences.ttsVoiceName ||
      ttsRate !== preferences.ttsRate;
    setHasChanges(changed);
  }, [speechLanguage, ttsVoiceName, ttsRate, preferences]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleSave = async () => {
    await savePreferences({
      speechLanguage,
      ttsVoiceName,
      ttsRate,
    });
    setHasChanges(false);
    toast.success("Settings saved successfully!");
  };

  const handleAvatarSave = async (config: AvatarConfig) => {
    setIsAvatarSaving(true);
    await saveAvatarConfig(config);
    setIsAvatarSaving(false);
    toast.success("Avatar saved successfully!");
  };

  const handleTestVoice = () => {
    if (isSpeaking) {
      stop();
    } else {
      const testVoice = voices.find(v => v.name === ttsVoiceName);
      if (testVoice) {
        // Temporarily use the selected voice for testing
        const utterance = new SpeechSynthesisUtterance("Hello! This is how I will read your study materials.");
        utterance.voice = testVoice;
        utterance.rate = ttsRate;
        speechSynthesis.speak(utterance);
      } else {
        speak("Hello! This is how I will read your study materials.");
      }
    }
  };

  const getVoiceDisplayName = (voice: SpeechSynthesisVoice) => {
    const name = voice.name.replace(/Microsoft|Google|Apple|Amazon|Polly|Neural|Premium|Enhanced/gi, '').trim();
    return `${name} (${voice.lang})`;
  };

  const currentLanguage = SPEECH_LANGUAGES.find(l => l.code === speechLanguage) || SPEECH_LANGUAGES[0];

  if (authLoading || preferencesLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Settings</h1>
              <p className="text-xs text-muted-foreground">Manage your preferences</p>
            </div>
          </div>
          {hasChanges && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="ml-auto gap-2"
              size="sm"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Save Changes
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Avatar Customization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Your Avatar
            </CardTitle>
            <CardDescription>
              Create your custom avatar with face, hair, eyes, and accessories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AvatarBuilder
              initialConfig={getAvatarConfig()}
              onSave={handleAvatarSave}
              isSaving={isAvatarSaving}
            />
          </CardContent>
        </Card>

        {/* Speech Recognition Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" />
              Speech Recognition
            </CardTitle>
            <CardDescription>
              Configure how StudyBuddy listens to your voice input
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="speech-language">Input Language</Label>
              <Select
                value={speechLanguage}
                onValueChange={setSpeechLanguage}
              >
                <SelectTrigger id="speech-language" className="w-full">
                  <SelectValue>
                    <span className="flex items-center gap-2">
                      <span>{currentLanguage.flag}</span>
                      <span>{currentLanguage.name}</span>
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[300px] bg-popover z-50">
                  {SPEECH_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose the language you'll speak when using voice input
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Text-to-Speech Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-primary" />
              Text-to-Speech
            </CardTitle>
            <CardDescription>
              Configure how StudyBuddy reads responses aloud
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="tts-voice">Voice</Label>
              <Select
                value={ttsVoiceName || ''}
                onValueChange={setTtsVoiceName}
              >
                <SelectTrigger id="tts-voice" className="w-full">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] bg-popover z-50">
                  {voices.map((voice) => (
                    <SelectItem key={voice.name} value={voice.name}>
                      {getVoiceDisplayName(voice)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose the voice for reading study materials
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="tts-speed">Reading Speed</Label>
                <span className="text-sm text-muted-foreground">{ttsRate.toFixed(2)}x</span>
              </div>
              <Slider
                id="tts-speed"
                value={[ttsRate]}
                onValueChange={([value]) => setTtsRate(value)}
                min={0.5}
                max={2}
                step={0.05}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Slower (0.5x)</span>
                <span>Normal (1x)</span>
                <span>Faster (2x)</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleTestVoice}
              className="w-full gap-2"
            >
              <Volume2 className="w-4 h-4" />
              {isSpeaking ? "Stop Test" : "Test Voice"}
            </Button>
          </CardContent>
        </Card>

        {/* Account Section */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Manage your account settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">{user.email}</p>
                <p className="text-xs text-muted-foreground">Signed in</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => signOut()}
              className="w-full text-destructive hover:text-destructive"
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SettingsPage;
