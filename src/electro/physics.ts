import type { CircuitDocument, ComponentModel } from './model.ts';
import { SYMBOL_BY_ID, type SymbolId } from './symbols.ts';

export type DcAnalysisStatus =
  | 'empty'
  | 'no-source'
  | 'solved'
  | 'open'
  | 'short-circuit'
  | 'incomplete'
  | 'unsupported'
  | 'invalid';

export type DcDiagnosticCode =
  | 'missing-value'
  | 'invalid-value'
  | 'unsupported-component'
  | 'open-circuit'
  | 'short-circuit'
  | 'singular-network'
  | 'network-too-large';

export interface DcDiagnostic {
  code: DcDiagnosticCode;
  componentId?: string;
  detail?: string;
}

export interface DcComponentResult {
  componentId: string;
  kind: SymbolId;
  role: 'source' | 'resistor' | 'ammeter' | 'voltmeter';
  fromPort: string;
  toPort: string;
  voltageV?: number;
  currentA?: number;
  powerW?: number;
  sourceVoltageV?: number;
  resistanceOhm?: number;
}

export interface DcCircuitResult {
  id: string;
  status: Exclude<DcAnalysisStatus, 'empty' | 'no-source'>;
  componentIds: string[];
  sourceIds: string[];
  voltageV?: number;
  currentA?: number;
  equivalentResistanceOhm?: number;
}

export interface DcAnalysis {
  status: DcAnalysisStatus;
  circuits: DcCircuitResult[];
  components: DcComponentResult[];
  diagnostics: DcDiagnostic[];
}

interface IndependentSource {
  component: ComponentModel;
  plusNode: string;
  minusNode: string;
  voltageV: number;
}

interface ResistanceBranch {
  component: ComponentModel;
  fromNode: string;
  toNode: string;
  resistanceOhm: number;
}

interface ConstraintBranch {
  component: ComponentModel;
  plusNode: string;
  minusNode: string;
  voltageV: number;
  role: 'source' | 'ammeter';
  variableIndex?: number;
}

interface GroupResult {
  circuit: DcCircuitResult;
  components: DcComponentResult[];
  diagnostics: DcDiagnostic[];
}

const INDEPENDENT_SOURCE_KINDS = new Set<SymbolId>(['battery', 'voltage-source']);
const RESISTANCE_KINDS = new Set<SymbolId>(['resistor', 'variable-resistor']);
const SUPPORTED_KINDS = new Set<SymbolId>([
  ...INDEPENDENT_SOURCE_KINDS,
  ...RESISTANCE_KINDS,
  'ammeter',
  'voltmeter',
  'ground',
]);
const MAX_UNKNOWNS = 160;
const EPSILON = 1e-11;

export function parseVoltageValue(value: unknown): number | null {
  return parseSiQuantity(value, 'voltage');
}

export function parseCurrentValue(value: unknown): number | null {
  return parseSiQuantity(value, 'current');
}

export function parseResistanceValue(value: unknown): number | null {
  const parsed = parseSiQuantity(value, 'resistance');
  return parsed != null && parsed > 0 ? parsed : null;
}

