import type { ContentDataset } from './schema';
import { validateTone } from './rules';

type QaWarning = {
  key: string;
  message: string;
};

const LENGTH_RULES: Array<{ matcher: RegExp; max: number }> = [
  { matcher: /cta/i, max: 16 },
  { matcher: /subtitle/i, max: 100 },
  { matcher: /feedback|hit|miss|combo|timeout|message|line/i, max: 110 },
  { matcher: /title/i, max: 70 },
  { matcher: /tooltips/i, max: 55 }
];

const REQUIRED_KEYS = [
  'screens.attract.title',
  'screens.attract.ctaStart',
  'screens.intro.line1',
  'screens.intro.line2',
  'screens.avatar.title',
  'screens.toolkit.tooltips',
  'screens.repair.hit',
  'screens.repair.slotComplete',
  'screens.result.full.title',
  'screens.result.partial.title',
  'screens.result.timeout.title',
  'spectator.screenLabel',
  'spectator.progressByThreshold'
];

export function runContentQa(dataset: ContentDataset): string[] {
  const warnings: QaWarning[] = [];
  validateRequiredKeys(dataset, warnings);
  walkValue(dataset, [], warnings);

  const output = warnings.map((warning) => `[content-qa] ${warning.key}: ${warning.message}`);
  if (import.meta.env.DEV) {
    output.forEach((line) => console.warn(line));
  }
  return output;
}

function validateRequiredKeys(dataset: ContentDataset, warnings: QaWarning[]): void {
  for (const key of REQUIRED_KEYS) {
    const value = resolveByPath(dataset as unknown as Record<string, unknown>, key);
    if (value === undefined || value === null) {
      warnings.push({ key, message: 'Chave obrigatória ausente.' });
      continue;
    }
    if (typeof value === 'string' && value.trim().length === 0) {
      warnings.push({ key, message: 'String obrigatória vazia.' });
    }
    if (Array.isArray(value) && value.length === 0) {
      warnings.push({ key, message: 'Lista obrigatória vazia.' });
    }
  }
}

function walkValue(value: unknown, path: string[], warnings: QaWarning[]): void {
  if (typeof value === 'string') {
    validateString(value, path.join('.'), warnings);
    validatePlaceholders(value, path.join('.'), warnings);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => walkValue(entry, [...path, String(index)], warnings));
    return;
  }

  if (!value || typeof value !== 'object') {
    return;
  }

  Object.entries(value).forEach(([key, nested]) => {
    walkValue(nested, [...path, key], warnings);
  });
}

function validateString(text: string, key: string, warnings: QaWarning[]): void {
  const limit = resolveLengthLimit(key);
  if (limit !== null && text.length > limit) {
    warnings.push({
      key,
      message: `Comprimento ${text.length} acima do limite recomendado (${limit}).`
    });
  }

  for (const toneWarning of validateTone(text)) {
    warnings.push({ key, message: toneWarning.message });
  }
}

function validatePlaceholders(text: string, key: string, warnings: QaWarning[]): void {
  const matches = text.match(/\{[^}]+\}/g);
  if (!matches) {
    return;
  }

  for (const raw of matches) {
    const token = raw.slice(1, -1).trim();
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)) {
      warnings.push({
        key,
        message: `Placeholder inválido "${raw}". Use formato {nome}.`
      });
    }
  }
}

function resolveLengthLimit(key: string): number | null {
  for (const rule of LENGTH_RULES) {
    if (rule.matcher.test(key)) {
      return rule.max;
    }
  }
  return null;
}

function resolveByPath(root: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, root);
}
