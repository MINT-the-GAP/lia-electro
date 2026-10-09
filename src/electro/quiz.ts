import { splitElectroSpec } from './config.ts';
import type { CircuitDocument, ComponentModel } from './model.ts';
import {
  analyzeDcCircuit,
  parseCurrentValue,
  parseResistanceValue,
  parseVoltageValue,
  type DcAnalysis,
  type DcAnalysisStatus,
  type DcCircuitResult,
} from './physics.ts';
import { isSymbolId, SYMBOL_BY_ID, type SymbolId } from './symbols.ts';

export type CompletionCondition =
  | 'closed'
  | 'ammeter-current'
  | 'voltmeter-voltage'
  | 'total-current'
  | 'equivalent-resistance';

export interface CompletionRule {
  boardId: string;
  condition: CompletionCondition;
  componentId?: string;
  target?: number;
  tolerance: number;
  magnitude: boolean;
  requiredAdded: ReadonlyMap<SymbolId, number>;
  preserveBaseline: boolean;
  requireChange: boolean;
}

export type CompletionCode =
  | 'success'
  | 'unchanged'
  | 'baseline-component-missing'
  | 'baseline-component-changed'
  | 'required-count'
  | 'unexpected-added-component'
  | 'required-component-disconnected'
  | 'required-component-bypassed'
  | 'target-component-missing'
  | 'target-component-kind'
  | 'target-component-disconnected'
  | 'unsupported-component'
  | 'no-source'
  | 'multiple-sources'
  | 'circuit-open'
  | 'short-circuit'
  | 'incomplete-circuit'
  | 'invalid-circuit'
  | 'target-mismatch';

export type CompletionQuantity = 'current' | 'voltage' | 'resistance';

export interface CompletionResult {
  ok: boolean;
  code: CompletionCode;
  message: string;
  boardId: string;
  condition?: CompletionCondition;
  componentId?: string;
  componentKind?: SymbolId;
  expectedCount?: number;
  actualCount?: number;
  actual?: number;
  expected?: number;
  tolerance?: number;
  quantity?: CompletionQuantity;
}

export class CompletionRuleError extends Error {
  constructor(message: string) {
    super(`Electro completion quiz: ${message}`);
    this.name = 'CompletionRuleError';
  }
}

const ID_PATTERN = /^[A-Za-z0-9_-]{1,80}$/;
const SOURCE_KINDS = new Set<SymbolId>(['battery', 'voltage-source']);
const QUIZ_SUPPORTED_KINDS = new Set<SymbolId>([
  'battery', 'voltage-source', 'resistor', 'variable-resistor',
  'ammeter', 'voltmeter', 'ground',
]);
const ACTIVE_CURRENT_EPSILON = 1e-10;

export function parseCompletionRule(spec: string): CompletionRule {
  const named = new Map<string, string>();
  let positionalBoardId = '';
  splitElectroSpec(spec).forEach((token) => {
    const separator = token.indexOf('=');
    if (separator > 0) {
      named.set(token.slice(0, separator).trim().toLowerCase(), token.slice(separator + 1).trim());
    } else if (!positionalBoardId) {
      positionalBoardId = unquote(token);
    }
  });

  const boardId = unquote(named.get('board') || named.get('id') || positionalBoardId);
  if (!ID_PATTERN.test(boardId)) fail('board id is missing or invalid');
  const condition = parseCondition(named.get('condition') || named.get('quantity') || 'closed');
  const componentId = unquote(named.get('component') || named.get('meter') || '');
  const needsComponent = condition === 'ammeter-current' || condition === 'voltmeter-voltage';
  if (needsComponent && !ID_PATTERN.test(componentId)) {
    fail(`${condition} needs component=<id>`);
  }

  const quantity = quantityForCondition(condition);
  const rawTarget = named.get('target');
  const target = quantity ? parseQuantity(rawTarget, quantity) : undefined;
  if (quantity && target == null) fail(`${condition} needs a valid target value`);
  const rawTolerance = named.get('tolerance');
  const parsedTolerance = quantity && rawTolerance != null
    ? parseTolerance(rawTolerance, quantity)
    : undefined;
  if (parsedTolerance != null && parsedTolerance < 0) fail('tolerance must not be negative');
  if (quantity && rawTolerance != null && parsedTolerance == null) {
    fail('tolerance has an invalid value or unit');
  }
  const tolerance = quantity
    ? parsedTolerance ?? Math.max(Math.abs(target || 0) * 0.01, 1e-12)
    : 0;
  const mode = unquote(named.get('mode') || 'absolute').toLowerCase();
  if (mode !== 'absolute' && mode !== 'signed') fail('mode must be absolute or signed');

  return {
    boardId,
    condition,
    ...(componentId ? { componentId } : {}),
    ...(target != null ? { target } : {}),
    tolerance,
    magnitude: mode !== 'signed',
    requiredAdded: parseRequiredAdded(named.get('required') || named.get('added') || ''),
    preserveBaseline: parseFlag(named.get('preserve'), true, 'preserve'),
    requireChange: parseFlag(named.get('changed') || named.get('change'), true, 'changed'),
  };
}

