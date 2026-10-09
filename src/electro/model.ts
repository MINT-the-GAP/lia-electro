import type { Rotation, SymbolId } from './symbols.ts';

export const CIRCUIT_SCHEMA = 'mint-the-gap/electro-circuit' as const;
export const CIRCUIT_VERSION = 1 as const;

export interface CircuitSettings {
  snapStep: number;
  wireStub: number;
}

export interface ComponentModel {
  id: string;
  kind: SymbolId;
  at: [number, number];
  rotation: Rotation;
  name?: string;
  value?: string;
  showMeasurement?: boolean;
  locked?: boolean;
  origin?: 'macro' | 'editor';
}

export interface PortReference {
  componentId: string;
  portId: string;
}

export type WireRoute = 'horizontal-first' | 'vertical-first';

export interface WireModel {
  id: string;
  from: PortReference;
  to: PortReference;
  route: WireRoute;
}

export interface CircuitDocument {
  schema: typeof CIRCUIT_SCHEMA;
  version: typeof CIRCUIT_VERSION;
  settings: CircuitSettings;
  components: ComponentModel[];
  wires: WireModel[];
}

export function createEmptyCircuit(settings: Partial<CircuitSettings> = {}): CircuitDocument {
  return {
    schema: CIRCUIT_SCHEMA,
    version: CIRCUIT_VERSION,
    settings: {
      snapStep: normalizePositive(settings.snapStep, 0.5),
      wireStub: normalizePositive(settings.wireStub, 0.35),
    },
    components: [],
    wires: [],
  };
}

export function cloneCircuit(document: CircuitDocument): CircuitDocument {
  return {
    schema: CIRCUIT_SCHEMA,
    version: CIRCUIT_VERSION,
    settings: { ...document.settings },
    components: document.components.map((component) => ({
      ...component,
      at: [component.at[0], component.at[1]],
    })),
    wires: document.wires.map((wire) => ({
      ...wire,
      from: { ...wire.from },
      to: { ...wire.to },
    })),
  };
}

export function snapValue(value: number, step: number): number {
  const safeStep = normalizePositive(step, 0.5);
  const snapped = Math.round(value / safeStep) * safeStep;
  return Math.abs(snapped) < 1e-12 ? 0 : Number(snapped.toFixed(10));
}

export function snapPoint(point: readonly [number, number], step: number): [number, number] {
  return [snapValue(point[0], step), snapValue(point[1], step)];
}

export function samePort(left: PortReference, right: PortReference): boolean {
  return left.componentId === right.componentId && left.portId === right.portId;
}

export function nextEntityId(prefix: 'c' | 'w', existingIds: Iterable<string>): string {
  const existing = new Set(existingIds);
  let index = 1;
  while (existing.has(`${prefix}_${String(index).padStart(4, '0')}`)) index += 1;
  return `${prefix}_${String(index).padStart(4, '0')}`;
}

function normalizePositive(value: unknown, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}
