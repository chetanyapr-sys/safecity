// frontend/components/VoiceInput.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";

interface VoiceInputProps {
  onResult: (text: string) => void;
}

export default function VoiceInput({ onResult }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [onResult]);

  if (!isSupported) return null;

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`absolute right-2 bottom-2 p-2 rounded-full transition-colors ${
        isListening
          ? "bg-red-500 text-white animate-pulse"
          : "bg-muted hover:bg-muted/80 text-muted-foreground"
      }`}
      title={isListening ? "Stop recording" : "Start voice input"}
    >
      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
    </button>
  );
}