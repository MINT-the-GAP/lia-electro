export type SymbolId =
  | 'battery'
  | 'resistor'
  | 'variable-resistor'
  | 'capacitor'
  | 'inductor'
  | 'iron-core-inductor'
  | 'voltmeter'
  | 'ammeter'
  | 'motor'
  | 'lamp'
  | 'diode'
  | 'photodiode'
  | 'led'
  | 'voltage-source'
  | 'switch'
  | 'changeover-switch'
  | 'ground'
  | 'antenna'
  | 'transistor'
  | 'transformer';

export type Rotation = 0 | 90 | 180 | 270;
export type Direction = 'left' | 'right' | 'up' | 'down';
export type Vec2 = readonly [number, number];
export type StrokePath = readonly Vec2[];

export interface TerminalDefinition {
  id: string;
  label: { de: string; en: string };
  point: Vec2;
  direction: Direction;
}

export interface SymbolDefinition {
  id: SymbolId;
  label: { de: string; en: string };
  paths: readonly StrokePath[];
  terminals: readonly TerminalDefinition[];
  bounds: readonly [number, number, number, number];
}

const line = (x1: number, y1: number, x2: number, y2: number): Vec2[] => [
  [x1, y1],
  [x2, y2],
];

const polyline = (...coordinates: number[]): Vec2[] => {
  const points: Vec2[] = [];
  for (let index = 0; index + 1 < coordinates.length; index += 2) {
    points.push([coordinates[index], coordinates[index + 1]]);
  }
  return points;
};

const arc = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  from: number,
  to: number,
  steps = 16,
): Vec2[] => {
  const points: Vec2[] = [];
  for (let index = 0; index <= steps; index += 1) {
    const angle = from + ((to - from) * index) / steps;
    points.push([cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry]);
  }
  return points;
};

const circle = (cx = 0, cy = 0, radius = 0.55): Vec2[] =>
  arc(cx, cy, radius, radius, 0, Math.PI * 2, 40);

const arrow = (from: Vec2, to: Vec2, headLength = 0.2): Vec2[][] => {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;
  const baseX = to[0] - ux * headLength;
  const baseY = to[1] - uy * headLength;
  return [
    [from, to],
    [to, [baseX + px * headLength * 0.55, baseY + py * headLength * 0.55]],
    [to, [baseX - px * headLength * 0.55, baseY - py * headLength * 0.55]],
  ];
};

const twoTerminal = (
  leftId = 'a',
  rightId = 'b',
): readonly TerminalDefinition[] => [
  { id: leftId, label: { de: 'Anschluss links', en: 'Left terminal' }, point: [-1.4, 0], direction: 'left' },
  { id: rightId, label: { de: 'Anschluss rechts', en: 'Right terminal' }, point: [1.4, 0], direction: 'right' },
];

const meterPaths = (letter: 'V' | 'A' | 'M'): Vec2[][] => {
  const glyph = letter === 'V'
    ? [polyline(-0.28, 0.25, 0, -0.27, 0.28, 0.25)]
    : letter === 'A'
      ? [
          polyline(-0.3, -0.25, 0, 0.3, 0.3, -0.25),
          line(-0.18, -0.04, 0.18, -0.04),
        ]
      : [polyline(-0.32, -0.25, -0.32, 0.26, 0, -0.04, 0.32, 0.26, 0.32, -0.25)];
  return [line(-1.4, 0, -0.55, 0), circle(), line(0.55, 0, 1.4, 0), ...glyph];
};

const coilPaths = (): Vec2[][] => {
  const paths: Vec2[][] = [line(-1.4, 0, -0.76, 0), line(0.76, 0, 1.4, 0)];
  for (let index = 0; index < 4; index += 1) {
    const center = -0.57 + index * 0.38;
    paths.push(arc(center, 0, 0.19, 0.32, Math.PI, 0, 14));
  }
  return paths;
};

const diodePaths = (): Vec2[][] => [
  line(-1.4, 0, -0.62, 0),
  polyline(-0.62, -0.48, -0.62, 0.48, 0.34, 0, -0.62, -0.48),
  line(0.36, -0.52, 0.36, 0.52),
  line(0.36, 0, 1.4, 0),
];

