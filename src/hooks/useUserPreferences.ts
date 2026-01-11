import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserPreferences {
  speechLanguage: string;
  ttsVoiceName: string | null;
  ttsRate: number;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  speechLanguage: 'en-US',
  ttsVoiceName: null,
  ttsRate: 0.95,
};

export const useUserPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load preferences from database
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) {
        setPreferences(DEFAULT_PREFERENCES);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('speech_language, tts_voice_name, tts_rate')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows returned, which is fine for new users
          console.error('Error loading preferences:', error);
        }

        if (data) {
          setPreferences({
            speechLanguage: data.speech_language,
            ttsVoiceName: data.tts_voice_name,
            ttsRate: Number(data.tts_rate),
          });
        }
      } catch (err) {
        console.error('Failed to load preferences:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  // Save preferences to database
  const savePreferences = useCallback(async (newPrefs: Partial<UserPreferences>) => {
    if (!user) return;

    const updatedPrefs = { ...preferences, ...newPrefs };
    setPreferences(updatedPrefs);
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          speech_language: updatedPrefs.speechLanguage,
          tts_voice_name: updatedPrefs.ttsVoiceName,
          tts_rate: updatedPrefs.ttsRate,
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('Error saving preferences:', error);
      }
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setIsSaving(false);
    }
  }, [user, preferences]);

  return {
    preferences,
    isLoading,
    isSaving,
    savePreferences,
    setSpeechLanguage: (lang: string) => savePreferences({ speechLanguage: lang }),
    setTtsVoiceName: (name: string | null) => savePreferences({ ttsVoiceName: name }),
    setTtsRate: (rate: number) => savePreferences({ ttsRate: rate }),
  };
};