export function analyzeDcCircuit(document: CircuitDocument): DcAnalysis {
  if (document.components.length === 0) {
    return { status: 'empty', circuits: [], components: [], diagnostics: [] };
  }

  const independentSources = document.components.filter((component) =>
    INDEPENDENT_SOURCE_KINDS.has(component.kind));
  if (independentSources.length === 0) {
    return { status: 'no-source', circuits: [], components: [], diagnostics: [] };
  }

  const terminalKeys = document.components.flatMap((component) =>
    SYMBOL_BY_ID[component.kind].terminals.map((terminal) => portKey(component.id, terminal.id)));
  const wireNodes = new UnionFind(terminalKeys);
  document.wires.forEach((wire) => {
    wireNodes.union(
      portKey(wire.from.componentId, wire.from.portId),
      portKey(wire.to.componentId, wire.to.portId),
    );
  });

  const componentNodes = new Map<string, string[]>();
  document.components.forEach((component) => {
    componentNodes.set(component.id, SYMBOL_BY_ID[component.kind].terminals.map((terminal) =>
      wireNodes.find(portKey(component.id, terminal.id))));
  });

  const structuralNodes = new UnionFind([...new Set([...componentNodes.values()].flat())]);
  document.components.forEach((component) => {
    if (component.kind === 'voltmeter') return;
    const nodes = [...new Set(componentNodes.get(component.id) || [])];
    for (let index = 1; index < nodes.length; index += 1) structuralNodes.union(nodes[0], nodes[index]);
  });

  const groups = new Map<string, ComponentModel[]>();
  document.components.forEach((component) => {
    if (component.kind === 'voltmeter') return;
    const firstNode = componentNodes.get(component.id)?.[0];
    if (!firstNode) return;
    const root = structuralNodes.find(firstNode);
    const group = groups.get(root) || [];
    group.push(component);
    groups.set(root, group);
  });
  document.components.filter((component) => component.kind === 'voltmeter').forEach((component) => {
    const roots = [...new Set((componentNodes.get(component.id) || []).map((node) => structuralNodes.find(node)))];
    if (roots.length !== 1 || !groups.has(roots[0])) return;
    groups.get(roots[0])!.push(component);
  });

  const sourceRoots = [...new Set(independentSources.map((component) => {
    const node = componentNodes.get(component.id)?.[0];
    return node ? structuralNodes.find(node) : '';
  }).filter(Boolean))].sort();
  const analyzed = sourceRoots.map((root, index) => analyzeGroup(
    `dc_${String(index + 1).padStart(2, '0')}`,
    (groups.get(root) || []).sort((left, right) => left.id.localeCompare(right.id)),
    componentNodes,
  ));

  const circuits = analyzed.map((result) => result.circuit);
  const components = analyzed.flatMap((result) => result.components);
  const diagnostics = analyzed.flatMap((result) => result.diagnostics);
  return {
    status: overallStatus(circuits),
    circuits,
    components,
    diagnostics,
  };
}

