import type { SymbolId } from './symbols.ts';

// Stable capability ids are grouped by component family. Existing ids must
// never be changed or reused because exported LiaScript courses persist them.
export const ELECTRO_COMPONENT_CAPABILITIES: Readonly<Record<SymbolId, number>> = Object.freeze({
  battery: 100,
  'voltage-source': 110,
  resistor: 200,
  'variable-resistor': 210,
  capacitor: 220,
  inductor: 230,
  'iron-core-inductor': 240,
  diode: 300,
  photodiode: 310,
  led: 320,
  switch: 400,
  'changeover-switch': 410,
  lamp: 500,
  motor: 510,
  voltmeter: 600,
  ammeter: 610,
  ground: 700,
  antenna: 710,
  transistor: 800,
  transformer: 900,
});

export const ELECTRO_KNOWN_COMPONENT_IDS: readonly number[] = Object.freeze(
  Array.from(new Set(Object.values(ELECTRO_COMPONENT_CAPABILITIES))).sort((left, right) => left - right),
);

export const ELECTRO_RESTRICTIONS = Object.freeze({
  componentPropertiesLocked: 100,
  macroComponentPropertiesLocked: 110,
  baselineLocked: 120,
  measurementControlsLocked: 300,
  exportLocked: 400,
} as const);

export type ElectroRestrictionId =
  typeof ELECTRO_RESTRICTIONS[keyof typeof ELECTRO_RESTRICTIONS];

export const ELECTRO_KNOWN_RESTRICTION_IDS: readonly ElectroRestrictionId[] = Object.freeze([
  ELECTRO_RESTRICTIONS.componentPropertiesLocked,
  ELECTRO_RESTRICTIONS.macroComponentPropertiesLocked,
  ELECTRO_RESTRICTIONS.baselineLocked,
  ELECTRO_RESTRICTIONS.measurementControlsLocked,
  ELECTRO_RESTRICTIONS.exportLocked,
]);

export interface ElectroExportProfile {
  componentIds: ReadonlySet<number>;
  restrictionIds: ReadonlySet<number>;
  /** undefined inherits the current task, null explicitly exports no task. */
  completionQuizSpec?: string | null;
}

export interface ElectroConfig {
  boardId: string;
  snapStep: number;
  wireStub: number;
  /** null means the unrestricted legacy palette. */
  componentIds: ReadonlySet<number> | null;
  restrictionIds: ReadonlySet<number>;
}

export function parseElectroSpec(spec: string): ElectroConfig {
  const tokens = splitElectroSpec(spec);
  const named = new Map<string, string>();
  let positionalBoardId = '';
  tokens.forEach((token) => {
    const separator = token.indexOf('=');
    if (separator > 0) {
      named.set(token.slice(0, separator).trim().toLowerCase(), token.slice(separator + 1).trim());
    } else if (!positionalBoardId && !/^[01]$/.test(token)) {
      positionalBoardId = unquote(token);
    }
  });

  const rawComponents = named.has('components') ? named.get('components') || '' : null;
  const componentValues = parseNumericIdList(rawComponents);
  const componentIds = rawComponents == null || componentValues == null || componentValues.length === 0
    ? null
    : new Set(canonicalElectroIds(componentValues));
  const restrictionIds = new Set(canonicalElectroRestrictionIds(
    parseNumericIdList(named.has('restrictions') ? named.get('restrictions') || '' : null) || [],
  ));

  return {
    boardId: unquote(named.get('id') || named.get('board') || positionalBoardId),
    snapStep: positiveNumber(named.get('snap') || named.get('raster'), 0.5),
    wireStub: positiveNumber(named.get('stub'), 0.35),
    componentIds,
    restrictionIds,
  };
}

export function isComponentAllowed(config: ElectroConfig, kind: SymbolId): boolean {
  return config.componentIds == null || config.componentIds.has(ELECTRO_COMPONENT_CAPABILITIES[kind]);
}

export function hasElectroRestriction(config: ElectroConfig, id: number): boolean {
  return config.restrictionIds.has(id);
}

export function canonicalElectroIds(ids: Iterable<number>): number[] {
  return Array.from(new Set(Array.from(ids)
    .map((value) => Number(value))
    .filter((value) => Number.isSafeInteger(value) && value > 0)))
    .sort((left, right) => left - right);
}

export function canonicalElectroRestrictionIds(ids: Iterable<number>): number[] {
  const values = new Set(canonicalElectroIds(ids));
  if (values.has(ELECTRO_RESTRICTIONS.componentPropertiesLocked)) {
    values.delete(ELECTRO_RESTRICTIONS.macroComponentPropertiesLocked);
  }
  return Array.from(values).sort((left, right) => left - right);
}

export function formatElectroIdSelection(ids: Iterable<number>): string {
  const values = canonicalElectroIds(ids);
  return `[${values.length ? values.join(';') : '0'}]`;
}

export function splitElectroSpec(spec: string): string[] {
  const result: string[] = [];
  let token = '';
  let bracketDepth = 0;
  let quote = '';
  const source = String(spec || '').trim();
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      token += character;
      if (character === quote && source[index - 1] !== '\\') quote = '';
      continue;
    }
    if (character === '"' || character === "'" || character === String.fromCharCode(96)) {
      quote = character;
      token += character;
      continue;
    }
    if (character === '[') bracketDepth += 1;
    if (character === ']' && bracketDepth > 0) bracketDepth -= 1;
    if (character === ';' && bracketDepth === 0) {
      if (token.trim()) result.push(token.trim());
      token = '';
      continue;
    }
    token += character;
  }
  if (token.trim()) result.push(token.trim());
  return result;
}

export function resolveLanguage(value?: string): 'de' | 'en' {
  return /^de(?:-|$)/i.test(String(value || '')) ? 'de' : 'en';
}

function parseNumericIdList(raw: string | null): number[] | null {
  if (raw == null) return null;
  const match = unquote(raw).match(/^\s*\[([\s\S]*)\]\s*$/);
  if (!match) return null;
  const source = String(match[1] || '').trim();
  if (!source) return [];
  const tokens = source.split(/[;,\s]+/).map((token) => token.trim()).filter(Boolean);
  if (!tokens.length || tokens.some((token) => !/^\d+$/.test(token))) return null;
  const values = tokens.map((token) => Number(token));
  return values.every((value) => Number.isSafeInteger(value) && value >= 0) ? values : null;
}

function unquote(value: string): string {
  const text = String(value || '').trim();
  if (text.length < 2) return text;
  const first = text[0];
  const last = text[text.length - 1];
  return first === last && (first === '"' || first === "'" || first === String.fromCharCode(96))
    ? text.slice(1, -1).trim()
    : text;
}

function positiveNumber(value: unknown, fallback: number): number {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 10 ? parsed : fallback;
}
