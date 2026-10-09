import { cloneCircuit, type CircuitDocument } from './model.ts';

export class CircuitHistory {
  private readonly past: CircuitDocument[] = [];
  private readonly future: CircuitDocument[] = [];
  private current: CircuitDocument;
  private readonly limit: number;

  constructor(initial: CircuitDocument, limit = 100) {
    this.current = cloneCircuit(initial);
    this.limit = limit;
  }

  get document(): CircuitDocument {
    return this.current;
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  commit(next: CircuitDocument): boolean {
    if (sameDocument(this.current, next)) return false;
    this.past.push(cloneCircuit(this.current));
    if (this.past.length > this.limit) this.past.shift();
    this.current = cloneCircuit(next);
    this.future.length = 0;
    return true;
  }

  replace(next: CircuitDocument): void {
    this.current = cloneCircuit(next);
    this.past.length = 0;
    this.future.length = 0;
  }

  undo(): CircuitDocument | null {
    const previous = this.past.pop();
    if (!previous) return null;
    this.future.push(cloneCircuit(this.current));
    this.current = previous;
    return this.current;
  }

  redo(): CircuitDocument | null {
    const next = this.future.pop();
    if (!next) return null;
    this.past.push(cloneCircuit(this.current));
    this.current = next;
    return this.current;
  }
}

function sameDocument(left: CircuitDocument, right: CircuitDocument): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