function analyzeGroup(
  id: string,
  group: ComponentModel[],
  componentNodes: ReadonlyMap<string, string[]>,
): GroupResult {
  const sourceComponents = group.filter((component) => INDEPENDENT_SOURCE_KINDS.has(component.kind));
  const baseCircuit = {
    id,
    componentIds: group.map((component) => component.id),
    sourceIds: sourceComponents.map((component) => component.id),
  };
  const unsupported = group.filter((component) => !SUPPORTED_KINDS.has(component.kind));
  if (unsupported.length > 0) {
    return {
      circuit: { ...baseCircuit, status: 'unsupported' },
      components: [],
      diagnostics: unsupported.map((component) => ({
        code: 'unsupported-component',
        componentId: component.id,
        detail: component.kind,
      })),
    };
  }

  const diagnostics: DcDiagnostic[] = [];
  const sources: IndependentSource[] = [];
  const resistors: ResistanceBranch[] = [];
  group.forEach((component) => {
    const nodes = componentNodes.get(component.id) || [];
    if (INDEPENDENT_SOURCE_KINDS.has(component.kind)) {
      const raw = component.value?.trim();
      const voltageV = parseVoltageValue(raw);
      if (!raw) diagnostics.push({ code: 'missing-value', componentId: component.id, detail: 'voltage' });
      else if (voltageV == null) diagnostics.push({ code: 'invalid-value', componentId: component.id, detail: 'voltage' });
      else {
        const [minusPort, plusPort] = component.kind === 'battery' ? ['a', 'b'] : ['minus', 'plus'];
        sources.push({
          component,
          minusNode: nodeForPort(component, minusPort, nodes),
          plusNode: nodeForPort(component, plusPort, nodes),
          voltageV,
        });
      }
    }
    if (RESISTANCE_KINDS.has(component.kind)) {
      const raw = component.value?.trim();
      const resistanceOhm = parseResistanceValue(raw);
      if (!raw) diagnostics.push({ code: 'missing-value', componentId: component.id, detail: 'resistance' });
      else if (resistanceOhm == null) diagnostics.push({ code: 'invalid-value', componentId: component.id, detail: 'resistance' });
      else resistors.push({
        component,
        fromNode: nodeForPort(component, 'a', nodes),
        toNode: nodeForPort(component, 'b', nodes),
        resistanceOhm,
      });
    }
  });
  if (diagnostics.length > 0) {
    return { circuit: { ...baseCircuit, status: 'incomplete' }, components: [], diagnostics };
  }

  for (const source of sources) {
    if (source.plusNode === source.minusNode) {
      return shortCircuit(baseCircuit, source.component.id);
    }
  }

  const ammeters = group.filter((component) => component.kind === 'ammeter').map((component) => {
    const nodes = componentNodes.get(component.id) || [];
    return {
      component,
      plusNode: nodeForPort(component, 'a', nodes),
      minusNode: nodeForPort(component, 'b', nodes),
      voltageV: 0,
      role: 'ammeter' as const,
    };
  });
  const zeroGraph = new Map<string, Set<string>>();
  ammeters.forEach((branch) => addGraphEdge(zeroGraph, branch.plusNode, branch.minusNode));
  for (const source of sources) {
    if (hasGraphPath(zeroGraph, source.plusNode, source.minusNode)) {
      return shortCircuit(baseCircuit, source.component.id);
    }
  }

  const constraints: ConstraintBranch[] = [
    ...sources.map((source) => ({ ...source, role: 'source' as const })),
    ...ammeters,
  ];
  const activeNodes = new Set<string>();
  resistors.forEach((branch) => { activeNodes.add(branch.fromNode); activeNodes.add(branch.toNode); });
  constraints.forEach((branch) => { activeNodes.add(branch.plusNode); activeNodes.add(branch.minusNode); });
  const groundNode = group.find((component) => component.kind === 'ground')
    ? componentNodes.get(group.find((component) => component.kind === 'ground')!.id)?.[0]
    : undefined;
  const referenceNode = groundNode && activeNodes.has(groundNode) ? groundNode : sources[0].minusNode;
  const unknownNodes = [...activeNodes].filter((node) => node !== referenceNode).sort();
  const activeConstraints = constraints.filter((branch) => branch.plusNode !== branch.minusNode);
  const dimension = unknownNodes.length + activeConstraints.length;
  if (dimension > MAX_UNKNOWNS) {
    return {
      circuit: { ...baseCircuit, status: 'invalid' },
      components: [],
      diagnostics: [{ code: 'network-too-large', detail: String(dimension) }],
    };
  }
  const nodeIndex = new Map(unknownNodes.map((node, index) => [node, index]));
  const matrix = Array.from({ length: dimension }, () => Array(dimension).fill(0));
  const right = Array(dimension).fill(0);
  resistors.forEach((branch) => stampResistance(matrix, nodeIndex, branch.fromNode, branch.toNode, branch.resistanceOhm));
  activeConstraints.forEach((branch, index) => {
    const variableIndex = unknownNodes.length + index;
    branch.variableIndex = variableIndex;
    stampConstraint(matrix, right, nodeIndex, branch.plusNode, branch.minusNode, variableIndex, branch.voltageV);
  });
  const solution = solveLinearSystem(matrix, right);
  if (!solution) {
    return {
      circuit: { ...baseCircuit, status: 'invalid' },
      components: [],
      diagnostics: [{ code: 'singular-network' }],
    };
  }

  const voltageAt = (node: string): number | undefined => {
    if (node === referenceNode) return 0;
    const index = nodeIndex.get(node);
    return index == null ? undefined : solution[index];
  };
  const constraintById = new Map(activeConstraints.map((branch) => [branch.component.id, branch]));
  const results: DcComponentResult[] = [];
  sources.forEach((source) => {
    const branch = constraintById.get(source.component.id);
    const currentA = branch?.variableIndex == null ? undefined : solution[branch.variableIndex];
    const voltageV = difference(voltageAt(source.plusNode), voltageAt(source.minusNode));
    results.push({
      componentId: source.component.id,
      kind: source.component.kind,
      role: 'source',
      fromPort: source.component.kind === 'battery' ? 'b' : 'plus',
      toPort: source.component.kind === 'battery' ? 'a' : 'minus',
      voltageV,
      currentA,
      powerW: voltageV != null && currentA != null ? voltageV * currentA : undefined,
      sourceVoltageV: source.voltageV,
    });
  });
  resistors.forEach((branch) => {
    const voltageV = difference(voltageAt(branch.fromNode), voltageAt(branch.toNode));
    const currentA = voltageV == null ? undefined : voltageV / branch.resistanceOhm;
    results.push({
      componentId: branch.component.id,
      kind: branch.component.kind,
      role: 'resistor',
      fromPort: 'a',
      toPort: 'b',
      voltageV,
      currentA,
      powerW: voltageV != null && currentA != null ? voltageV * currentA : undefined,
      resistanceOhm: branch.resistanceOhm,
    });
  });
  ammeters.forEach((ammeter) => {
    const branch = constraintById.get(ammeter.component.id);
    const currentA = branch?.variableIndex == null ? undefined : solution[branch.variableIndex];
    results.push({
      componentId: ammeter.component.id,
      kind: ammeter.component.kind,
      role: 'ammeter',
      fromPort: 'a',
      toPort: 'b',
      voltageV: 0,
      currentA,
      powerW: 0,
    });
  });
  group.filter((component) => component.kind === 'voltmeter').forEach((component) => {
    const nodes = componentNodes.get(component.id) || [];
    results.push({
      componentId: component.id,
      kind: component.kind,
      role: 'voltmeter',
      fromPort: 'a',
      toPort: 'b',
      voltageV: difference(voltageAt(nodeForPort(component, 'a', nodes)), voltageAt(nodeForPort(component, 'b', nodes))),
      currentA: 0,
      powerW: 0,
    });
  });

  const loadGraph = new Map<string, Set<string>>();
  resistors.forEach((branch) => addGraphEdge(loadGraph, branch.fromNode, branch.toNode));
  ammeters.forEach((branch) => addGraphEdge(loadGraph, branch.plusNode, branch.minusNode));
  const closed = sources.some((source) => hasGraphPath(loadGraph, source.plusNode, source.minusNode));
  const sourceResult = sources.length === 1
    ? results.find((result) => result.componentId === sources[0].component.id)
    : undefined;
  const voltageV = sourceResult?.voltageV == null ? undefined : Math.abs(sourceResult.voltageV);
  const currentA = sourceResult?.currentA == null ? undefined : Math.abs(sourceResult.currentA);
  const status = closed ? 'solved' : 'open';
  return {
    circuit: {
      ...baseCircuit,
      status,
      voltageV,
      currentA,
      equivalentResistanceOhm: closed && voltageV != null && currentA != null && currentA > EPSILON
        ? voltageV / currentA
        : undefined,
    },
    components: results,
    diagnostics: closed ? [] : [{ code: 'open-circuit' }],
  };
}

