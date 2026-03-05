export interface VoiceCatalogSnapshot {
  all: SpeechSynthesisVoice[];
  preferred: SpeechSynthesisVoice[];
}

export function getVoicesSafe(): VoiceCatalogSnapshot {
  if (!isSpeechSynthesisAvailable()) {
    return { all: [], preferred: [] };
  }

  const all = window.speechSynthesis.getVoices();
  return {
    all,
    preferred: prioritizePortugueseVoices(all)
  };
}

export function watchVoicesChanged(listener: (snapshot: VoiceCatalogSnapshot) => void): () => void {
  if (!isSpeechSynthesisAvailable()) {
    return () => {};
  }

  const synth = window.speechSynthesis;
  const emit = () => {
    listener(getVoicesSafe());
  };

  emit();
  synth.addEventListener('voiceschanged', emit);

  return () => {
    synth.removeEventListener('voiceschanged', emit);
  };
}

export function pickVoiceByUri(voices: SpeechSynthesisVoice[], voiceURI: string | null): SpeechSynthesisVoice | null {
  if (!voiceURI) {
    return null;
  }
  const found = voices.find((voice) => voice.voiceURI === voiceURI);
  return found ?? null;
}

export function pickPreferredVoice(voices: SpeechSynthesisVoice[], preferredUri: string | null): SpeechSynthesisVoice | null {
  const byUri = pickVoiceByUri(voices, preferredUri);
  if (byUri) {
    return byUri;
  }

  const prioritized = prioritizePortugueseVoices(voices);
  if (prioritized.length > 0) {
    return prioritized[0] ?? null;
  }

  return voices[0] ?? null;
}

function prioritizePortugueseVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const ptBr = voices.filter((voice) => normalizeLang(voice.lang) === 'pt-br');
  const ptGeneric = voices.filter((voice) => normalizeLang(voice.lang).startsWith('pt') && !ptBr.includes(voice));
  const others = voices.filter((voice) => !ptBr.includes(voice) && !ptGeneric.includes(voice));
  return [...ptBr, ...ptGeneric, ...others];
}

function normalizeLang(lang: string): string {
  return (lang ?? '').trim().toLowerCase();
}

function isSpeechSynthesisAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}
