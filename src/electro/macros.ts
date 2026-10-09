import {
  ELECTRO_KNOWN_COMPONENT_IDS,
  canonicalElectroIds,
  canonicalElectroRestrictionIds,
  formatElectroIdSelection,
  parseElectroSpec,
  splitElectroSpec,
  type ElectroExportProfile,
} from './config.ts';
import {
  createEmptyCircuit,
  type CircuitDocument,
  type CircuitSettings,
  type ComponentModel,
  type WireModel,
} from './model.ts';
import { parseCompletionRule, rewriteCompletionBoardId } from './quiz.ts';
import { CircuitFormatError, validateCircuit } from './serialization.ts';
import { isSymbolId, SYMBOL_BY_ID, type Rotation, type SymbolId } from './symbols.ts';

export type MacroLanguage = 'de' | 'en';

export const COMPONENT_MACRO_NAMES: Readonly<Record<SymbolId, Readonly<Record<MacroLanguage, string>>>> = {
  battery: { de: 'ElectroBatterie', en: 'ElectroBattery' },
  resistor: { de: 'ElectroWiderstand', en: 'ElectroResistor' },
  'variable-resistor': { de: 'ElectroRegelbarerWiderstand', en: 'ElectroVariableResistor' },
  capacitor: { de: 'ElectroKondensator', en: 'ElectroCapacitor' },
  inductor: { de: 'ElectroSpule', en: 'ElectroInductor' },
  'iron-core-inductor': { de: 'ElectroSpuleMitEisenkern', en: 'ElectroIronCoreInductor' },
  voltmeter: { de: 'ElectroVoltmeter', en: 'ElectroVoltmeter' },
  ammeter: { de: 'ElectroAmperemeter', en: 'ElectroAmmeter' },
  motor: { de: 'ElectroMotor', en: 'ElectroMotor' },
  lamp: { de: 'ElectroLampe', en: 'ElectroLamp' },
  diode: { de: 'ElectroDiode', en: 'ElectroDiode' },
  photodiode: { de: 'ElectroPhotodiode', en: 'ElectroPhotodiode' },
  led: { de: 'ElectroLED', en: 'ElectroLED' },
  'voltage-source': { de: 'ElectroSpannungsquelle', en: 'ElectroVoltageSource' },
  switch: { de: 'ElectroSchalter', en: 'ElectroSwitch' },
  'changeover-switch': { de: 'ElectroUmschalter', en: 'ElectroChangeoverSwitch' },
  ground: { de: 'ElectroErde', en: 'ElectroGround' },
  antenna: { de: 'ElectroAntenne', en: 'ElectroAntenna' },
  transistor: { de: 'ElectroTransistor', en: 'ElectroTransistor' },
  transformer: { de: 'ElectroTransformator', en: 'ElectroTransformer' },
};

const ID_PATTERN = /^[A-Za-z0-9_-]{1,80}$/;
const COMPONENT_SELECTOR = '.lia-electro-component-spec[data-kind][data-spec]';
const WIRE_SELECTOR = '.lia-electro-wire-spec[data-spec]';
const COMPLETION_QUIZ_SELECTOR = '.lia-electro-completion-spec[data-spec]';