export function formatCompletionRule(rule: CompletionRule, boardId = rule.boardId): string {
  const parts = [
    validId(boardId, 'board id'),
    `condition=${rule.condition}`,
  ];
  if (rule.componentId) parts.push(`component=${validId(rule.componentId, 'component id')}`);
  if (rule.target != null) parts.push(`target=${formatNumber(rule.target)}`);
  if (rule.target != null) parts.push(`tolerance=${formatNumber(Math.max(0, rule.tolerance))}`);
  if (!rule.magnitude) parts.push('mode=signed');
  if (rule.requiredAdded.size > 0) {
    const required = [...rule.requiredAdded]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([kind, count]) => `${kind}:${count}`)
      .join(';');
    parts.push(`required=[${required}]`);
  }
  parts.push(`preserve=${rule.preserveBaseline ? 1 : 0}`);
  parts.push(`changed=${rule.requireChange ? 1 : 0}`);
  return parts.join(';');
}

export function rewriteCompletionBoardId(spec: string, boardId: string): string {
  return formatCompletionRule(parseCompletionRule(spec), boardId);
}

export function evaluateCircuitCompletion(
  document: CircuitDocument,
  baseline: CircuitDocument,
  rule: CompletionRule,
  analysis: DcAnalysis = analyzeDcCircuit(document),
  language: 'de' | 'en' = 'de',
): CompletionResult {
  const result = evaluate(document, baseline, rule, analysis);
  return { ...result, message: formatCompletionMessage(result, language) };
}

