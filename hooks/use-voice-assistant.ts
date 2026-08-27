'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'unsupported' | 'error';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function useVoiceAssistant() {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onFinalRef = useRef<((text: string) => void) | null>(null);
  const manualStopRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      setState('unsupported');
      return;
    }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (interim) setInterimTranscript(interim);
      if (final) {
        setTranscript((prev) => prev + final);
        setInterimTranscript('');
        if (onFinalRef.current) {
          onFinalRef.current(final);
          onFinalRef.current = null;
        }
      }
    };

    recognition.onerror = () => {
      setState('error');
      setTimeout(() => setState('idle'), 2000);
    };

    recognition.onend = () => {
      if (!manualStopRef.current) {
        try {
          recognition.start();
        } catch {
          setState('idle');
        }
      } else {
        setState('idle');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      manualStopRef.current = true;
      try {
        recognition.abort();
      } catch {
        // already stopped
      }
    };
  }, []);

  const startListening = useCallback((onFinal?: (text: string) => void) => {
    if (!recognitionRef.current) return;
    manualStopRef.current = false;
    setTranscript('');
    setInterimTranscript('');
    onFinalRef.current = onFinal || null;
    try {
      recognitionRef.current.start();
      setState('listening');
    } catch {
      // already started
    }
  }, []);

  const stopListening = useCallback(() => {
    manualStopRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // already stopped
      }
    }
    setState('idle');
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setState('speaking');
    utterance.onend = () => {
      setState('idle');
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      setState('idle');
      if (onEnd) onEnd();
    };
    setState('speaking');
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setState('idle');
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setState('idle');
  }, []);

  return {
    state,
    transcript,
    interimTranscript,
    supported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    reset,
  };
}