function parseSiQuantity(value: unknown, kind: 'voltage' | 'current' | 'resistance'): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  let text = String(value).trim();
  if (!text) return null;
  if ((text.startsWith('$') && text.endsWith('$')) || (text.startsWith('\\(') && text.endsWith('\\)'))) {
    text = text.slice(text.startsWith('$') ? 1 : 2, text.endsWith('$') ? -1 : -2);
  }
  text = text
    .replace(/\{,\}/g, ',')
    .replace(/\\(?:mathrm|text)\s*\{([^{}]*)\}/g, '$1')
    .replace(/\\Omega/g, 'Ω')
    .replace(/\\mu/g, 'µ')
    .replace(/\\[,;:! ]/g, ' ')
    .replace(/[{}]/g, '')
    .trim();
  if (text.includes('=')) text = text.slice(text.lastIndexOf('=') + 1).trim();
  const match = text.match(/^([+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?)\s*([pnumµukKMG]?)\s*([A-Za-zΩ]*)$/u);
  if (!match) return null;
  const unit = match[3];
  if (kind === 'voltage' && unit && unit.toLowerCase() !== 'v') return null;
  if (kind === 'current' && unit && unit.toLowerCase() !== 'a') return null;
  if (kind === 'resistance' && unit && unit !== 'Ω' && unit.toLowerCase() !== 'ohm') return null;
  const prefix = match[2];
  const multipliers: Record<string, number> = {
    '': 1, p: 1e-12, n: 1e-9, u: 1e-6, µ: 1e-6, m: 1e-3, k: 1e3, K: 1e3, M: 1e6, G: 1e9,
  };
  const number = Number(match[1].replace(',', '.')) * multipliers[prefix];
  return Number.isFinite(number) ? number : null;
}