const resistorPaths = (): Vec2[][] => [
  line(-1.4, 0, -0.72, 0),
  polyline(-0.72, -0.36, -0.72, 0.36, 0.72, 0.36, 0.72, -0.36, -0.72, -0.36),
  line(0.72, 0, 1.4, 0),
];

const transformerCoil = (x: number, side: -1 | 1): Vec2[] => {
  const result: Vec2[] = [];
  for (let index = 0; index < 4; index += 1) {
    const centerY = 0.465 - index * 0.31;
    const turn = side < 0
      ? arc(x, centerY, 0.22, 0.155, Math.PI / 2, -Math.PI / 2, 14)
      : arc(x, centerY, 0.22, 0.155, Math.PI / 2, (Math.PI * 3) / 2, 14);
    result.push(...(index === 0 ? turn : turn.slice(1)));
  }
  return result;
};

export const SYMBOLS: readonly SymbolDefinition[] = [
  {
    id: 'battery',
    label: { de: 'Batterie', en: 'Battery' },
    terminals: twoTerminal(),
    bounds: [-1.5, -0.75, 1.5, 0.75],
    paths: [
      line(-1.4, 0, -0.18, 0),
      line(-0.18, -0.38, -0.18, 0.38),
      line(0.18, -0.65, 0.18, 0.65),
      line(0.18, 0, 1.4, 0),
    ],
  },
  {
    id: 'resistor',
    label: { de: 'Widerstand', en: 'Resistor' },
    terminals: twoTerminal(),
    bounds: [-1.5, -0.55, 1.5, 0.55],
    paths: resistorPaths(),
  },
  {
    id: 'variable-resistor',
    label: { de: 'Regelbarer Widerstand', en: 'Variable resistor' },
    terminals: twoTerminal(),
    bounds: [-1.5, -0.9, 1.5, 0.9],
    paths: [...resistorPaths(), ...arrow([-0.46, 0.82], [0.48, -0.72], 0.22)],
  },
  {
    id: 'capacitor',
    label: { de: 'Kondensator', en: 'Capacitor' },
    terminals: twoTerminal(),
    bounds: [-1.5, -0.75, 1.5, 0.75],
    paths: [
      line(-1.4, 0, -0.18, 0),
      line(-0.18, -0.65, -0.18, 0.65),
      line(0.18, -0.65, 0.18, 0.65),
      line(0.18, 0, 1.4, 0),
    ],
  },
  {
    id: 'inductor',
    label: { de: 'Spule', en: 'Inductor' },
    terminals: twoTerminal(),
    bounds: [-1.5, -0.45, 1.5, 0.45],
    paths: coilPaths(),
  },
  {
    id: 'iron-core-inductor',
    label: { de: 'Spule mit Eisenkern', en: 'Iron-core inductor' },
    terminals: twoTerminal(),
    bounds: [-1.5, -0.45, 1.5, 0.55],
    paths: [...coilPaths(), line(-0.82, 0.43, 0.82, 0.43)],
  },
  {
    id: 'voltmeter',
    label: { de: 'Voltmeter', en: 'Voltmeter' },
    terminals: twoTerminal(),
    bounds: [-1.5, -0.7, 1.5, 0.7],
    paths: meterPaths('V'),
  },
  {
    id: 'ammeter',
    label: { de: 'Amperemeter', en: 'Ammeter' },
    terminals: twoTerminal(),
    bounds: [-1.5, -0.7, 1.5, 0.7],
    paths: meterPaths('A'),
  },
  {
    id: 'motor',
    label: { de: 'Motor', en: 'Motor' },
    terminals: twoTerminal(),
    bounds: [-1.5, -0.7, 1.5, 0.7],
    paths: meterPaths('M'),
  },
  {
    id: 'lamp',
    label: { de: 'Lampe', en: 'Lamp' },
    terminals: twoTerminal(),
    bounds: [-1.5, -0.7, 1.5, 0.7],
    paths: [
      line(-1.4, 0, -0.55, 0),
      circle(),
      line(0.55, 0, 1.4, 0),
      line(-0.38, -0.38, 0.38, 0.38),
      line(-0.38, 0.38, 0.38, -0.38),
    ],
  },
  {
    id: 'diode',
    label: { de: 'Diode', en: 'Diode' },
    terminals: twoTerminal('anode', 'cathode'),
    bounds: [-1.5, -0.65, 1.5, 0.65],
    paths: diodePaths(),
  },
  {
    id: 'photodiode',
    label: { de: 'Photodiode', en: 'Photodiode' },
    terminals: twoTerminal('anode', 'cathode'),
    bounds: [-1.5, -0.65, 1.5, 1.15],
    paths: [
      ...diodePaths(),
      ...arrow([-0.48, 1.02], [-0.18, 0.62], 0.16),
      ...arrow([0.02, 1.08], [0.32, 0.68], 0.16),
    ],
  },
  {
    id: 'led',
    label: { de: 'LED', en: 'LED' },
    terminals: twoTerminal('anode', 'cathode'),
    bounds: [-1.5, -0.65, 1.5, 1.15],
    paths: [
      ...diodePaths(),
      ...arrow([0.08, 0.58], [0.4, 1.0], 0.16),
      ...arrow([0.48, 0.5], [0.8, 0.92], 0.16),
    ],
  },
  {
    id: 'voltage-source',
    label: { de: 'Spannungsquelle', en: 'Voltage source' },
    terminals: twoTerminal('minus', 'plus'),
    bounds: [-1.5, -0.35, 1.5, 0.35],
    paths: [
      line(-1.4, 0, -0.52, 0),
      circle(-0.42, 0, 0.1),
      circle(0.42, 0, 0.1),
      line(0.52, 0, 1.4, 0),
    ],
  },
  {
    id: 'switch',
    label: { de: 'Schalter', en: 'Switch' },
    terminals: twoTerminal('common', 'throw'),
    bounds: [-1.5, -0.35, 1.5, 0.75],
    paths: [
      line(-1.4, 0, -0.62, 0),
      circle(-0.52, 0, 0.1),
      circle(0.52, 0, 0.1),
      line(0.62, 0, 1.4, 0),
      line(-0.46, 0.08, 0.42, 0.55),
    ],
  },
  {
    id: 'changeover-switch',
    label: { de: 'Umschalter', en: 'Changeover switch' },
    terminals: [
      { id: 'common', label: { de: 'Gemeinsamer Anschluss', en: 'Common terminal' }, point: [-1.4, 0], direction: 'left' },
      { id: 'a', label: { de: 'Oberer Anschluss', en: 'Upper terminal' }, point: [1.4, 0.48], direction: 'right' },
      { id: 'b', label: { de: 'Unterer Anschluss', en: 'Lower terminal' }, point: [1.4, -0.48], direction: 'right' },
    ],
    bounds: [-1.5, -0.75, 1.5, 0.8],
    paths: [
      line(-1.4, 0, -0.62, 0),
      circle(-0.52, 0, 0.1),
      circle(0.52, 0.48, 0.1),
      circle(0.52, -0.48, 0.1),
      line(0.62, 0.48, 1.4, 0.48),
      line(0.62, -0.48, 1.4, -0.48),
      line(-0.44, 0.08, 0.42, 0.42),
    ],
  },
  {
    id: 'ground',
    label: { de: 'Erde', en: 'Ground' },
    terminals: [
      { id: 'terminal', label: { de: 'Anschluss', en: 'Terminal' }, point: [0, 1.4], direction: 'up' },
    ],
    bounds: [-0.75, -0.3, 0.75, 1.5],
    paths: [
      line(0, 1.4, 0, 0.35),
      line(-0.65, 0.35, 0.65, 0.35),
      line(-0.43, 0.13, 0.43, 0.13),
      line(-0.2, -0.09, 0.2, -0.09),
    ],
  },
  {
    id: 'antenna',
    label: { de: 'Antenne', en: 'Antenna' },
    terminals: [
      { id: 'terminal', label: { de: 'Anschluss', en: 'Terminal' }, point: [0, -1.4], direction: 'down' },
    ],
    bounds: [-0.7, -1.5, 0.7, 1.2],
    paths: [
      line(0, -1.4, 0, 0.55),
      line(0, 0.55, -0.48, 1.05),
      line(0, 0.55, 0.48, 1.05),
    ],
  },
  {
    id: 'transistor',
    label: { de: 'Transistor', en: 'Transistor' },
    terminals: [
      { id: 'base', label: { de: 'Basis', en: 'Base' }, point: [-1.4, 0], direction: 'left' },
      { id: 'collector', label: { de: 'Kollektor', en: 'Collector' }, point: [0.95, 1.2], direction: 'up' },
      { id: 'emitter', label: { de: 'Emitter', en: 'Emitter' }, point: [0.95, -1.2], direction: 'down' },
    ],
    bounds: [-1.5, -1.3, 1.1, 1.3],
    paths: [
      line(-1.4, 0, -0.28, 0),
      line(-0.28, -0.62, -0.28, 0.62),
      line(-0.28, 0.36, 0.95, 1.2),
      line(-0.28, -0.36, 0.95, -1.2),
      ...arrow([0.28, -0.75], [0.72, -1.05], 0.2),
    ],
  },
  {
    id: 'transformer',
    label: { de: 'Transformator', en: 'Transformer' },
    terminals: [
      { id: 'primary-top', label: { de: 'Primär oben', en: 'Primary top' }, point: [-1.4, 1.25], direction: 'left' },
      { id: 'primary-bottom', label: { de: 'Primär unten', en: 'Primary bottom' }, point: [-1.4, -1.25], direction: 'left' },
      { id: 'secondary-top', label: { de: 'Sekundär oben', en: 'Secondary top' }, point: [1.4, 1.25], direction: 'right' },
      { id: 'secondary-bottom', label: { de: 'Sekundär unten', en: 'Secondary bottom' }, point: [1.4, -1.25], direction: 'right' },
    ],
    bounds: [-1.52, -1.38, 1.52, 1.38],
    paths: [
      polyline(-1.4, 1.25, -0.45, 1.25, -0.45, 0.62),
      polyline(-1.4, -1.25, -0.45, -1.25, -0.45, -0.62),
      polyline(1.4, 1.25, 0.45, 1.25, 0.45, 0.62),
      polyline(1.4, -1.25, 0.45, -1.25, 0.45, -0.62),
      transformerCoil(-0.45, -1),
      transformerCoil(0.45, 1),
      line(-0.11, -0.76, -0.11, 0.76),
      line(0.11, -0.76, 0.11, 0.76),
    ],
  },
];