export function formatCompletionMessage(
  result: Omit<CompletionResult, 'message'> | CompletionResult,
  language: 'de' | 'en',
): string {
  const de = language === 'de';
  const component = result.componentId || (de ? 'das Bauteil' : 'the component');
  switch (result.code) {
    case 'success': {
      if (result.actual == null || !result.quantity) {
        return de ? 'Bedingung erf\u00fcllt: Der Stromkreis ist geschlossen.' : 'Condition met: the circuit is closed.';
      }
      const subject = completionSubject(result, language, component);
      return de
        ? `Bedingung erf\u00fcllt: ${subject} betr\u00e4gt ${formatQuantity(result.actual, result.quantity, language)}.`
        : `Condition met: ${subject} is ${formatQuantity(result.actual, result.quantity, language)}.`;
    }
    case 'unchanged': return de
      ? 'Erg\u00e4nze oder verkable die vorgegebene Schaltung, bevor du pr\u00fcfst.'
      : 'Complete or wire the preset circuit before checking it.';
    case 'baseline-component-missing': return de
      ? `Das vorgegebene Bauteil ${component} fehlt.`
      : `Preset component ${component} is missing.`;
    case 'baseline-component-changed': return de
      ? `Das vorgegebene Bauteil ${component} wurde elektrisch ver\u00e4ndert.`
      : `Preset component ${component} was changed electrically.`;
    case 'required-count': return de
      ? `Erg\u00e4nze genau ${result.expectedCount} Bauteil(e) vom Typ ${result.componentKind}; aktuell sind es ${result.actualCount}.`
      : `Add exactly ${result.expectedCount} component(s) of type ${result.componentKind}; currently there are ${result.actualCount}.`;
    case 'unexpected-added-component': return de
      ? `Das zus\u00e4tzlich eingebaute Bauteil ${component} ist f\u00fcr diese Aufgabe nicht erlaubt.`
      : `Added component ${component} is not allowed in this task.`;
    case 'required-component-disconnected': return de
      ? `Das erg\u00e4nzte Bauteil ${component} geh\u00f6rt noch nicht zum gespeisten Stromkreis.`
      : `Added component ${component} is not part of the powered circuit.`;
    case 'required-component-bypassed': return de
      ? `Das erg\u00e4nzte Bauteil ${component} wird \u00fcberbr\u00fcckt oder f\u00fchrt keinen Strom.`
      : `Added component ${component} is bypassed or carries no current.`;
    case 'target-component-missing': return de
      ? `Das Zielmessger\u00e4t ${component} fehlt.`
      : `Target meter ${component} is missing.`;
    case 'target-component-kind': return de
      ? `${component} ist nicht das f\u00fcr diese Bedingung ben\u00f6tigte Messger\u00e4t.`
      : `${component} is not the meter required by this condition.`;
    case 'target-component-disconnected': return de
      ? `Das Zielmessger\u00e4t ${component} geh\u00f6rt zu keinem gespeisten Stromkreis.`
      : `Target meter ${component} is not part of a powered circuit.`;
    case 'unsupported-component': return de
      ? `${component} wird in Erg\u00e4nzungsquizzen f\u00fcr Gleichstrom noch nicht unterst\u00fctzt.`
      : `${component} is not yet supported in DC completion quizzes.`;
    case 'no-source': return de ? 'Es fehlt eine Gleichspannungsquelle.' : 'A DC voltage source is missing.';
    case 'multiple-sources': return de
      ? 'Das Erg\u00e4nzungsquiz unterst\u00fctzt genau eine Gleichspannungsquelle.'
      : 'The completion quiz supports exactly one DC voltage source.';
    case 'circuit-open': return de
      ? 'Der Stromkreis ist noch offen: Es fehlt ein leitender R\u00fcckweg.'
      : 'The circuit is still open: a conductive return path is missing.';
    case 'short-circuit': return de
      ? 'Die Spannungsquelle ist kurzgeschlossen.'
      : 'The voltage source is short-circuited.';
    case 'incomplete-circuit': return de
      ? 'Mindestens ein elektrischer Wert fehlt oder ist ung\u00fcltig.'
      : 'At least one electrical value is missing or invalid.';
    case 'invalid-circuit': return de
      ? 'Die Schaltung ist nicht eindeutig l\u00f6sbar oder enth\u00e4lt ein nicht unterst\u00fctztes Netz.'
      : 'The circuit is ambiguous or contains an unsupported network.';
    case 'target-mismatch': {
      const actual = formatQuantity(result.actual || 0, result.quantity || 'current', language);
      const expected = formatQuantity(result.expected || 0, result.quantity || 'current', language);
      const tolerance = formatQuantity(result.tolerance || 0, result.quantity || 'current', language);
      const subject = completionSubject(result, language, component);
      return de
        ? `${subject} betr\u00e4gt ${actual}; gefordert sind ${expected} \u00b1 ${tolerance}.`
        : `${subject} is ${actual}; required are ${expected} \u00b1 ${tolerance}.`;
    }
  }
  return de ? 'Die Bedingung konnte nicht gepr\u00fcft werden.' : 'The condition could not be checked.';
}

type BareCompletionResult = Omit<CompletionResult, 'message'>;