export function buildElectroMacroBlock(
  circuit: CircuitDocument,
  sourceSpec: string,
  language: MacroLanguage,
  targetBoardId = randomMacroBoardId(),
  profile?: ElectroExportProfile,
): string {
  const normalized = validateCircuit(circuit);
  const boardId = validMacroId(targetBoardId, 'export board id');
  const boardSpec = rewriteBoardSpec(sourceSpec, boardId, normalized.settings);
  const exportProfile = resolveExportProfile(sourceSpec, profile);
  const electroSpec = buildElectroSpec(boardSpec, exportProfile);
  const coordinateMacro = language === 'de' ? 'Koordinatensystem' : 'CoordinateSystem';
  const wireMacro = language === 'de' ? 'ElectroKabel' : 'ElectroWire';
  const lines = [macroCall(coordinateMacro, boardSpec)];

  normalized.components.forEach((component) => {
    lines.push(macroCall(
      COMPONENT_MACRO_NAMES[component.kind][language],
      componentMacroSpec(boardId, component),
    ));
  });
  normalized.wires.forEach((wire) => {
    lines.push(macroCall(wireMacro, wireMacroSpec(boardId, wire)));
  });
  lines.push(macroCall('ElectroOn', electroSpec));
  if (exportProfile.completionQuizSpec) {
    const quizSpec = rewriteCompletionBoardId(exportProfile.completionQuizSpec, boardId);
    lines.push('', completionQuizPrompt(quizSpec, language));
    lines.push(macroCall(
      language === 'de' ? 'ElectroErgaenzungsquiz' : 'ElectroCompletionQuiz',
      quizSpec,
    ));
  }
  return lines.join('\n');
}

export function circuitFromMacroElements(
  root: ParentNode,
  boardId: string,
  settings: Partial<CircuitSettings> = {},
): CircuitDocument | null {
  const componentById = new Map<string, ComponentModel>();
  const wireById = new Map<string, WireModel>();
  let matched = false;

  root.querySelectorAll<HTMLElement>(COMPONENT_SELECTOR).forEach((element) => {
    const spec = element.dataset.spec || '';
    if (macroBoardId(spec) !== boardId) return;
    matched = true;
    const parsed = parseComponentMacro(element.dataset.kind, spec);
    addUniqueMacroEntity(componentById, parsed.component.id, parsed.component, 'component');
  });
  root.querySelectorAll<HTMLElement>(WIRE_SELECTOR).forEach((element) => {
    const spec = element.dataset.spec || '';
    if (macroBoardId(spec) !== boardId) return;
    matched = true;
    const parsed = parseWireMacro(spec);
    addUniqueMacroEntity(wireById, parsed.wire.id, parsed.wire, 'wire');
  });

  if (!matched) return null;
  const circuit = createEmptyCircuit(settings);
  circuit.components = Array.from(componentById.values());
  circuit.wires = Array.from(wireById.values());
  return validateCircuit(circuit);
}

export function completionQuizSpecFromMacroElements(
  root: ParentNode,
  boardId: string,
): string | null {
  let result: string | null = null;
  root.querySelectorAll<HTMLElement>(COMPLETION_QUIZ_SELECTOR).forEach((element) => {
    const spec = String(element.dataset.spec || '').trim();
    const positionalBoardId = macroBoardId(spec);
    if (ID_PATTERN.test(positionalBoardId) && positionalBoardId !== boardId) return;
    const rule = parseCompletionRule(spec);
    if (rule.boardId !== boardId) return;
    const normalized = rewriteCompletionBoardId(spec, boardId);
    if (result != null && result !== normalized) {
      macroFail(`board ${boardId} has conflicting completion quiz definitions`);
    }
    result = normalized;
  });
  return result;
}

export function parseComponentMacro(
  kindValue: unknown,
  spec: string,
): { boardId: string; component: ComponentModel } {
  if (!isSymbolId(kindValue)) macroFail(`unknown component kind: ${String(kindValue)}`);
  const fields = String(spec || '').split(';');
  if (fields.length < 5 || fields.length > 9) {
    macroFail('component needs board;id;x;y;rotation[;name;value;showMeasurement;locked]');
  }
  const boardId = validMacroId(fields[0], 'component board id');
  const id = validMacroId(fields[1], 'component id');
  const x = finiteMacroNumber(fields[2], 'component x');
  const y = finiteMacroNumber(fields[3], 'component y');
  const rotation = macroRotation(fields[4]);
  const name = decodeMacroText(fields[5] || '');
  const value = decodeMacroText(fields[6] || '');
  const visibility = String(fields[7] || '').trim();
  if (visibility && visibility !== '0' && visibility !== '1') {
    macroFail('showMeasurement must be 0, 1 or empty');
  }
  if (visibility && kindValue !== 'ammeter' && kindValue !== 'voltmeter') {
    macroFail('showMeasurement is only valid for ammeters and voltmeters');
  }
  const locked = String(fields[8] || '').trim();
  if (locked && locked !== '0' && locked !== '1') {
    macroFail('locked must be 0, 1 or empty');
  }
  const component: ComponentModel = {
    id,
    kind: kindValue,
    at: [x, y],
    rotation,
    ...(name ? { name } : {}),
    ...(value ? { value } : {}),
    ...(visibility === '0' ? { showMeasurement: false } : {}),
    ...(locked === '1' ? { locked: true } : {}),
    origin: 'macro',
  };
  return { boardId, component };
}