export const SYMBOL_BY_ID: Readonly<Record<SymbolId, SymbolDefinition>> = Object.freeze(
  Object.fromEntries(SYMBOLS.map((definition) => [definition.id, definition])) as Record<SymbolId, SymbolDefinition>,
);

export function isSymbolId(value: unknown): value is SymbolId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(SYMBOL_BY_ID, value);
}

export function normalizeRotation(value: number): Rotation {
  const normalized = ((Math.round(value / 90) * 90) % 360 + 360) % 360;
  return normalized as Rotation;
}

export function rotateVector(point: Vec2, rotation: Rotation): Vec2 {
  switch (rotation) {
    case 90:
      return [-point[1], point[0]];
    case 180:
      return [-point[0], -point[1]];
    case 270:
      return [point[1], -point[0]];
    default:
      return point;
  }
}

export function transformPoint(point: Vec2, x: number, y: number, rotation: Rotation): Vec2 {
  const rotated = rotateVector(point, rotation);
  return [x + rotated[0], y + rotated[1]];
}

export function rotateDirection(direction: Direction, rotation: Rotation): Direction {
  const order: readonly Direction[] = ['right', 'up', 'left', 'down'];
  const baseIndex = order.indexOf(direction);
  return order[(baseIndex + rotation / 90) % order.length];
}

export function symbolToSvg(definition: SymbolDefinition): string {
  const paths = definition.paths
    .map((path) => `<polyline points="${path.map(([x, y]) => `${x},${-y}`).join(' ')}"/>`)
    .join('');
  const terminals = definition.terminals
    .map((terminal) => `<circle cx="${terminal.point[0]}" cy="${-terminal.point[1]}" r="0.09"/>`)
    .join('');
  return `<svg viewBox="-1.65 -1.45 3.3 2.9" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="0.105" stroke-linecap="round" stroke-linejoin="round">${paths}</g><g fill="var(--lia-electro-terminal-fill, white)" stroke="currentColor" stroke-width="0.075">${terminals}</g></svg>`;
}