function evaluate(
  document: CircuitDocument,
  baseline: CircuitDocument,
  rule: CompletionRule,
  analysis: DcAnalysis,
): BareCompletionResult {
  const result = (code: CompletionCode, details: Partial<BareCompletionResult> = {}): BareCompletionResult => ({
    ok: code === 'success',
    code,
    boardId: rule.boardId,
    condition: rule.condition,
    ...details,
  });
  const baselineById = new Map(baseline.components.map((component) => [component.id, component]));
  const documentById = new Map(document.components.map((component) => [component.id, component]));

  if (rule.preserveBaseline) {
    for (const preset of baseline.components) {
      const current = documentById.get(preset.id);
      if (!current) return result('baseline-component-missing', { componentId: preset.id, componentKind: preset.kind });
      if (!sameElectricalComponent(preset, current)) {
        return result('baseline-component-changed', { componentId: preset.id, componentKind: preset.kind });
      }
    }
    if (!containsBaselineWiring(document, baseline)) return result('baseline-component-changed');
  }

  if (rule.requireChange && sameElectricalDocument(document, baseline)) return result('unchanged');

  const unsupported = document.components.find((component) => !QUIZ_SUPPORTED_KINDS.has(component.kind));
  if (unsupported) {
    return result('unsupported-component', { componentId: unsupported.id, componentKind: unsupported.kind });
  }

  const added = document.components.filter((component) => !baselineById.has(component.id));
  if (rule.requiredAdded.size > 0) {
    const addedCounts = new Map<SymbolId, number>();
    added.forEach((component) => addedCounts.set(component.kind, (addedCounts.get(component.kind) || 0) + 1));
    for (const component of added) {
      if (!rule.requiredAdded.has(component.kind)) {
        return result('unexpected-added-component', {
          componentId: component.id,
          componentKind: component.kind,
        });
      }
    }
    for (const [kind, expectedCount] of rule.requiredAdded) {
      const actualCount = addedCounts.get(kind) || 0;
      if (actualCount !== expectedCount) {
        return result('required-count', { componentKind: kind, expectedCount, actualCount });
      }
    }
  }

  let targetComponent: ComponentModel | undefined;
  if (rule.componentId) {
    targetComponent = documentById.get(rule.componentId);
    if (!targetComponent) return result('target-component-missing', { componentId: rule.componentId });
    const expectedKind = rule.condition === 'ammeter-current'
      ? 'ammeter'
      : rule.condition === 'voltmeter-voltage'
        ? 'voltmeter'
        : null;
    if (expectedKind && targetComponent.kind !== expectedKind) {
      return result('target-component-kind', {
        componentId: targetComponent.id,
        componentKind: targetComponent.kind,
      });
    }
  }

  const sources = document.components.filter((component) => SOURCE_KINDS.has(component.kind));
  if (sources.length === 0) return result('no-source');
  if (sources.length > 1) return result('multiple-sources');
  const source = sources[0];
  const circuit = analysis.circuits.find((entry) => entry.componentIds.includes(source.id));
  if (!circuit) return result(statusCode(analysis.status));
  if (targetComponent && !circuit.componentIds.includes(targetComponent.id)) {
    return result('target-component-disconnected', {
      componentId: targetComponent.id,
      componentKind: targetComponent.kind,
    });
  }
  if (circuit.status !== 'solved') return result(statusCode(circuit.status));

  const wireNodes = buildWireNodes(document);
  for (const component of added) {
    if (!rule.requiredAdded.has(component.kind)) continue;
    if (!circuit.componentIds.includes(component.id)) {
      return result('required-component-disconnected', {
        componentId: component.id,
        componentKind: component.kind,
      });
    }
    const terminals = terminalIds(component);
    if (terminals.length > 1) {
      const first = wireNodes.find(portKey(component.id, terminals[0]));
      if (terminals.slice(1).some((portId) => wireNodes.find(portKey(component.id, portId)) === first)) {
        return result('required-component-bypassed', {
          componentId: component.id,
          componentKind: component.kind,
        });
      }
    }
    const componentResult = analysis.components.find((entry) => entry.componentId === component.id);
    if ((component.kind === 'resistor' || component.kind === 'variable-resistor' || component.kind === 'ammeter')
      && componentResult?.currentA != null
      && Math.abs(componentResult.currentA) <= ACTIVE_CURRENT_EPSILON) {
      return result('required-component-bypassed', {
        componentId: component.id,
        componentKind: component.kind,
      });
    }
  }

  const quantity = quantityForCondition(rule.condition);
  if (!quantity) return result('success');
  const target = rule.target!;
  const measured = measuredQuantity(rule, circuit, analysis);
  if (measured == null || !Number.isFinite(measured)) return result('invalid-circuit');
  const actual = rule.magnitude ? Math.abs(measured) : measured;
  const expected = rule.magnitude ? Math.abs(target) : target;
  const slack = Math.max(1, Math.abs(actual), Math.abs(expected), rule.tolerance) * Number.EPSILON * 16;
  const details = {
    componentId: rule.componentId || source.id,
    actual,
    expected,
    tolerance: rule.tolerance,
    quantity,
  };
  return Math.abs(actual - expected) <= rule.tolerance + slack
    ? result('success', details)
    : result('target-mismatch', details);
}