export function parseWireMacro(spec: string): { boardId: string; wire: WireModel } {
  const fields = String(spec || '').split(';');
  if (fields.length !== 7) {
    macroFail('wire needs board;id;fromComponent;fromPort;toComponent;toPort;route');
  }
  const boardId = validMacroId(fields[0], 'wire board id');
  const id = validMacroId(fields[1], 'wire id');
  const fromComponent = validMacroId(fields[2], 'wire from component');
  const fromPort = validMacroId(fields[3], 'wire from port');
  const toComponent = validMacroId(fields[4], 'wire to component');
  const toPort = validMacroId(fields[5], 'wire to port');
  const route = String(fields[6] || '').trim();
  if (route !== 'horizontal-first' && route !== 'vertical-first') {
    macroFail('wire route must be horizontal-first or vertical-first');
  }
  return {
    boardId,
    wire: {
      id,
      from: { componentId: fromComponent, portId: fromPort },
      to: { componentId: toComponent, portId: toPort },
      route,
    },
  };
}

function componentMacroSpec(boardId: string, component: ComponentModel): string {
  const fields = [
    boardId,
    component.id,
    formatMacroNumber(component.at[0]),
    formatMacroNumber(component.at[1]),
    String(component.rotation),
    encodeMacroText(component.name || ''),
    encodeMacroText(component.value || ''),
  ];
  const isMeter = component.kind === 'ammeter' || component.kind === 'voltmeter';
  if (isMeter) {
    fields.push(component.showMeasurement === false ? '0' : '1');
  }
  if (component.locked === true) {
    if (!isMeter) fields.push('');
    fields.push('1');
  }
  return fields.join(';');
}

function wireMacroSpec(boardId: string, wire: WireModel): string {
  return [
    boardId,
    wire.id,
    wire.from.componentId,
    wire.from.portId,
    wire.to.componentId,
    wire.to.portId,
    wire.route,
  ].join(';');
}

function rewriteBoardSpec(
  sourceSpec: string,
  boardId: string,
  settings: CircuitSettings,
): string {
  const sourceBoardId = parseElectroSpec(sourceSpec).boardId;
  const result: string[] = [];
  splitElectroSpec(sourceSpec).forEach((rawToken) => {
    const token = rawToken.trim();
    if (!token) return;
    const separator = token.indexOf('=');
    if (separator > 0) {
      const key = token.slice(0, separator).trim().toLowerCase();
      if (
        key === 'id' || key === 'board' || key === 'snap' || key === 'raster' || key === 'stub' ||
        key === 'components' || key === 'restrictions'
      ) return;
    } else if (token === sourceBoardId) {
      return;
    }
    result.push(replaceBackticks(token));
  });
  result.push(
    `id=${boardId}`,
    `snap=${formatMacroNumber(settings.snapStep)}`,
    `stub=${formatMacroNumber(settings.wireStub)}`,
  );
  return result.join(';');
}

