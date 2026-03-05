const FORBIDDEN_TERMS = [
  'falhou',
  'perdeu',
  'fracassou',
  'bobinho',
  'amiguinho',
  'campeaozinho',
  'campeãozinho',
  'idiota',
  'burro'
];

export type ToneWarning = {
  type: 'forbidden-term' | 'very-long-line';
  message: string;
};

export function getForbiddenTerms(): string[] {
  return [...FORBIDDEN_TERMS];
}

export function validateTone(text: string): ToneWarning[] {
  const warnings: ToneWarning[] = [];
  const normalized = text.trim().toLowerCase();

  for (const term of FORBIDDEN_TERMS) {
    if (normalized.includes(term)) {
      warnings.push({
        type: 'forbidden-term',
        message: `Termo desaconselhado detectado: "${term}".`
      });
    }
  }

  if (text.length > 120) {
    warnings.push({
      type: 'very-long-line',
      message: `Linha extensa (${text.length} caracteres).`
    });
  }

  return warnings;
}
