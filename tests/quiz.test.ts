import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';

import {
  cloneCircuit,
  createEmptyCircuit,
  type CircuitDocument,
  type ComponentModel,
} from '../src/electro/model.ts';
import {
  CompletionRuleError,
  evaluateCircuitCompletion,
  formatCompletionRule,
  parseCompletionRule,
  type CompletionRule,
} from '../src/electro/quiz.ts';
import {
  buildElectroMacroBlock,
  completionQuizSpecFromMacroElements,
} from '../src/electro/macros.ts';

test('completion rules parse physical units and format deterministically', () => {
  const parsed = parseCompletionRule(
    'board=quiz_1;condition=ammeter-current;component=A1;target=20 mA;' +
    'tolerance=0,5 mA;required=[resistor:1];preserve=1;changed=1',
  );

  assert.equal(parsed.boardId, 'quiz_1');
  assert.equal(parsed.condition, 'ammeter-current');
  assert.equal(parsed.componentId, 'A1');
  assert.equal(parsed.target, 0.02);
  assert.equal(parsed.tolerance, 0.0005);
  assert.equal(parsed.magnitude, true);
  assert.deepEqual([...parsed.requiredAdded], [['resistor', 1]]);
  assert.equal(parsed.preserveBaseline, true);
  assert.equal(parsed.requireChange, true);

  const formatted = formatCompletionRule(parsed);
  assert.equal(
    formatted,
    'quiz_1;condition=ammeter-current;component=A1;target=0.02;' +
    'tolerance=0.0005;required=[resistor:1];preserve=1;changed=1',
  );
  const reparsed = parseCompletionRule(formatted);
  assert.deepEqual(
    { ...reparsed, requiredAdded: [...reparsed.requiredAdded] },
    { ...parsed, requiredAdded: [...parsed.requiredAdded] },
  );
});

test('completion rules reject missing meters, wrong units and negative tolerances', () => {
  assert.throws(
    () => parseCompletionRule('id=quiz;condition=ammeter-current;target=20 mA'),
    CompletionRuleError,
  );
  assert.throws(
    () => parseCompletionRule('id=quiz;condition=ammeter-current;component=A1;target=20 V'),
    CompletionRuleError,
  );
  assert.throws(
    () => parseCompletionRule(
      'id=quiz;condition=ammeter-current;component=A1;target=20 mA;tolerance=-1 mA',
    ),
    CompletionRuleError,
  );
});

test('completion quiz macro declarations are board-scoped, normalized and conflict-safe', () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  const addDeclaration = (spec: string): void => {
    const declaration = dom.window.document.createElement('span');
    declaration.className = 'lia-electro-completion-spec';
    declaration.dataset.spec = spec;
    dom.window.document.body.appendChild(declaration);
  };
  const first =
    'macro_board;condition=ammeter-current;component=A1;target=20 mA;' +
    'tolerance=0.5 mA;required=[resistor:1]';

  addDeclaration('other_board;condition=not-a-condition');
  addDeclaration(first);
  addDeclaration(
    'board=macro_board;condition=ammeter-current;component=A1;target=0.02 A;' +
    'tolerance=0.0005 A;required=[resistor:1];preserve=1;changed=1',
  );

  assert.equal(
    completionQuizSpecFromMacroElements(dom.window.document, 'macro_board'),
    formatCompletionRule(parseCompletionRule(first)),
  );
  assert.equal(
    completionQuizSpecFromMacroElements(dom.window.document, 'missing_board'),
    null,
  );

  addDeclaration(
    'macro_board;condition=ammeter-current;component=A1;target=21 mA;' +
    'tolerance=0.5 mA;required=[resistor:1]',
  );
  assert.throws(
    () => completionQuizSpecFromMacroElements(dom.window.document, 'macro_board'),
    /conflicting completion quiz definitions/,
  );
  dom.window.close();
});

