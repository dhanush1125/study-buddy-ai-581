import { useState, useCallback, useEffect } from 'react';

interface UseSpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
}

export const useSpeech = (options: UseSpeechOptions = {}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Select a good default voice (prefer English voices)
      const englishVoice = availableVoices.find(
        voice => voice.lang.startsWith('en') && voice.name.includes('Google')
      ) || availableVoices.find(
        voice => voice.lang.startsWith('en')
      ) || availableVoices[0];
      
      if (englishVoice && !selectedVoice) {
        setSelectedVoice(englishVoice);
      }
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoice]);

  // Clean up text for speaking (remove markdown, special characters, etc.)
  const cleanTextForSpeech = (text: string): string => {
    return text
      // Remove markdown headers
      .replace(/#{1,6}\s*/g, '')
      // Remove bold/italic markers
      .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
      .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      // Remove links, keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove image markers
      .replace(/\[GENERATE_IMAGE:[^\]]+\]/g, '')
      .replace(/\[GENERATE_VIDEO:[^\]]+\]/g, '')
      // Remove bullet points
      .replace(/^[-*•]\s*/gm, '')
      // Clean up extra whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText) return;

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.rate = options.rate ?? 1;
    utterance.pitch = options.pitch ?? 1;
    utterance.volume = options.volume ?? 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    speechSynthesis.speak(utterance);
  }, [selectedVoice, options.rate, options.pitch, options.volume]);

  const pause = useCallback(() => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const toggleSpeaking = useCallback(() => {
    if (isSpeaking && !isPaused) {
      pause();
    } else if (isPaused) {
      resume();
    }
  }, [isSpeaking, isPaused, pause, resume]);

  return {
    speak,
    pause,
    resume,
    stop,
    toggleSpeaking,
    isSpeaking,
    isPaused,
    voices,
    selectedVoice,
    setSelectedVoice,
    isSupported: 'speechSynthesis' in window,
  };
};