function measuredQuantity(
  rule: CompletionRule,
  circuit: DcCircuitResult,
  analysis: DcAnalysis,
): number | undefined {
  if (rule.condition === 'total-current') return circuit.currentA;
  if (rule.condition === 'equivalent-resistance') return circuit.equivalentResistanceOhm;
  const component = analysis.components.find((entry) => entry.componentId === rule.componentId);
  if (rule.condition === 'ammeter-current') return component?.currentA;
  if (rule.condition === 'voltmeter-voltage') return component?.voltageV;
  return undefined;
}

function statusCode(status: DcAnalysisStatus | DcCircuitResult['status']): CompletionCode {
  switch (status) {
    case 'empty':
    case 'no-source': return 'no-source';
    case 'open': return 'circuit-open';
    case 'short-circuit': return 'short-circuit';
    case 'incomplete': return 'incomplete-circuit';
    case 'unsupported': return 'unsupported-component';
    case 'invalid': return 'invalid-circuit';
    case 'solved': return 'success';
  }
}

function sameElectricalComponent(left: ComponentModel, right: ComponentModel): boolean {
  if (left.kind !== right.kind) return false;
  if (SOURCE_KINDS.has(left.kind)) return sameParsedValue(left.value, right.value, parseVoltageValue);
  if (left.kind === 'resistor' || left.kind === 'variable-resistor') {
    return sameParsedValue(left.value, right.value, parseResistanceValue);
  }
  return true;
}

function sameParsedValue(
  left: unknown,
  right: unknown,
  parser: (value: unknown) => number | null,
): boolean {
  const leftParsed = parser(left);
  const rightParsed = parser(right);
  if (leftParsed == null || rightParsed == null) return String(left || '').trim() === String(right || '').trim();
  return Math.abs(leftParsed - rightParsed) <= Math.max(1, Math.abs(leftParsed), Math.abs(rightParsed)) * 1e-12;
}

function sameElectricalDocument(document: CircuitDocument, baseline: CircuitDocument): boolean {
  if (document.components.length !== baseline.components.length || document.wires.length !== baseline.wires.length) {
    return false;
  }
  const currentById = new Map(document.components.map((component) => [component.id, component]));
  if (baseline.components.some((component) => {
    const current = currentById.get(component.id);
    return !current || !sameElectricalComponent(component, current);
  })) return false;
  return sameSignatureCounts(document.wires.map(wireSignature), baseline.wires.map(wireSignature));
}

function containsBaselineWiring(document: CircuitDocument, baseline: CircuitDocument): boolean {
  const current = countSignatures(document.wires.map(wireSignature));
  const required = countSignatures(baseline.wires.map(wireSignature));
  return [...required].every(([signature, count]) => (current.get(signature) || 0) >= count);
}

function wireSignature(wire: CircuitDocument['wires'][number]): string {
  return [portKey(wire.from.componentId, wire.from.portId), portKey(wire.to.componentId, wire.to.portId)]
    .sort()
    .join('|');
}