test('macro export emits the localized quiz macro and rewrites its board id', () => {
  const circuit = createEmptyCircuit();
  const completionQuizSpec =
    'source_board;condition=ammeter-current;component=A1;target=20 mA;' +
    'tolerance=0.5 mA;required=[resistor:1]';
  const profile = {
    componentIds: new Set([100, 200, 610]),
    restrictionIds: new Set([120]),
    completionQuizSpec,
  };

  const german = buildElectroMacroBlock(
    circuit,
    'id=source_board',
    'de',
    'target_de',
    profile,
  );
  const germanLines = german.split('\n');
  const germanBoardIndex = germanLines.findIndex((line) => line.startsWith('@ElectroOn('));
  const germanQuizIndex = germanLines.findIndex(
    (line) => line.startsWith('@ElectroErgaenzungsquiz('),
  );
  const germanPrompt = germanLines[germanQuizIndex - 1] || '';
  assert.match(germanLines.at(-1) || '', /^@ElectroErgaenzungsquiz\(/);
  assert.equal(
    germanPrompt,
    'Ergänze die Schaltung. Bedingung: A1 zeigt \\(20\\,\\mathrm{mA}\\) ' +
      '(Toleranz \\(\\pm 0{,}5\\,\\mathrm{mA}\\)). Verwende genau 1 × Widerstand. ' +
      'Die Vorgabe darf nicht elektrisch verändert werden.',
  );
  assert.doesNotMatch(germanPrompt, /A1 zeigt 20 mA/);
  assert.doesNotMatch(germanPrompt, /Toleranz ± 0,5 mA/);
  assert.doesNotMatch(germanPrompt, /^\s*(?:@|#|>|[-*+] |\d+\. |```)/);
  assert.ok(germanBoardIndex >= 0 && germanBoardIndex < germanQuizIndex - 1);
  const germanRule = parseCompletionRule(macroSpec(germanLines.at(-1) || ''));
  assert.equal(germanRule.boardId, 'target_de');
  assert.equal(germanRule.target, 0.02);
  assert.deepEqual([...germanRule.requiredAdded], [['resistor', 1]]);
  assert.doesNotMatch(germanLines.at(-1) || '', /source_board/);

  const english = buildElectroMacroBlock(
    circuit,
    'id=source_board',
    'en',
    'target_en',
    profile,
  );
  const englishLines = english.split('\n');
  const englishBoardIndex = englishLines.findIndex((line) => line.startsWith('@ElectroOn('));
  const englishQuizIndex = englishLines.findIndex(
    (line) => line.startsWith('@ElectroCompletionQuiz('),
  );
  const englishPrompt = englishLines[englishQuizIndex - 1] || '';
  const englishLine = englishLines.at(-1) || '';
  assert.match(englishLine, /^@ElectroCompletionQuiz\(/);
  assert.equal(
    englishPrompt,
    'Complete the circuit. Condition: A1 reads \\(20\\,\\mathrm{mA}\\) ' +
      '(tolerance \\(\\pm 0.5\\,\\mathrm{mA}\\)). Use exactly 1 × Resistor. ' +
      'Do not change the preset circuit electrically.',
  );
  assert.doesNotMatch(englishPrompt, /A1 reads 20 mA/);
  assert.doesNotMatch(englishPrompt, /tolerance ± 0\.5 mA/);
  assert.doesNotMatch(englishPrompt, /^\s*(?:@|#|>|[-*+] |\d+\. |```)/);
  assert.ok(englishBoardIndex >= 0 && englishBoardIndex < englishQuizIndex - 1);
  assert.equal(parseCompletionRule(macroSpec(englishLine)).boardId, 'target_en');
  assert.doesNotMatch(englishLine, /source_board/);
});

test('README declares both completion quiz aliases and the LiaScript checker bridge', () => {
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  assert.match(readme, /^@ElectroCompletionQuiz:/m);
  assert.match(readme, /^@ElectroErgaenzungsquiz:/m);
  assert.match(readme, /^@ElectroCompletionQuiz_$/m);
  assert.match(readme, /class="lia-electro-completion-spec"/);
  assert.match(readme, /data-spec="@1"/);
  assert.match(readme, /\[\[!\]\]/);
  assert.match(readme, /window\.__electro\.checkCompletion/);
  assert.match(readme, /"LIA: wait"/);
});

test('a 6 V series completion with 100 ohm and 200 ohm reaches 20 mA', () => {
  const baseline = seriesBaseline('100 Ω');
  const document = completeSeries(baseline, '200 Ω');
  const result = evaluateCircuitCompletion(document, baseline, ammeterRule());

  assert.equal(result.ok, true);
  assert.equal(result.code, 'success');
  assert.equal(result.componentId, 'A1');
  assert.equal(result.quantity, 'current');
  assert.ok(closeTo(result.actual, 0.02));
});

test('an open completion fails before comparing its target current', () => {
  const baseline = seriesBaseline('100 Ω');
  const document = completeSeries(baseline, '200 Ω');
  document.wires.pop();

  const result = evaluateCircuitCompletion(document, baseline, ammeterRule());
  assert.equal(result.ok, false);
  assert.equal(result.code, 'circuit-open');
});

test('a direct conductive path across the source is diagnosed as a short circuit', () => {
  const baseline = seriesBaseline('100 Ω');
  const document = completeSeries(baseline, '200 Ω');
  connect(document, 'source', 'b', 'source', 'a');

  const result = evaluateCircuitCompletion(document, baseline, ammeterRule());
  assert.equal(result.ok, false);
  assert.equal(result.code, 'short-circuit');
});

test('required counts only include components added to the baseline', () => {
  const baseline = seriesBaseline('100 Ω');
  const document = cloneCircuit(baseline);
  connect(document, 'r1', 'b', 'source', 'a');

  const result = evaluateCircuitCompletion(document, baseline, ammeterRule());
  assert.equal(result.ok, false);
  assert.equal(result.code, 'required-count');
  assert.equal(result.componentKind, 'resistor');
  assert.equal(result.expectedCount, 1);
  assert.equal(result.actualCount, 0);
});

test('a required resistor cannot satisfy the quiz while disconnected', () => {
  const baseline = seriesBaseline('300 Ω');
  const document = cloneCircuit(baseline);
  document.components.push(resistor('r2', '200 Ω', 'editor'));
  connect(document, 'r1', 'b', 'source', 'a');

  const result = evaluateCircuitCompletion(document, baseline, ammeterRule());
  assert.equal(result.ok, false);
  assert.equal(result.code, 'required-component-disconnected');
  assert.equal(result.componentId, 'r2');
});

test('unsupported components fail even when they are the requested addition', () => {
  const baseline = createEmptyCircuit();
  baseline.components.push(source('source', '6 V'));
  const document = cloneCircuit(baseline);
  document.components.push(component('lamp', 'lamp', 'editor'));
  connect(document, 'source', 'b', 'lamp', 'a');
  connect(document, 'lamp', 'b', 'source', 'a');
  const rule = ammeterRule({
    condition: 'closed',
    componentId: undefined,
    target: undefined,
    tolerance: 0,
    requiredAdded: required([['lamp', 1]]),
  });

  const result = evaluateCircuitCompletion(document, baseline, rule);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'unsupported-component');
  assert.equal(result.componentId, 'lamp');
});

test('a required resistor bypassed by a wire cannot satisfy the quiz', () => {
  const baseline = seriesBaseline('300 Ω');
  const document = cloneCircuit(baseline);
  document.components.push(resistor('r2', '200 Ω', 'editor'));
  connect(document, 'r1', 'b', 'source', 'a');
  connect(document, 'r1', 'b', 'r2', 'a');
  connect(document, 'r2', 'b', 'source', 'a');

  const result = evaluateCircuitCompletion(document, baseline, ammeterRule());
  assert.equal(result.ok, false);
  assert.equal(result.code, 'required-component-bypassed');
  assert.equal(result.componentId, 'r2');
});

test('the target applies to the exact named ammeter, not any matching meter', () => {
  const document = createEmptyCircuit();
  document.components.push(
    source('source', '6 V'),
    component('A1', 'ammeter'),
    component('A2', 'ammeter'),
    resistor('r1', '600 Ω'),
    resistor('r2', '300 Ω'),
  );
  connect(document, 'source', 'b', 'A1', 'a');
  connect(document, 'A1', 'b', 'r1', 'a');
  connect(document, 'r1', 'b', 'source', 'a');
  connect(document, 'source', 'b', 'A2', 'a');
  connect(document, 'A2', 'b', 'r2', 'a');
  connect(document, 'r2', 'b', 'source', 'a');
  const baseline = cloneCircuit(document);
  const rule = ammeterRule({
    requiredAdded: required([]),
    requireChange: false,
  });

  const result = evaluateCircuitCompletion(document, baseline, rule);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'target-mismatch');
  assert.equal(result.componentId, 'A1');
  assert.ok(closeTo(result.actual, 0.01));
  assert.ok(closeTo(result.expected, 0.02));
});

test('target tolerance is inclusive and rejects values just outside it', () => {
  const baseline = seriesBaseline('100 Ω');
  const document = completeSeries(baseline, '200 Ω');

  const boundary = evaluateCircuitCompletion(document, baseline, ammeterRule({
    target: 0.0205,
    tolerance: 0.0005,
  }));
  assert.equal(boundary.ok, true);
  assert.equal(boundary.code, 'success');

  const outside = evaluateCircuitCompletion(document, baseline, ammeterRule({
    target: 0.02051,
    tolerance: 0.0005,
  }));
  assert.equal(outside.ok, false);
  assert.equal(outside.code, 'target-mismatch');
  assert.ok(closeTo(outside.actual, 0.02));
});

test('electrical changes to preset components invalidate the completion', () => {
  const baseline = seriesBaseline('100 Ω');
  const document = completeSeries(baseline, '200 Ω');
  const preset = document.components.find((candidate) => candidate.id === 'r1');
  assert.ok(preset);
  preset.value = '150 Ω';

  const result = evaluateCircuitCompletion(document, baseline, ammeterRule());
  assert.equal(result.ok, false);
  assert.equal(result.code, 'baseline-component-changed');
  assert.equal(result.componentId, 'r1');
});

function seriesBaseline(resistance: string): CircuitDocument {
  const document = createEmptyCircuit();
  document.components.push(
    source('source', '6 V'),
    component('A1', 'ammeter'),
    resistor('r1', resistance),
  );
  connect(document, 'source', 'b', 'A1', 'a');
  connect(document, 'A1', 'b', 'r1', 'a');
  return document;
}

function completeSeries(baseline: CircuitDocument, resistance: string): CircuitDocument {
  const document = cloneCircuit(baseline);
  document.components.push(resistor('r2', resistance, 'editor'));
  connect(document, 'r1', 'b', 'r2', 'a');
  connect(document, 'r2', 'b', 'source', 'a');
  return document;
}

function ammeterRule(overrides: Partial<CompletionRule> = {}): CompletionRule {
  return {
    boardId: 'completion',
    condition: 'ammeter-current',
    componentId: 'A1',
    target: 0.02,
    tolerance: 0.0005,
    magnitude: true,
    requiredAdded: required([['resistor', 1]]),
    preserveBaseline: true,
    requireChange: true,
    ...overrides,
  };
}

function required(
  entries: Array<[ComponentModel['kind'], number]>,
): ReadonlyMap<ComponentModel['kind'], number> {
  return new Map(entries);
}

function source(id: string, value: string): ComponentModel {
  return { ...component(id, 'battery'), value };
}

function resistor(
  id: string,
  value: string,
  origin: ComponentModel['origin'] = 'macro',
): ComponentModel {
  return { ...component(id, 'resistor', origin), value };
}

function component(
  id: string,
  kind: ComponentModel['kind'],
  origin: ComponentModel['origin'] = 'macro',
): ComponentModel {
  return { id, kind, at: [0, 0], rotation: 0, origin };
}

function connect(
  document: CircuitDocument,
  fromComponent: string,
  fromPort: string,
  toComponent: string,
  toPort: string,
): void {
  document.wires.push({
    id: `w_${String(document.wires.length + 1).padStart(4, '0')}`,
    from: { componentId: fromComponent, portId: fromPort },
    to: { componentId: toComponent, portId: toPort },
    route: 'horizontal-first',
  });
}

function closeTo(actual: number | undefined, expected: number, tolerance = 1e-9): boolean {
  return actual != null && Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected));
}

function macroSpec(line: string): string {
  const tick = String.fromCharCode(96);
  const start = line.indexOf(tick);
  const end = line.lastIndexOf(tick);
  assert.ok(start >= 0 && end > start, 'missing macro code span: ' + line);
  return line.slice(start + 1, end);
}
