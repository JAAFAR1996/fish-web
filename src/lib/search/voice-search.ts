import type { VoiceSearchState } from '@/types';

export interface VoiceSearchHandlerOptions {
  locale: string;
  onResult: (transcript: string, isFinal: boolean) => void;
  onStateChange?: (state: VoiceSearchState) => void;
  onError?: (messageKey: string) => void;
}

const STATE_ERROR_KEYS: Record<string, string> = {
  'no-speech': 'search.voice.noSpeech',
  'audio-capture': 'search.voice.permissionDenied',
  'not-allowed': 'search.voice.permissionDenied',
  network: 'search.voice.error',
};

export const isVoiceSearchSupported = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
};

export class VoiceSearchHandler {
  private recognition: SpeechRecognition;
  private state: VoiceSearchState = 'idle';

  private readonly onResult: (transcript: string, isFinal: boolean) => void;
  private readonly onStateChange?: (state: VoiceSearchState) => void;
  private readonly onError?: (messageKey: string) => void;

  constructor({ locale, onResult, onStateChange, onError }: VoiceSearchHandlerOptions) {
    if (!isVoiceSearchSupported()) {
      throw new Error('Voice search not supported in this environment.');
    }

    const RecognitionClass =
      (window.SpeechRecognition ??
        window.webkitSpeechRecognition) as typeof SpeechRecognition;

    this.recognition = new RecognitionClass();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = locale.startsWith('ar') ? 'ar-IQ' : 'en-US';
    this.recognition.maxAlternatives = 1;

    this.onResult = onResult;
    this.onStateChange = onStateChange;
    this.onError = onError;

    this.bindEvents();
  }

  private bindEvents() {
    this.recognition.onstart = () => {
      this.setState('listening');
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';
      let hasFinalResult = false;

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? '';

        if (result.isFinal) {
          finalTranscript += transcript;
          hasFinalResult = true;
        } else {
          interimTranscript += transcript;
        }
      }

      const output = (finalTranscript || interimTranscript).trim();
      if (output) {
        this.onResult(output, hasFinalResult);
        if (hasFinalResult) {
          this.setState('processing');
        }
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const messageKey =
        STATE_ERROR_KEYS[event.error] ?? 'search.voice.error';

      if (event.error === 'not-allowed') {
        this.setState('not-supported');
      } else {
        this.setState('error');
      }

      this.onError?.(messageKey);
    };

    this.recognition.onend = () => {
      if (this.state !== 'idle' && this.state !== 'not-supported') {
        this.setState('idle');
      }
    };
  }

  start() {
    if (this.state === 'listening') {
      return;
    }

    try {
      this.setState('listening');
      this.recognition.start();
    } catch {
      this.setState('error');
      this.onError?.('search.voice.error');
    }
  }

  stop() {
    if (this.state !== 'listening') {
      return;
    }

    this.setState('processing');
    this.recognition.stop();
  }

  abort() {
    if (this.state === 'idle') {
      return;
    }

    this.recognition.abort();
    this.setState('idle');
  }

  destroy() {
    this.recognition.onstart = null;
    this.recognition.onresult = null;
    this.recognition.onerror = null;
    this.recognition.onend = null;

    try {
      this.recognition.abort();
    } catch {
      // no-op
    }

    this.setState('idle');
  }

  private setState(nextState: VoiceSearchState) {
    this.state = nextState;
    this.onStateChange?.(nextState);
  }
}