function countSignatures(signatures: readonly string[]): Map<string, number> {
  const result = new Map<string, number>();
  signatures.forEach((signature) => result.set(signature, (result.get(signature) || 0) + 1));
  return result;
}

function sameSignatureCounts(left: readonly string[], right: readonly string[]): boolean {
  const leftCounts = countSignatures(left);
  const rightCounts = countSignatures(right);
  return leftCounts.size === rightCounts.size
    && [...leftCounts].every(([signature, count]) => rightCounts.get(signature) === count);
}

function terminalIds(component: ComponentModel): string[] {
  return SYMBOL_BY_ID[component.kind].terminals.map((terminal) => terminal.id);
}

function buildWireNodes(document: CircuitDocument): WireUnionFind {
  const keys = document.components.flatMap((component) => terminalIds(component)
    .map((portId) => portKey(component.id, portId)));
  const nodes = new WireUnionFind(keys);
  document.wires.forEach((wire) => nodes.union(
    portKey(wire.from.componentId, wire.from.portId),
    portKey(wire.to.componentId, wire.to.portId),
  ));
  return nodes;
}

class WireUnionFind {
  private readonly parent = new Map<string, string>();

  constructor(keys: Iterable<string>) {
    for (const key of keys) this.parent.set(key, key);
  }

  find(key: string): string {
    if (!this.parent.has(key)) this.parent.set(key, key);
    const parent = this.parent.get(key)!;
    if (parent === key) return key;
    const root = this.find(parent);
    this.parent.set(key, root);
    return root;
  }

  union(left: string, right: string): void {
    const leftRoot = this.find(left);
    const rightRoot = this.find(right);
    if (leftRoot !== rightRoot) this.parent.set(rightRoot, leftRoot);
  }
}

function portKey(componentId: string, portId: string): string {
  return `${componentId}:${portId}`;
}

function parseCondition(value: string): CompletionCondition {
  const normalized = unquote(value).trim().toLowerCase().replace(/_/g, '-');
  const aliases: Readonly<Record<string, CompletionCondition>> = {
    closed: 'closed', geschlossen: 'closed', 'circuit-closed': 'closed',
    current: 'ammeter-current', ammeter: 'ammeter-current', 'ammeter-current': 'ammeter-current',
    strom: 'ammeter-current', stromstaerke: 'ammeter-current', 'stromst\u00e4rke': 'ammeter-current',
    voltage: 'voltmeter-voltage', voltmeter: 'voltmeter-voltage', 'voltmeter-voltage': 'voltmeter-voltage',
    spannung: 'voltmeter-voltage',
    'total-current': 'total-current', 'source-current': 'total-current', gesamtstrom: 'total-current',
    resistance: 'equivalent-resistance', 'equivalent-resistance': 'equivalent-resistance',
    gesamtwiderstand: 'equivalent-resistance', ersatzwiderstand: 'equivalent-resistance',
  };
  const condition = aliases[normalized];
  if (!condition) fail(`unknown condition ${value}`);
  return condition;
}

function quantityForCondition(condition: CompletionCondition): CompletionQuantity | null {
  if (condition === 'ammeter-current' || condition === 'total-current') return 'current';
  if (condition === 'voltmeter-voltage') return 'voltage';
  if (condition === 'equivalent-resistance') return 'resistance';
  return null;
}

function parseQuantity(value: string | undefined, quantity: CompletionQuantity): number | undefined {
  if (value == null || !String(value).trim()) return undefined;
  const raw = unquote(value);
  const parsed = quantity === 'current'
    ? parseCurrentValue(raw)
    : quantity === 'voltage'
      ? parseVoltageValue(raw)
      : parseResistanceValue(raw);
  return parsed == null ? undefined : parsed;
}