function resolveExportProfile(
  sourceSpec: string,
  profile?: ElectroExportProfile,
): ElectroExportProfile {
  const config = parseElectroSpec(sourceSpec);
  const componentIds = profile
    ? canonicalElectroIds(profile.componentIds)
    : canonicalElectroIds(config.componentIds || ELECTRO_KNOWN_COMPONENT_IDS);
  const restrictionIds = canonicalElectroRestrictionIds(
    profile ? profile.restrictionIds : config.restrictionIds,
  );
  const completionQuizSpec = String(profile?.completionQuizSpec || '').trim();
  return {
    componentIds: new Set(componentIds),
    restrictionIds: new Set(restrictionIds),
    ...(completionQuizSpec ? { completionQuizSpec } : {}),
  };
}

function buildElectroSpec(boardSpec: string, profile: ElectroExportProfile): string {
  const parts = [
    boardSpec,
    `components=${formatElectroIdSelection(profile.componentIds)}`,
  ];
  const restrictionIds = canonicalElectroRestrictionIds(profile.restrictionIds);
  if (restrictionIds.length) {
    parts.push(`restrictions=${formatElectroIdSelection(restrictionIds)}`);
  }
  return parts.join(';');
}

function completionQuizPrompt(spec: string, language: MacroLanguage): string {
  const rule = parseCompletionRule(spec);
  const required = [...rule.requiredAdded]
    .map(([kind, count]) => `${count} \u00d7 ${SYMBOL_BY_ID[kind].label[language]}`)
    .join(', ');
  const additions = required
    ? (language === 'de' ? ` Verwende genau ${required}.` : ` Use exactly ${required}.`)
    : '';
  const preserve = rule.preserveBaseline
    ? (language === 'de' ? ' Die Vorgabe darf nicht elektrisch ver\u00e4ndert werden.' : ' Do not change the preset circuit electrically.')
    : '';
  const direction = !rule.magnitude &&
    (rule.condition === 'ammeter-current' || rule.condition === 'voltmeter-voltage')
    ? (language === 'de'
      ? ' Das Vorzeichen folgt der Anschlussrichtung des Messger\u00e4ts.'
      : ' The sign follows the meter terminal direction.')
    : '';
  let condition: string;
  if (rule.condition === 'closed') {
    condition = language === 'de'
      ? 'Erg\u00e4nze die Schaltung zu einem geschlossenen Stromkreis.'
      : 'Complete the circuit so that it is closed.';
  } else {
    const quantity = rule.condition === 'equivalent-resistance'
      ? 'resistance'
      : rule.condition === 'voltmeter-voltage'
        ? 'voltage'
        : 'current';
    const target = promptQuantity(rule.target || 0, quantity, language);
    const tolerance = promptQuantity(rule.tolerance, quantity, language, true);
    const targetText = rule.condition === 'ammeter-current'
      ? (language === 'de' ? `${rule.componentId} zeigt ${target}` : `${rule.componentId} reads ${target}`)
      : rule.condition === 'voltmeter-voltage'
        ? (language === 'de' ? `${rule.componentId} zeigt ${target}` : `${rule.componentId} reads ${target}`)
        : rule.condition === 'total-current'
          ? (language === 'de' ? `Der Gesamtstrom betr\u00e4gt ${target}` : `The total current is ${target}`)
          : (language === 'de' ? `Der Ersatzwiderstand betr\u00e4gt ${target}` : `The equivalent resistance is ${target}`);
    condition = language === 'de'
      ? `Erg\u00e4nze die Schaltung. Bedingung: ${targetText} (Toleranz ${tolerance}).`
      : `Complete the circuit. Condition: ${targetText} (tolerance ${tolerance}).`;
  }
  return `${condition}${additions}${preserve}${direction}`;
}

