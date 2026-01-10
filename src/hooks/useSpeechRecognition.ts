import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

// Browser speech recognition types
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export const useSpeechRecognition = (options: UseSpeechRecognitionOptions = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Check if speech recognition is supported
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Initialize recognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionAPI();
    
    const recognition = recognitionRef.current;
    recognition.continuous = options.continuous ?? false;
    recognition.interimResults = options.interimResults ?? true;
    recognition.lang = options.lang ?? 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      
      // Don't show error for user-initiated stops
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        setError(event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    return () => {
      recognition.abort();
    };
  }, [isSupported, options.continuous, options.interimResults, options.lang]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError('Failed to start speech recognition');
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    
    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.error('Failed to stop speech recognition:', err);
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  };
};