function parseTolerance(value: string | undefined, quantity: CompletionQuantity): number | undefined {
  if (value == null || !String(value).trim()) return undefined;
  const parsed = parseQuantity(value, quantity);
  if (parsed != null) return parsed;
  return /^\s*[+]?0+(?:[.,]0+)?\s*(?:A|V|(?:ohm)|\u03a9)?\s*$/iu.test(unquote(value)) ? 0 : undefined;
}

function parseRequiredAdded(value: string): ReadonlyMap<SymbolId, number> {
  const raw = unquote(value).trim();
  if (!raw || raw === '[]' || raw === '[0]' || raw === '0') return new Map();
  const match = raw.match(/^\[([\s\S]*)\]$/);
  if (!match) fail('required must use [component:count;...]');
  const tokens = match[1].split(/[;,]+/).map((token) => token.trim()).filter(Boolean);
  const result = new Map<SymbolId, number>();
  for (const token of tokens) {
    const entry = token.match(/^([a-z][a-z0-9-]*)\s*:\s*(\d+)$/i);
    if (!entry || !isSymbolId(entry[1]) || !QUIZ_SUPPORTED_KINDS.has(entry[1])) {
      fail(`invalid required component ${token}`);
    }
    const count = Number(entry[2]);
    if (!Number.isSafeInteger(count) || count <= 0) fail(`invalid required count ${token}`);
    result.set(entry[1], (result.get(entry[1]) || 0) + count);
  }
  return result;
}

function parseFlag(value: string | undefined, fallback: boolean, name: string): boolean {
  if (value == null || !String(value).trim()) return fallback;
  const normalized = unquote(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on', 'ja'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off', 'nein'].includes(normalized)) return false;
  fail(`${name} must be 0 or 1`);
}

function validId(value: string, name: string): string {
  if (!ID_PATTERN.test(value)) fail(`${name} is invalid`);
  return value;
}

function unquote(value: string | undefined): string {
  const text = String(value || '').trim();
  if (text.length < 2) return text;
  const first = text[0];
  const last = text[text.length - 1];
  return first === last && (first === String.fromCharCode(34) || first === String.fromCharCode(39) || first === String.fromCharCode(96))
    ? text.slice(1, -1).trim()
    : text;
}

function formatNumber(value: number): string {
  return String(Number(value.toPrecision(12)));
}

function completionSubject(
  result: Omit<CompletionResult, 'message'> | CompletionResult,
  language: 'de' | 'en',
  component: string,
): string {
  const de = language === 'de';
  if (result.condition === 'total-current') return de ? 'Der Gesamtstrom' : 'The total current';
  if (result.condition === 'equivalent-resistance') {
    return de ? 'Der Ersatzwiderstand' : 'The equivalent resistance';
  }
  if (result.condition === 'ammeter-current' || result.condition === 'voltmeter-voltage') {
    return de ? `Der Messwert von ${component}` : `The reading of ${component}`;
  }
  return component;
}

function formatQuantity(value: number, quantity: CompletionQuantity, language: 'de' | 'en'): string {
  const absolute = Math.abs(value);
  let scaled = value;
  let unit = quantity === 'current' ? 'A' : quantity === 'voltage' ? 'V' : '\u03a9';
  if (quantity === 'current') {
    if (absolute > 0 && absolute < 1e-6) { scaled = value * 1e9; unit = 'nA'; }
    else if (absolute > 0 && absolute < 1e-3) { scaled = value * 1e6; unit = '\u00b5A'; }
    else if (absolute > 0 && absolute < 1) { scaled = value * 1e3; unit = 'mA'; }
  } else if (quantity === 'voltage') {
    if (absolute > 0 && absolute < 1) { scaled = value * 1e3; unit = 'mV'; }
  } else if (absolute >= 1e6) {
    scaled = value / 1e6; unit = `M\u03a9`;
  } else if (absolute >= 1e3) {
    scaled = value / 1e3; unit = `k\u03a9`;
  }
  const formatted = new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', {
    maximumFractionDigits: 6,
  }).format(scaled);
  return `${formatted} ${unit}`;
}

function fail(message: string): never {
  throw new CompletionRuleError(message);
}
