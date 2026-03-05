import { PT_BR_CONTENT } from './locale/pt-BR';
import { runContentQa } from './qa';
import type { ContentDataset, CopyParams, VariantPack, VariantSelection, VariantTier } from './schema';

export type RngFn = () => number;

const dataset: ContentDataset = PT_BR_CONTENT;
const qaWarnings = runContentQa(dataset);

if (import.meta.env.DEV && qaWarnings.length === 0) {
  console.info('[content-qa] OK');
}

export function getContentDataset(): ContentDataset {
  return dataset;
}

export function get<TValue = unknown>(path: string): TValue {
  const value = resolvePath(path);
  if (value === undefined) {
    throw new Error(`copy.get: caminho não encontrado "${path}".`);
  }
  return value as TValue;
}

export function getVariant(path: string, rng: RngFn = Math.random): VariantSelection {
  const value = resolvePath(path);
  if (!isVariantPack(value)) {
    throw new Error(`copy.getVariant: caminho não aponta para VariantPack "${path}".`);
  }

  const selection = pickVariant(value, rng);
  return selection;
}

export function pickVariant(pack: VariantPack, rng: RngFn = Math.random): VariantSelection {
  const tier = chooseTier(pack, rng);
  const list = getTierList(pack, tier);
  return {
    text: chooseFrom(list, rng),
    tier
  };
}

export function format(text: string, params: CopyParams = {}): string {
  return text.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (_, token: string) => {
    const value = params[token];
    return value === undefined ? `{${token}}` : String(value);
  });
}

export function createSeededRng(seedInput: string | number): RngFn {
  let seed = normalizeSeed(seedInput);
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
}

function chooseTier(pack: VariantPack, rng: RngFn): VariantTier {
  const roll = rng();

  if (pack.legendary && pack.legendary.length > 0 && roll < 0.03) {
    return 'legendary';
  }
  if (pack.rare && pack.rare.length > 0 && roll < 0.2) {
    return 'rare';
  }
  return 'common';
}

function getTierList(pack: VariantPack, tier: VariantTier): string[] {
  if (tier === 'legendary') {
    return pack.legendary && pack.legendary.length > 0 ? pack.legendary : pack.common;
  }
  if (tier === 'rare') {
    return pack.rare && pack.rare.length > 0 ? pack.rare : pack.common;
  }
  return pack.common;
}

function chooseFrom(list: string[], rng: RngFn): string {
  if (list.length === 0) {
    return '';
  }
  const index = Math.min(list.length - 1, Math.floor(rng() * list.length));
  return list[index] ?? list[0] ?? '';
}

function resolvePath(path: string): unknown {
  const parts = path.split('.');
  let pointer: unknown = dataset;

  for (const part of parts) {
    if (!pointer || typeof pointer !== 'object' || !(part in (pointer as Record<string, unknown>))) {
      return undefined;
    }
    pointer = (pointer as Record<string, unknown>)[part];
  }

  return pointer;
}

function isVariantPack(value: unknown): value is VariantPack {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<VariantPack>;
  return Array.isArray(candidate.common);
}

function normalizeSeed(seedInput: string | number): number {
  if (typeof seedInput === 'number' && Number.isFinite(seedInput)) {
    return seedInput >>> 0;
  }

  const source = String(seedInput);
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
