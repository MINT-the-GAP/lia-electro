import {
  CIRCUIT_SCHEMA,
  CIRCUIT_VERSION,
  cloneCircuit,
  type CircuitDocument,
  type ComponentModel,
  type PortReference,
  type WireModel,
  type WireRoute,
} from './model.ts';
import { isSymbolId, SYMBOL_BY_ID, type Rotation } from './symbols.ts';

const MAX_JSON_LENGTH = 1_000_000;
const MAX_COMPONENTS = 500;
const MAX_WIRES = 2_000;
const ID_PATTERN = /^[A-Za-z0-9_-]{1,80}$/;

export const MAX_COMPONENT_TEXT_LENGTH = 120;

export class CircuitFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitFormatError';
  }
}

export function parseCircuitJSON(input: string): CircuitDocument {
  if (input.length > MAX_JSON_LENGTH) {
    throw new CircuitFormatError(`JSON exceeds the ${MAX_JSON_LENGTH} character limit.`);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(input);
  } catch (error) {
    throw new CircuitFormatError(`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  return validateCircuit(raw);
}

export function validateCircuit(raw: unknown): CircuitDocument {
  const source = asRecord(raw, 'document');
  if (source.schema !== CIRCUIT_SCHEMA) fail('schema', `must equal ${CIRCUIT_SCHEMA}`);
  if (source.version !== CIRCUIT_VERSION) fail('version', `must equal ${CIRCUIT_VERSION}`);

  const settingsRaw = asRecord(source.settings, 'settings');
  const snapStep = finitePositive(settingsRaw.snapStep, 'settings.snapStep');
  const wireStub = finitePositive(settingsRaw.wireStub, 'settings.wireStub');

  if (!Array.isArray(source.components)) fail('components', 'must be an array');
  if (!Array.isArray(source.wires)) fail('wires', 'must be an array');
  if (source.components.length > MAX_COMPONENTS) fail('components', `must contain at most ${MAX_COMPONENTS} entries`);
  if (source.wires.length > MAX_WIRES) fail('wires', `must contain at most ${MAX_WIRES} entries`);

  const componentIds = new Set<string>();
  const components = source.components.map((value, index) => {
    const path = `components[${index}]`;
    const item = asRecord(value, path);
    const id = validId(item.id, `${path}.id`);
    if (componentIds.has(id)) fail(`${path}.id`, `duplicates ${id}`);
    componentIds.add(id);
    if (!isSymbolId(item.kind)) fail(`${path}.kind`, `is not a known symbol: ${String(item.kind)}`);
    if (!Array.isArray(item.at) || item.at.length !== 2) fail(`${path}.at`, 'must contain exactly two numbers');
    const rotation = validRotation(item.rotation, `${path}.rotation`);
    const name = validOptionalComponentText(item.name, `${path}.name`);
    const componentValue = validOptionalComponentText(item.value, `${path}.value`);
    const showMeasurement = validOptionalBoolean(item.showMeasurement, `${path}.showMeasurement`);
    const locked = validOptionalBoolean(item.locked, `${path}.locked`);
    const origin = validOptionalComponentOrigin(item.origin, `${path}.origin`);
    if (
      showMeasurement !== undefined &&
      item.kind !== 'ammeter' &&
      item.kind !== 'voltmeter'
    ) {
      fail(`${path}.showMeasurement`, 'is only valid for ammeters and voltmeters');
    }
    return {
      id,
      kind: item.kind,
      at: [finite(item.at[0], `${path}.at[0]`), finite(item.at[1], `${path}.at[1]`)] as [number, number],
      rotation,
      ...(name ? { name } : {}),
      ...(componentValue ? { value: componentValue } : {}),
      ...(showMeasurement === false ? { showMeasurement: false } : {}),
      ...(locked === true ? { locked: true } : {}),
      ...(origin ? { origin } : {}),
    } satisfies ComponentModel;
  });

  const byComponentId = new Map(components.map((component) => [component.id, component]));
  const wireIds = new Set<string>();
  const wires = source.wires.map((value, index) => {
    const path = `wires[${index}]`;
    const item = asRecord(value, path);
    const id = validId(item.id, `${path}.id`);
    if (wireIds.has(id)) fail(`${path}.id`, `duplicates ${id}`);
    wireIds.add(id);
    const from = validPort(item.from, `${path}.from`, byComponentId);
    const to = validPort(item.to, `${path}.to`, byComponentId);
    if (from.componentId === to.componentId && from.portId === to.portId) {
      fail(path, 'cannot connect a port to itself');
    }
    const route = item.route;
    if (route !== 'horizontal-first' && route !== 'vertical-first') {
      fail(`${path}.route`, 'must be horizontal-first or vertical-first');
    }
    return { id, from, to, route: route as WireRoute } satisfies WireModel;
  });

  return {
    schema: CIRCUIT_SCHEMA,
    version: CIRCUIT_VERSION,
    settings: { snapStep, wireStub },
    components,
    wires,
  };
}

export function stringifyCircuit(document: CircuitDocument): string {
  const normalized = validateCircuit(cloneCircuit(document));
  normalized.components.sort((left, right) => left.id.localeCompare(right.id));
  normalized.wires.sort((left, right) => left.id.localeCompare(right.id));
  return JSON.stringify(normalized, null, 2);
}

function validPort(
  value: unknown,
  path: string,
  components: ReadonlyMap<string, ComponentModel>,
): PortReference {
  const source = asRecord(value, path);
  const componentId = validId(source.componentId, `${path}.componentId`);
  const portId = validId(source.portId, `${path}.portId`);
  const component = components.get(componentId);
  if (!component) fail(`${path}.componentId`, `references missing component ${componentId}`);
  const definition = SYMBOL_BY_ID[component.kind];
  if (!definition.terminals.some((terminal) => terminal.id === portId)) {
    fail(`${path}.portId`, `references missing port ${portId} on ${componentId}`);
  }
  return { componentId, portId };
}

function validRotation(value: unknown, path: string): Rotation {
  if (value === 0 || value === 90 || value === 180 || value === 270) return value;
  fail(path, 'must be one of 0, 90, 180 or 270');
}

function validId(value: unknown, path: string): string {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    fail(path, 'must match /^[A-Za-z0-9_-]{1,80}$/');
  }
  return value;
}

function validOptionalComponentText(value: unknown, path: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') fail(path, 'must be a string when present');
  if (/[\u0000-\u001f\u007f]/u.test(value)) fail(path, 'must contain a single line of text');
  const normalized = value.trim();
  if (!normalized) return undefined;
  if (normalized.length > MAX_COMPONENT_TEXT_LENGTH) {
    fail(path, `must contain at most ${MAX_COMPONENT_TEXT_LENGTH} characters`);
  }
  return normalized;
}

function validOptionalBoolean(value: unknown, path: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') fail(path, 'must be a boolean when present');
  return value;
}

function validOptionalComponentOrigin(value: unknown, path: string): 'macro' | 'editor' | undefined {
  if (value === undefined) return undefined;
  if (value !== 'macro' && value !== 'editor') {
    fail(path, 'must equal macro or editor when present');
  }
  return value;
}

function finite(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    fail(path, 'must be a finite number');
  }
  return value;
}

function finitePositive(value: unknown, path: string): number {
  const number = finite(value, path);
  if (number <= 0 || number > 10) fail(path, 'must be greater than 0 and at most 10');
  return number;
}

function asRecord(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, 'must be an object');
  return value as Record<string, unknown>;
}

function fail(path: string, message: string): never {
  throw new CircuitFormatError(`${path}: ${message}`);
}