function promptQuantity(
  value: number,
  quantity: 'current' | 'voltage' | 'resistance',
  language: MacroLanguage,
  plusMinus = false,
): string {
  const absolute = Math.abs(value);
  let scaled = value;
  let unit = quantity === 'current'
    ? '\\mathrm{A}'
    : quantity === 'voltage'
      ? '\\mathrm{V}'
      : '\\Omega';
  if (quantity === 'current' && absolute > 0 && absolute < 1) {
    scaled = value * 1e3;
    unit = '\\mathrm{mA}';
  } else if (quantity === 'voltage' && absolute > 0 && absolute < 1) {
    scaled = value * 1e3;
    unit = '\\mathrm{mV}';
  } else if (quantity === 'resistance' && absolute >= 1e3) {
    scaled = value / 1e3;
    unit = '\\mathrm{k}\\Omega';
  }
  const rawNumber = String(Number(scaled.toPrecision(8)));
  const number = language === 'de' ? rawNumber.replace('.', '{,}') : rawNumber;
  return `\\(${plusMinus ? '\\pm ' : ''}${number}\\,${unit}\\)`;
}

function macroCall(name: string, spec: string): string {
  const tick = String.fromCharCode(96);
  return `@${name}(${tick}${replaceBackticks(spec)}${tick})`;
}

function encodeMacroText(value: string): string {
  if (!value) return '';
  const forbidden = new Set([
    ';', String.fromCharCode(96), String.fromCharCode(34), '&', '<', '>',
    String.fromCharCode(13), String.fromCharCode(10),
  ]);
  if (!value.startsWith('~') && !Array.from(value).some((character) => forbidden.has(character))) {
    return value;
  }
  return `~${encodeURIComponent(value)}`;
}

function decodeMacroText(value: string): string {
  if (!value.startsWith('~')) return value;
  try {
    return decodeURIComponent(value.slice(1));
  } catch (error) {
    macroFail('component text contains invalid percent encoding');
  }
}

function macroBoardId(spec: string): string {
  return String(spec || '').split(';', 1)[0].trim();
}

function addUniqueMacroEntity<T>(
  target: Map<string, T>,
  id: string,
  value: T,
  label: string,
): void {
  const existing = target.get(id);
  if (!existing) {
    target.set(id, value);
    return;
  }
  if (JSON.stringify(existing) !== JSON.stringify(value)) {
    macroFail(`${label} id ${id} has conflicting macro definitions`);
  }
}

function validMacroId(value: unknown, label: string): string {
  const text = String(value || '').trim();
  if (!ID_PATTERN.test(text)) macroFail(`${label} must match ${ID_PATTERN}`);
  return text;
}

function finiteMacroNumber(value: unknown, label: string): number {
  const number = Number(String(value ?? '').trim().replace(',', '.'));
  if (!Number.isFinite(number)) macroFail(`${label} must be a finite number`);
  return Object.is(number, -0) ? 0 : number;
}

function macroRotation(value: unknown): Rotation {
  const number = finiteMacroNumber(value, 'component rotation');
  if (number !== 0 && number !== 90 && number !== 180 && number !== 270) {
    macroFail('component rotation must be 0, 90, 180 or 270');
  }
  return number;
}

function formatMacroNumber(value: unknown): string {
  const parsed = Number(value);
  const number = Number.isFinite(parsed) ? parsed : 0;
  const rounded = Math.round(number * 1e9) / 1e9;
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

function replaceBackticks(value: unknown): string {
  return String(value == null ? '' : value)
    .split(String.fromCharCode(96))
    .join(String.fromCharCode(39));
}

function randomMacroBoardId(): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const characters = `${letters}0123456789`;
  const values = new Uint32Array(8);
  try {
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(values);
    } else {
      fillRandomValues(values);
    }
  } catch (error) {
    fillRandomValues(values);
  }
  let suffix = letters[values[0] % letters.length];
  for (let index = 1; index < values.length; index += 1) {
    suffix += characters[values[index] % characters.length];
  }
  return `electro_${suffix}`;
}

function fillRandomValues(values: Uint32Array): void {
  for (let index = 0; index < values.length; index += 1) {
    values[index] = Math.floor(Math.random() * 0xffffffff);
  }
}

function macroFail(message: string): never {
  throw new CircuitFormatError(`Electro macro: ${message}`);
}