function nodeForPort(component: ComponentModel, portId: string, nodes: string[]): string {
  const index = SYMBOL_BY_ID[component.kind].terminals.findIndex((terminal) => terminal.id === portId);
  return nodes[index] || '';
}

function stampResistance(
  matrix: number[][],
  nodeIndex: ReadonlyMap<string, number>,
  fromNode: string,
  toNode: string,
  resistanceOhm: number,
): void {
  const conductance = 1 / resistanceOhm;
  const from = nodeIndex.get(fromNode);
  const to = nodeIndex.get(toNode);
  if (from != null) matrix[from][from] += conductance;
  if (to != null) matrix[to][to] += conductance;
  if (from != null && to != null) {
    matrix[from][to] -= conductance;
    matrix[to][from] -= conductance;
  }
}

function stampConstraint(
  matrix: number[][],
  right: number[],
  nodeIndex: ReadonlyMap<string, number>,
  plusNode: string,
  minusNode: string,
  variableIndex: number,
  voltageV: number,
): void {
  const plus = nodeIndex.get(plusNode);
  const minus = nodeIndex.get(minusNode);
  if (plus != null) { matrix[plus][variableIndex] += 1; matrix[variableIndex][plus] += 1; }
  if (minus != null) { matrix[minus][variableIndex] -= 1; matrix[variableIndex][minus] -= 1; }
  right[variableIndex] = voltageV;
}

function solveLinearSystem(matrix: number[][], right: number[]): number[] | null {
  const size = right.length;
  if (size === 0) return [];
  const rows = matrix.map((row, index) => [...row, right[index]]);
  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(rows[row][column]) > Math.abs(rows[pivot][column])) pivot = row;
    }
    if (Math.abs(rows[pivot][column]) < EPSILON) return null;
    [rows[column], rows[pivot]] = [rows[pivot], rows[column]];
    const divisor = rows[column][column];
    for (let entry = column; entry <= size; entry += 1) rows[column][entry] /= divisor;
    for (let row = 0; row < size; row += 1) {
      if (row === column) continue;
      const factor = rows[row][column];
      if (Math.abs(factor) < EPSILON) continue;
      for (let entry = column; entry <= size; entry += 1) {
        rows[row][entry] -= factor * rows[column][entry];
      }
    }
  }
  const solution = rows.map((row) => row[size]);
  return solution.every(Number.isFinite) ? solution : null;
}

function difference(left: number | undefined, right: number | undefined): number | undefined {
  return left == null || right == null ? undefined : left - right;
}

function addGraphEdge(graph: Map<string, Set<string>>, left: string, right: string): void {
  if (!left || !right || left === right) return;
  if (!graph.has(left)) graph.set(left, new Set());
  if (!graph.has(right)) graph.set(right, new Set());
  graph.get(left)!.add(right);
  graph.get(right)!.add(left);
}

function hasGraphPath(graph: ReadonlyMap<string, ReadonlySet<string>>, start: string, target: string): boolean {
  if (!start || !target) return false;
  if (start === target) return true;
  const pending = [start];
  const visited = new Set<string>(pending);
  while (pending.length > 0) {
    const node = pending.shift()!;
    for (const next of graph.get(node) || []) {
      if (next === target) return true;
      if (!visited.has(next)) { visited.add(next); pending.push(next); }
    }
  }
  return false;
}

function shortCircuit(
  base: Omit<DcCircuitResult, 'status'>,
  componentId: string,
): GroupResult {
  return {
    circuit: { ...base, status: 'short-circuit' },
    components: [],
    diagnostics: [{ code: 'short-circuit', componentId }],
  };
}

function overallStatus(circuits: readonly DcCircuitResult[]): DcAnalysisStatus {
  const priority: DcAnalysisStatus[] = [
    'invalid', 'short-circuit', 'incomplete', 'unsupported', 'open', 'solved',
  ];
  return priority.find((status) => circuits.some((circuit) => circuit.status === status)) || 'no-source';
}

function portKey(componentId: string, portId: string): string {
  return `${componentId}:${portId}`;
}

class UnionFind {
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
