"use client";

import { MicIcon, SquareIcon } from "lucide-react";
import {
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function PureVoiceInputButton({
  input,
  setInput,
  disabled,
}: {
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  disabled?: boolean;
}) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const inputRef = useRef(input);
  inputRef.current = input;

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      toast.error(
        "La saisie vocale n'est pas prise en charge par ce navigateur. Essayez Chrome, Edge ou Safari."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = navigator.language || "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;

    const baseText = inputRef.current.trim();
    let finalTranscript = "";

    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      const spoken = `${finalTranscript}${interimTranscript}`.trim();
      setInput(baseText ? `${baseText} ${spoken}` : spoken);
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        toast.error("Autorisez l'accès au microphone pour utiliser la saisie vocale.");
      } else if (event.error !== "aborted" && event.error !== "no-speech") {
        toast.error("Erreur de reconnaissance vocale. Veuillez réessayer.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, [setInput]);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (isListening) {
        stopListening();
      } else {
        startListening();
      }
    },
    [isListening, startListening, stopListening]
  );

  return (
    <Button
      aria-label={isListening ? "Arrêter la dictée" : "Dicter un message"}
      aria-pressed={isListening}
      className={cn(
        "h-7 w-7 rounded-xl p-1 transition-all duration-200",
        isListening
          ? "animate-pulse bg-primary text-primary-foreground hover:bg-primary/90"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
      data-testid="voice-button"
      disabled={disabled && !isListening}
      onClick={handleClick}
      title={isListening ? "Arrêter la dictée" : "Dicter un message"}
      type="button"
      variant="ghost"
    >
      {isListening ? (
        <SquareIcon className="size-3 fill-current" />
      ) : (
        <MicIcon className="size-4" />
      )}
    </Button>
  );
}

export const VoiceInputButton = memo(PureVoiceInputButton);
