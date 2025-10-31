'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import type { Locale, VoiceSearchState } from '@/types';
import {
  Button,
  Icon,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '@/components/ui';
import {
  VoiceSearchHandler,
  isVoiceSearchSupported,
} from '@/lib/search/voice-search';
import { cn } from '@/lib/utils';

export interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResult: (transcript: string) => void;
}

type TranslateFn = ReturnType<typeof useTranslations>;

export function VoiceSearchModal({ isOpen, onClose, onResult }: VoiceSearchModalProps) {
  const locale = useLocale() as Locale;
  const tVoice = useTranslations('search.voice');
  const handlerRef = useRef<VoiceSearchHandler | null>(null);
  const [state, setState] = useState<VoiceSearchState>('idle');
  const [transcript, setTranscript] = useState('');
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setState(isVoiceSearchSupported() ? 'idle' : 'not-supported');
    setTranscript('');
    setErrorKey(null);
  }, []);

  const translateError = useCallback(
    (key: string) => {
      const safeKey = key.replace('search.voice.', '') as Parameters<TranslateFn>[0];
      try {
        return tVoice(safeKey);
      } catch {
        return tVoice('error');
      }
    },
    [tVoice]
  );

  const instantiateHandler = useCallback(() => {
    if (!isVoiceSearchSupported()) {
      setState('not-supported');
      setErrorKey('search.voice.notSupported');
      return null;
    }

    const handler = new VoiceSearchHandler({
      locale,
      onResult: (value, isFinal) => {
        setTranscript(value);
        if (isFinal) {
          onResult(value);
          onClose();
        }
      },
      onStateChange: (nextState) => {
        setState(nextState);
      },
      onError: (messageKey) => {
        setErrorKey(messageKey);
      },
    });

    handlerRef.current = handler;
    return handler;
  }, [locale, onClose, onResult]);

  useEffect(() => {
    if (!isOpen) {
      handlerRef.current?.destroy();
      handlerRef.current = null;
      resetState();
      return;
    }

    setTranscript('');
    setErrorKey(null);

    const handler = instantiateHandler();
    if (!handler) {
      return undefined;
    }

    handler.start();

    return () => {
      handler.destroy();
      handlerRef.current = null;
    };
  }, [instantiateHandler, isOpen, resetState]);

  const handleStart = useCallback(() => {
    const handler = handlerRef.current ?? instantiateHandler();
    if (!handler) {
      return;
    }

    setTranscript('');
    setErrorKey(null);
    handler.start();
  }, [instantiateHandler]);

  const handleStop = useCallback(() => {
    handlerRef.current?.stop();
  }, []);

  const handleCancel = useCallback(() => {
    handlerRef.current?.abort();
    onClose();
  }, [onClose]);

  const statusMessage = useMemo(() => {
    if (state === 'not-supported') {
      return tVoice('notSupported');
    }
    if (state === 'listening') {
      return tVoice('listening');
    }
    if (state === 'processing') {
      return 'Processing...';
    }
    if (state === 'error' && errorKey) {
      return translateError(errorKey);
    }
    if (state === 'idle') {
      return tVoice('tapToSpeak');
    }
    return tVoice('speak');
  }, [state, tVoice, errorKey, translateError]);

  const micClassName = cn(
    'flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-aqua-500 to-aqua-600 text-white shadow-lg transition-transform motion-safe:duration-300',
    state === 'listening' && 'animate-mic-pulse',
    state === 'error' && 'bg-gradient-to-br from-coral-500 to-coral-600',
    state === 'processing' && 'opacity-80'
  );

  const isStartVisible = state === 'idle' || state === 'error';
  const isListening = state === 'listening';
  const isProcessing = state === 'processing';

  return (
    <Modal
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) {
          handleCancel();
        }
      }}
      title={tVoice('tapToSpeak')}
      size="sm"
      showCloseButton
    >
      <ModalHeader className="sr-only">{tVoice('tapToSpeak')}</ModalHeader>
      <ModalBody className="flex flex-col items-center justify-center gap-6 py-8">
        <div className={micClassName} role="presentation" aria-hidden="true">
          <Icon
            name="mic"
            size="xl"
            className={cn(
              'transition-transform motion-safe:duration-300',
              isListening && 'scale-105'
            )}
            aria-hidden
          />
        </div>

        <div className="text-center">
          <p
            className={cn(
              'text-lg font-semibold text-foreground',
              state === 'error' && 'text-coral-500'
            )}
          >
            {statusMessage}
            {state === 'listening' && <span className="listening-dots" aria-hidden />}
          </p>

          {transcript && (
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              {transcript}
            </p>
          )}

          {state === 'error' && errorKey && (
            <p className="mt-2 text-xs text-muted-foreground">
              {tVoice('tryAgain')}
            </p>
          )}
        </div>
      </ModalBody>
      <ModalFooter className="flex items-center justify-between gap-3">
        {isStartVisible && (
          <Button onClick={handleStart} variant="primary">
            <Icon name="mic" className="me-2" size="sm" />
            {tVoice('speak')}
          </Button>
        )}

        {isListening && (
          <Button onClick={handleStop} variant="destructive">
            {tVoice('stopListening')}
          </Button>
        )}

        {!isProcessing && (
          <Button onClick={handleCancel} variant="ghost">
            {tVoice('tryAgain')}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
