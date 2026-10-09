import type { ComponentModel, PortReference, WireModel, WireRoute } from './model.ts';
import {
  SYMBOL_BY_ID,
  rotateDirection,
  transformPoint,
  type Direction,
  type Vec2,
} from './symbols.ts';

export interface PortPose {
  point: Vec2;
  direction: Direction;
}

export function resolvePort(
  components: readonly ComponentModel[],
  reference: PortReference,
): PortPose | null {
  const component = components.find((candidate) => candidate.id === reference.componentId);
  if (!component) return null;
  const definition = SYMBOL_BY_ID[component.kind];
  const terminal = definition.terminals.find((candidate) => candidate.id === reference.portId);
  if (!terminal) return null;
  return {
    point: transformPoint(terminal.point, component.at[0], component.at[1], component.rotation),
    direction: rotateDirection(terminal.direction, component.rotation),
  };
}

export function routeWire(
  components: readonly ComponentModel[],
  wire: WireModel,
  stubLength = 0.35,
): Vec2[] {
  const from = resolvePort(components, wire.from);
  const to = resolvePort(components, wire.to);
  if (!from || !to) return [];
  return routeBetweenPorts(from, to, wire.route, stubLength);
}

export function routeBetweenPorts(
  from: PortPose,
  to: PortPose,
  route: WireRoute,
  stubLength = 0.35,
): Vec2[] {
  const startStub = moveInDirection(from.point, from.direction, stubLength);
  const endStub = moveInDirection(to.point, to.direction, stubLength);
  const points: Vec2[] = [from.point, startStub];

  if (!aligned(startStub, endStub)) {
    points.push(
      route === 'horizontal-first'
        ? [endStub[0], startStub[1]]
        : [startStub[0], endStub[1]],
    );
  }

  points.push(endStub, to.point);
  return simplifyOrthogonalRoute(points);
}

export function routeToPoint(
  from: PortPose,
  target: Vec2,
  route: WireRoute,
  stubLength = 0.35,
): Vec2[] {
  const startStub = moveInDirection(from.point, from.direction, stubLength);
  const points: Vec2[] = [from.point, startStub];
  if (!aligned(startStub, target)) {
    points.push(
      route === 'horizontal-first'
        ? [target[0], startStub[1]]
        : [startStub[0], target[1]],
    );
  }
  points.push(target);
  return simplifyOrthogonalRoute(points);
}

export function defaultRouteForDirection(direction: Direction): WireRoute {
  return direction === 'left' || direction === 'right'
    ? 'horizontal-first'
    : 'vertical-first';
}

export function simplifyOrthogonalRoute(input: readonly Vec2[]): Vec2[] {
  const deduplicated: Vec2[] = [];
  input.forEach((point) => {
    const previous = deduplicated[deduplicated.length - 1];
    if (!previous || !samePoint(previous, point)) deduplicated.push([point[0], point[1]]);
  });

  let changed = true;
  while (changed && deduplicated.length > 2) {
    changed = false;
    for (let index = 1; index < deduplicated.length - 1; index += 1) {
      const before = deduplicated[index - 1];
      const current = deduplicated[index];
      const after = deduplicated[index + 1];
      if ((before[0] === current[0] && current[0] === after[0]) ||
          (before[1] === current[1] && current[1] === after[1])) {
        deduplicated.splice(index, 1);
        changed = true;
        break;
      }
    }
  }
  return deduplicated;
}

export function isOrthogonalRoute(points: readonly Vec2[]): boolean {
  return points.length >= 2 && points.slice(1).every((point, index) => {
    const previous = points[index];
    return previous[0] === point[0] || previous[1] === point[1];
  });
}

export function distanceToRouteScreen(
  localX: number,
  localY: number,
  route: readonly Vec2[],
  originX: number,
  originY: number,
  unitX: number,
  unitY: number,
): number {
  let best = Number.POSITIVE_INFINITY;
  for (let index = 1; index < route.length; index += 1) {
    const start = toScreen(route[index - 1], originX, originY, unitX, unitY);
    const end = toScreen(route[index], originX, originY, unitX, unitY);
    best = Math.min(best, distanceToSegment(localX, localY, start, end));
  }
  return best;
}

function moveInDirection(point: Vec2, direction: Direction, distance: number): Vec2 {
  switch (direction) {
    case 'left': return [point[0] - distance, point[1]];
    case 'right': return [point[0] + distance, point[1]];
    case 'up': return [point[0], point[1] + distance];
    case 'down': return [point[0], point[1] - distance];
  }
}

function aligned(left: Vec2, right: Vec2): boolean {
  return Math.abs(left[0] - right[0]) < 1e-10 || Math.abs(left[1] - right[1]) < 1e-10;
}

function samePoint(left: Vec2, right: Vec2): boolean {
  return Math.abs(left[0] - right[0]) < 1e-10 && Math.abs(left[1] - right[1]) < 1e-10;
}

function toScreen(point: Vec2, originX: number, originY: number, unitX: number, unitY: number): Vec2 {
  return [originX + point[0] * unitX, originY - point[1] * unitY];
}

function distanceToSegment(x: number, y: number, start: Vec2, end: Vec2): number {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared < 1e-12) return Math.hypot(x - start[0], y - start[1]);
  const t = Math.max(0, Math.min(1, ((x - start[0]) * dx + (y - start[1]) * dy) / lengthSquared));
  return Math.hypot(x - (start[0] + t * dx), y - (start[1] + t * dy));
}
