import {
  ELECTRO_COMPONENT_CAPABILITIES,
  ELECTRO_RESTRICTIONS,
  hasElectroRestriction,
  isComponentAllowed,
  parseElectroSpec,
  resolveLanguage,
  type ElectroConfig,
  type ElectroExportProfile,
} from './config.ts';
import { CircuitHistory } from './history.ts';
import { renderComponentLabel } from './labels.ts';
import { buildElectroMacroBlock } from './macros.ts';
import {
  analyzeDcCircuit,
  type DcAnalysis,
  type DcAnalysisStatus,
  type DcComponentResult,
} from './physics.ts';
import {
  evaluateCircuitCompletion,
  formatCompletionRule,
  parseCompletionRule,
  type CompletionCondition,
  type CompletionResult,
  type CompletionRule,
} from './quiz.ts';
import {
  cloneCircuit,
  createEmptyCircuit,
  nextEntityId,
  samePort,
  snapPoint,
  type CircuitDocument,
  type ComponentModel,
  type PortReference,
  type WireModel,
  type WireRoute,
} from './model.ts';
import {
  defaultRouteForDirection,
  distanceToRouteScreen,
  resolvePort,
  routeToPoint,
  routeWire,
} from './routing.ts';
import {
  MAX_COMPONENT_TEXT_LENGTH,
  parseCircuitJSON,
  stringifyCircuit,
  validateCircuit,
} from './serialization.ts';
import {
  normalizeRotation,
  rotateVector,
  SYMBOL_BY_ID,
  SYMBOLS,
  symbolToSvg,
  transformPoint,
  type SymbolId,
  type Vec2,
} from './symbols.ts';
import { ensureElectroStyles } from './styles.ts';
import { resolveElectroTheme, type ElectroTheme } from './theme.ts';

type Language = 'de' | 'en';
type ToolMode = 'select' | 'wire' | 'place';
type Selection = { type: 'component' | 'wire'; id: string } | null;
type ExportDialogStep = 'components' | 'quiz' | 'macro';

const EXPORT_COMPONENT_GROUPS: readonly {
  id: 'sources' | 'passive' | 'semiconductors' | 'switches' | 'loads' | 'meters' | 'other';
  kinds: readonly SymbolId[];
}[] = [
  { id: 'sources', kinds: ['battery', 'voltage-source'] },
  { id: 'passive', kinds: ['resistor', 'variable-resistor', 'capacitor', 'inductor', 'iron-core-inductor'] },
  { id: 'semiconductors', kinds: ['diode', 'photodiode', 'led', 'transistor'] },
  { id: 'switches', kinds: ['switch', 'changeover-switch'] },
  { id: 'loads', kinds: ['lamp', 'motor'] },
  { id: 'meters', kinds: ['voltmeter', 'ammeter'] },
  { id: 'other', kinds: ['ground', 'antenna', 'transformer'] },
];

const COMPLETION_CONDITIONS: readonly CompletionCondition[] = [
  'closed',
  'ammeter-current',
  'voltmeter-voltage',
  'total-current',
  'equivalent-resistance',
];

const COMPLETION_REQUIRED_KINDS: readonly SymbolId[] = [
  'battery',
  'voltage-source',
  'resistor',
  'variable-resistor',
  'ammeter',
  'voltmeter',
  'ground',
];

const COMPONENT_STROKE_WIDTH = 3;
const COMPONENT_SELECTED_STROKE_WIDTH = 3.4;
const COMPONENT_HIGHLIGHT_STROKE_WIDTH = 4.2;
const WIRE_STROKE_WIDTH = 2.6;
const WIRE_SELECTED_STROKE_WIDTH = 3.8;
const COMPONENT_LABEL_GAP_PX = 12;
const OBJECT_LIST_WIDTH_PX = 170;
const PROPERTIES_WIDTH_PX = 190;

interface ComponentLabelPlacement {
  point: Vec2;
  anchorX: 'left' | 'middle' | 'right';
  anchorY: 'top' | 'middle' | 'bottom';
}

interface ComponentRender {
  kind: SymbolId;
  curve: any;
  selection: any;
  terminals: any[];
  labels: any[];
}

interface WireRender {
  curve: any;
}

interface DragState {
  componentId: string;
  pointerId: number;
  offset: Vec2;
}

interface PendingWire {
  from: PortReference;
  route: WireRoute;
}

interface LocalPointer {
  localX: number;
  localY: number;
  user: Vec2;
}

const TEXT = {
  de: {
    components: 'Bauteile',
    select: 'Auswählen und verschieben (V)',
    wire: 'Kabel zeichnen (W)',
    rotate: 'Auswahl um 90° drehen (R)',
    properties: 'Bauteileigenschaften bearbeiten',
    remove: 'Auswahl löschen (Entf)',
    undo: 'Rückgängig (Strg+Z)',
    redo: 'Wiederholen (Strg+Y)',
    exchange: 'Schaltung als LiaScript-Makros exportieren',
    objectList: 'Objektliste',
    closeObjectList: 'Objektliste schließen',
    noObjects: 'Noch keine Bauteile oder Kabel.',
    wireType: 'Kabel',
    wireName: (index: number) => `Kabel ${index}`,
    export: 'Export',
    download: 'Makroblock herunterladen',
    downloaded: (filename: string) => `${filename} wurde exportiert.`,
    downloadFailed: 'Der Makro-Download ist in diesem Browser nicht verfügbar.',
    readingHidden: 'Messwert ausgeblendet',
    clear: 'Schaltung leeren',
    clearBaseline: 'Ergänzungen zurücksetzen',
    selectStatus: 'Bauteil oder Kabel auswählen. Bauteile lassen sich ziehen.',
    wireStatus: 'Ersten Anschluss anklicken.',
    wireEndStatus: 'Zweiten Anschluss anklicken. Leertaste wechselt die Kabelroute.',
    placeStatus: (name: string) => `${name} im Raster platzieren.`,
    emptyStatus: 'Hier gibt es noch nichts zu löschen.',
    noAdditions: 'Die vorgegebene Schaltung enthält keine Ergänzungen.',
    selectedComponent: (name: string) => `${name} ausgewählt. Ziehen, R zum Drehen, Entf zum Löschen; Rechtsklick für Eigenschaften.`,
    selectedLockedComponent: (name: string) => `${name} ausgewählt und fixiert. Rechtsklick öffnet die Eigenschaften; Entf löscht das Bauteil.`,
    selectedProtectedComponent: (name: string) => `${name} ist vorgegeben und vollständig geschützt.`,
    selectedWire: 'Kabel ausgewählt. R wechselt die rechtwinklige Route.',
    selectedProtectedWire: 'Dieses vorgegebene Kabel ist vollständig geschützt.',
    samePort: 'Ein Kabel benötigt zwei verschiedene Anschlüsse.',
    duplicateWire: 'Diese beiden Anschlüsse sind bereits verbunden.',
    propertiesTitle: 'Bauteileigenschaften',
    componentType: (name: string) => name,
    nameLabel: 'Name',
    valueLabel: 'Wert',
    valuePlaceholder: 'z. B. 220 Ω',
    showMeasurement: 'Messwert am Symbol anzeigen',
    lockComponent: 'Fixieren',
    locked: 'fixiert',
    protected: 'vorgegeben',
    componentLocked: (name: string) => `${name} fixiert.`,
    componentUnlocked: (name: string) => `Fixierung für ${name} aufgehoben.`,
    sourceValueLabel: 'Quellspannung U',
    sourceValuePlaceholder: 'z. B. 9 V',
    resistanceValueLabel: 'Widerstand R',
    resistanceValuePlaceholder: 'z. B. 220 Ω oder 4,7 kΩ',
    closeProperties: 'Eigenschaften schließen',
    propertiesSaved: (name: string) => `Eigenschaften für ${name} gespeichert.`,
    physicsTitle: 'Gleichstromanalyse',
    physicsSolved: 'Geschlossener Stromkreis',
    physicsOpen: 'Offener Stromkreis: Es fehlt ein leitender Rückweg.',
    physicsShort: 'Kurzschluss: Die Spannungsquelle ist ohne Widerstand überbrückt.',
    physicsNoSource: 'Keine Gleichspannungsquelle vorhanden.',
    physicsNotConnected: 'Das Bauteil gehört zu keinem gespeisten Stromkreis.',
    physicsIncomplete: (name: string) => `Für ${name} fehlt ein gültiger elektrischer Wert.`,
    physicsUnsupported: (name: string) => `${name} wird in der DC-Analyse noch nicht unterstützt.`,
    physicsInvalid: 'Das elektrische Netz ist nicht eindeutig lösbar.',
    totalVoltage: 'Gesamtspannung U',
    totalResistance: 'Gesamtwiderstand Rges',
    totalCurrent: 'Gesamtstrom I',
    componentVoltage: 'Spannung U',
    componentCurrent: 'Strom I',
    deliveredCurrent: 'Abgegebener Strom I',
    componentPower: 'Leistung P',
    exportComponentsTitle: 'Bauteile f\u00fcr den Import ausw\u00e4hlen',
    exportComponentsHint: 'Nur gr\u00fcn markierte Bauteile k\u00f6nnen im importierten Electro neu platziert werden. Bereits eingebaute Bauteile bleiben erhalten.',
    exportRestrictionsTitle: 'Einschr\u00e4nkungen im importierten Electro',
    restrictAllProperties: 'Bauteileigenschaften vollst\u00e4ndig sperren (Rechtsklick)',
    restrictMacroProperties: 'Bauteileigenschaften nur f\u00fcr per Makro eingebaute Bauteile sperren',
    restrictMeasurements: '\u00c4ndern und Anzeigen von Messwerten sperren',
    restrictExport: 'Export in der Objektliste sperren',
    exportQuizTitle: 'Erg\u00e4nzungsaufgabe festlegen',
    exportQuizHint: 'Optional wird aus der Schaltung ein automatisch gepr\u00fcftes LiaScript-Quiz. Gepr\u00fcft werden die elektrische Verbindung, die geforderten Erg\u00e4nzungen und der Sollwert.',
    quizEnable: 'Erg\u00e4nzungsquiz exportieren',
    quizCondition: 'Bedingung',
    quizConditions: {
      closed: 'Stromkreis ist geschlossen',
      'ammeter-current': 'Amperemeter erreicht Sollstrom',
      'voltmeter-voltage': 'Voltmeter erreicht Sollspannung',
      'total-current': 'Gesamtstrom erreicht Sollwert',
      'equivalent-resistance': 'Ersatzwiderstand erreicht Sollwert',
    },
    quizMeter: 'Ziel-Messger\u00e4t',
    quizNoMeter: 'Kein passendes Messger\u00e4t in der Schaltung',
    quizTarget: 'Sollwert mit Einheit',
    quizTolerance: 'Toleranz mit Einheit',
    quizMagnitude: 'Betrag statt Anschlussrichtung vergleichen',
    quizRequiredTitle: 'Exakt geforderte neue Bauteile',
    quizRequiredHint: 'Ohne Auswahl sind beliebige unterst\u00fctzte Erg\u00e4nzungen erlaubt.',
    quizCount: 'Anzahl',
    quizPreserve: 'Elektrische Vorgabe muss erhalten bleiben',
    quizChanged: 'Unver\u00e4nderte Abgabe nicht akzeptieren',
    quizInvalid: 'Die Aufgabenbedingung ist noch nicht vollst\u00e4ndig oder enth\u00e4lt einen ung\u00fcltigen Wert.',
    quizMeterMissing: 'F\u00fcr diese Bedingung wird ein passendes Messger\u00e4t ben\u00f6tigt.',
    quizUnsupported: (name: string) => `${name} wird in automatisch gepr\u00fcften Gleichstromaufgaben noch nicht unterst\u00fctzt.`,
    restrictBaseline: 'Vorgegebene Bauteile und Kabel vollständig schützen',
    propertiesRestricted: 'Die Eigenschaften dieses Bauteils sind gesperrt.',
    protectedObject: 'Dieses vorgegebene Objekt ist vollständig geschützt.',
    exportGroups: {
      sources: 'Quellen',
      passive: 'Passive Bauteile',
      semiconductors: 'Halbleiter',
      switches: 'Schalter',
      loads: 'Verbraucher',
      meters: 'Messger\u00e4te',
      other: 'Weitere Bauteile',
    },
    available: 'verf\u00fcgbar',
    unavailable: 'nicht verf\u00fcgbar',
    dialogTitle: 'Als LiaScript-Makros exportieren',
    dialogHelp: 'Kopiere diesen Block in eine LiaScript-Datei. Jedes Bauteil und jedes Kabel wird als eigenes Makro ausgegeben.',
    next: 'Weiter',
    back: 'Zur\u00fcck',
    copy: 'Kopieren',
    close: 'Schließen',
    copied: 'Makroblock wurde kopiert.',
    copyFailed: 'Kopieren nicht möglich; bitte den Text manuell markieren.',
    clearConfirm: 'Wirklich alle Bauteile und Kabel entfernen?',
    clearBaselineConfirm: 'Alle Ergänzungen entfernen und die vorgegebene Schaltung wiederherstellen?',
  },
  en: {
    components: 'Components',
    select: 'Select and move (V)',
    wire: 'Draw wire (W)',
    rotate: 'Rotate selection by 90° (R)',
    properties: 'Edit component properties',
    remove: 'Delete selection (Delete)',
    undo: 'Undo (Ctrl+Z)',
    redo: 'Redo (Ctrl+Y)',
    exchange: 'Export circuit as LiaScript macros',
    objectList: 'Object list',
    closeObjectList: 'Close object list',
    noObjects: 'No components or wires yet.',
    wireType: 'Wire',
    wireName: (index: number) => `Wire ${index}`,
    export: 'Export',
    download: 'Download macro block',
    downloaded: (filename: string) => `${filename} was exported.`,
    downloadFailed: 'Macro download is not available in this browser.',
    readingHidden: 'Reading hidden',
    clear: 'Clear circuit',
    clearBaseline: 'Reset additions',
    selectStatus: 'Select a component or wire. Drag components to move them.',
    wireStatus: 'Select the first terminal.',
    wireEndStatus: 'Select the second terminal. Space switches the wire route.',
    placeStatus: (name: string) => `Place ${name} on the grid.`,
    emptyStatus: 'There is nothing to delete yet.',
    noAdditions: 'The preset circuit has no additions.',
    selectedComponent: (name: string) => `${name} selected. Drag, press R to rotate, Delete to remove; right-click for properties.`,
    selectedLockedComponent: (name: string) => `${name} selected and locked. Right-click for properties; Delete removes the component.`,
    selectedProtectedComponent: (name: string) => `${name} is preset and fully protected.`,
    selectedWire: 'Wire selected. R switches the orthogonal route.',
    selectedProtectedWire: 'This preset wire is fully protected.',
    samePort: 'A wire needs two different terminals.',
    duplicateWire: 'Those terminals are already connected.',
    propertiesTitle: 'Component properties',
    componentType: (name: string) => name,
    nameLabel: 'Name',
    valueLabel: 'Value',
    valuePlaceholder: 'e.g. 220 Ω',
    showMeasurement: 'Show reading at the symbol',
    lockComponent: 'Lock',
    locked: 'locked',
    protected: 'preset',
    componentLocked: (name: string) => `${name} locked.`,
    componentUnlocked: (name: string) => `${name} unlocked.`,
    sourceValueLabel: 'Source voltage U',
    sourceValuePlaceholder: 'e.g. 9 V',
    resistanceValueLabel: 'Resistance R',
    resistanceValuePlaceholder: 'e.g. 220 Ω or 4.7 kΩ',
    closeProperties: 'Close properties',
    propertiesSaved: (name: string) => `Properties saved for ${name}.`,
    physicsTitle: 'DC analysis',
    physicsSolved: 'Closed circuit',
    physicsOpen: 'Open circuit: A conductive return path is missing.',
    physicsShort: 'Short circuit: The voltage source is bypassed without resistance.',
    physicsNoSource: 'No DC voltage source is present.',
    physicsNotConnected: 'The component is not part of a powered circuit.',
    physicsIncomplete: (name: string) => `${name} needs a valid electrical value.`,
    physicsUnsupported: (name: string) => `${name} is not supported by the DC analysis yet.`,
    physicsInvalid: 'The electrical network does not have a unique solution.',
    totalVoltage: 'Total voltage U',
    totalResistance: 'Total resistance Rtotal',
    totalCurrent: 'Total current I',
    componentVoltage: 'Voltage U',
    componentCurrent: 'Current I',
    deliveredCurrent: 'Delivered current I',
    componentPower: 'Power P',
    exportComponentsTitle: 'Choose components for the imported Electro',
    exportComponentsHint: 'Only components marked in green can be placed in the imported Electro. Components already built into the circuit remain available.',
    exportRestrictionsTitle: 'Restrictions in the imported Electro',
    restrictAllProperties: 'Disable component properties completely (right-click)',
    restrictMacroProperties: 'Disable component properties only for components inserted by macros',
    restrictBaseline: 'Fully protect preset components and wires',
    restrictMeasurements: 'Disable changing and displaying meter readings',
    restrictExport: 'Disable export in the object list',
    exportQuizTitle: 'Define completion task',
    exportQuizHint: 'Optionally export the circuit as an automatically checked LiaScript quiz. The electrical connection, required additions and target value are validated.',
    quizEnable: 'Export a completion quiz',
    quizCondition: 'Condition',
    quizConditions: {
      closed: 'Circuit is closed',
      'ammeter-current': 'Ammeter reaches target current',
      'voltmeter-voltage': 'Voltmeter reaches target voltage',
      'total-current': 'Total current reaches target',
      'equivalent-resistance': 'Equivalent resistance reaches target',
    },
    quizMeter: 'Target meter',
    quizNoMeter: 'No matching meter in the circuit',
    quizTarget: 'Target value with unit',
    quizTolerance: 'Tolerance with unit',
    quizMagnitude: 'Compare magnitude instead of terminal direction',
    quizRequiredTitle: 'Exact required new components',
    quizRequiredHint: 'Without a selection, any supported additions are allowed.',
    quizCount: 'Count',
    quizPreserve: 'Preset electrical circuit must be preserved',
    quizChanged: 'Reject an unchanged submission',
    quizInvalid: 'The task condition is incomplete or contains an invalid value.',
    quizMeterMissing: 'This condition needs a matching meter.',
    quizUnsupported: (name: string) => `${name} is not yet supported in automatically checked DC tasks.`,
    propertiesRestricted: 'The properties of this component are disabled.',
    protectedObject: 'This preset object is fully protected.',
    exportGroups: {
      sources: 'Sources',
      passive: 'Passive components',
      semiconductors: 'Semiconductors',
      switches: 'Switches',
      loads: 'Loads',
      meters: 'Meters',
      other: 'Other components',
    },
    available: 'available',
    unavailable: 'not available',
    dialogTitle: 'Export as LiaScript macros',
    dialogHelp: 'Copy this block into a LiaScript file. Every component and wire is emitted as its own macro.',
    next: 'Continue',
    back: 'Back',
    copy: 'Copy',
    close: 'Close',
    copied: 'Macro block copied.',
    copyFailed: 'Copy failed; select the text manually.',
    clearConfirm: 'Remove every component and wire?',
    clearBaselineConfirm: 'Remove all additions and restore the preset circuit?',
  },
} as const;

const ICONS = {
  components: '<svg viewBox="0 0 24 24"><path d="M3 12h4m10 0h4M7 8h10v8H7z"/></svg>',
  select: '<svg viewBox="0 0 24 24"><path d="M5 3l12 9-6 1.5L9 20z"/></svg>',
  wire: '<svg viewBox="0 0 24 24"><circle cx="5" cy="17" r="2"/><circle cx="19" cy="7" r="2"/><path d="M7 17h5V7h5"/></svg>',
  rotate: '<svg viewBox="0 0 24 24"><path d="M19 8V3l-2 2a8 8 0 1 0 2.2 8"/><path d="M15 3h4v4"/></svg>',
  properties: '<svg viewBox="0 0 24 24"><path d="M4 20h4l11-11-4-4L4 16v4zM13.5 6.5l4 4M4 12H2m4-6L4.5 4.5M12 4V2"/></svg>',
  remove: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3m-9 0l1 14h10l1-14M10 11v6m4-6v6"/></svg>',
  undo: '<svg viewBox="0 0 24 24"><path d="M9 7L4 12l5 5M5 12h8a6 6 0 0 1 6 6"/></svg>',
  redo: '<svg viewBox="0 0 24 24"><path d="M15 7l5 5-5 5m4-5h-8a6 6 0 0 0-6 6"/></svg>',
  exchange: '<svg viewBox="0 0 24 24"><path d="M8 7h11l-3-3m3 3l-3 3M16 17H5l3-3m-3 3l3 3"/></svg>',
  objectList: '<svg viewBox="0 0 24 24"><circle cx="5" cy="6" r="1.6"/><circle cx="5" cy="12" r="1.6"/><circle cx="5" cy="18" r="1.6"/><path d="M9 6h12M9 12h12M9 18h12"/></svg>',
  clear: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3m-9 0l1 14h10l1-14"/></svg>',
} as const;

export class ElectroController {
  readonly uid: string;
  readonly boardId: string;
  readonly board: any;
  readonly container: HTMLElement;

  private language: Language;
  private config: ElectroConfig;
  private sourceSpec: string;
  private baseline: CircuitDocument;
  private completionQuizSpec?: string;
  private history: CircuitHistory;
  private tool: ToolMode = 'select';
  private placementKind: SymbolId | null = null;
  private selection: Selection = null;
  private pendingWire: PendingWire | null = null;
  private pointerPreview: Vec2 | null = null;
  private drag: DragState | null = null;
  private readonly transientPositions = new Map<string, [number, number]>();
  private readonly componentRenders = new Map<string, ComponentRender>();
  private readonly wireRenders = new Map<string, WireRender>();
  private previewCurve: any | null = null;
  private toolbar!: HTMLDivElement;
  private palette!: HTMLDivElement;
  private status!: HTMLDivElement;
  private objectListClip!: HTMLDivElement;
  private objectListPanel!: HTMLElement;
  private objectListTitle!: HTMLSpanElement;
  private objectListContent!: HTMLDivElement;
  private objectListCloseButton!: HTMLButtonElement;
  private objectListExportButton!: HTMLButtonElement;
  private objectListSignature = '';
  private propertiesClip!: HTMLDivElement;
  private propertiesPanel!: HTMLDivElement;
  private propertiesType!: HTMLSpanElement;
  private propertiesCloseButton!: HTMLButtonElement;
  private propertiesNameInput!: HTMLInputElement;
  private propertiesValueInput!: HTMLInputElement;
  private propertiesLockField!: HTMLLabelElement;
  private propertiesLockInput!: HTMLInputElement;
  private propertiesMeasurementField!: HTMLLabelElement;
  private propertiesMeasurementInput!: HTMLInputElement;
  private propertiesPhysicsStatus!: HTMLDivElement;
  private propertiesPhysicsValues!: HTMLDListElement;
  private dialogBackdrop!: HTMLDivElement;
  private dialog!: HTMLDivElement;
  private dialogTitle!: HTMLHeadingElement;
  private dialogComponentsHint!: HTMLParagraphElement;
  private dialogComponentsStep!: HTMLDivElement;
  private dialogQuizHint!: HTMLParagraphElement;
  private dialogQuizStep!: HTMLDivElement;
  private dialogQuizEnabledInput!: HTMLInputElement;
  private dialogQuizConditionSelect!: HTMLSelectElement;
  private dialogQuizComponentField!: HTMLLabelElement;
  private dialogQuizComponentSelect!: HTMLSelectElement;
  private dialogQuizTargetField!: HTMLLabelElement;
  private dialogQuizTargetInput!: HTMLInputElement;
  private dialogQuizToleranceField!: HTMLLabelElement;
  private dialogQuizToleranceInput!: HTMLInputElement;
  private dialogQuizMagnitudeField!: HTMLLabelElement;
  private dialogQuizMagnitudeInput!: HTMLInputElement;
  private dialogQuizPreserveInput!: HTMLInputElement;
  private dialogQuizChangedInput!: HTMLInputElement;
  private dialogQuizError!: HTMLParagraphElement;
  private dialogMacroStep!: HTMLDivElement;
  private dialogTextarea!: HTMLTextAreaElement;
  private dialogBackButton!: HTMLButtonElement;
  private dialogCopyButton!: HTMLButtonElement;
  private dialogDownloadButton!: HTMLButtonElement;
  private dialogCloseButton!: HTMLButtonElement;
  private dialogStep: ExportDialogStep = 'components';
  private readonly dialogComponentButtons = new Map<SymbolId, HTMLButtonElement>();
  private readonly dialogRestrictionInputs = new Map<number, HTMLInputElement>();
  private readonly dialogQuizRequiredInputs = new Map<SymbolId, {
    checkbox: HTMLInputElement;
    count: HTMLInputElement;
  }>();
  private dialogSelectedComponentIds = new Set<number>();
  private dialogSelectedRestrictionIds = new Set<number>();
  private dialogCompletionQuizSpec?: string;
  private dialogReturnFocus: HTMLElement | null = null;
  private readonly buttons = new Map<string, HTMLButtonElement>();
  private propertyComponentId: string | null = null;
  private propertyReturnFocus: HTMLElement | null = null;
  private propertyReturnObjectKey: string | null = null;
  private dcAnalysis!: DcAnalysis;
  private destroyed = false;

  private readonly handlePointerDown = (event: PointerEvent) => this.onPointerDown(event);
  private readonly handlePointerMove = (event: PointerEvent) => this.onPointerMove(event);
  private readonly handlePointerUp = (event: PointerEvent) => this.onPointerUp(event);
  private readonly handlePointerCancel = (event: PointerEvent) => this.onPointerCancel(event);
  private readonly handleContextMenu = (event: MouseEvent) => this.onContextMenu(event);
  private readonly handleKeyDown = (event: KeyboardEvent) => this.onKeyDown(event);

  constructor(
    uid: string,
    board: any,
    spec: string,
    language?: string,
    initial?: CircuitDocument,
    baseline?: CircuitDocument,
    completionQuizSpec?: string,
  ) {
    this.uid = uid;
    this.board = board;
    this.container = board.containerObj as HTMLElement;
    this.config = parseElectroSpec(spec);
    this.sourceSpec = spec;
    this.boardId = this.config.boardId;
    this.language = resolveLanguage(language);
    let initialDocument = initial
      ? validateCircuit(cloneCircuit(initial))
      : createEmptyCircuit({ snapStep: this.config.snapStep, wireStub: this.config.wireStub });
    this.baseline = baseline
      ? validateCircuit(cloneCircuit(baseline))
      : cloneCircuit(initialDocument);
    this.completionQuizSpec = normalizeCompletionQuizSpec(completionQuizSpec);
    if (this.isBaselineProtectionEnabled()) {
      initialDocument = validateCircuit(this.restoreBaselineEntities(initialDocument));
    }
    this.history = new CircuitHistory(initialDocument);
    this.dcAnalysis = analyzeDcCircuit(initialDocument);

    const root = (this.container.getRootNode?.() || window.document) as Document | ShadowRoot;
    ensureElectroStyles(root);
    this.prepareContainer();
    this.createInterface();
    this.createPreviewCurve();
    this.bindEvents();
    this.reconcileRenders();
    this.applyTheme();
    this.setTool('select');
    this.persist();
  }

  get document(): CircuitDocument {
    return cloneCircuit(this.history.document);
  }

  update(
    spec: string,
    language?: string,
    baseline?: CircuitDocument,
    completionQuizSpec?: string | null,
  ): void {
    const protectionWasEnabled = this.isBaselineProtectionEnabled();
    this.config = parseElectroSpec(spec);
    this.sourceSpec = spec;
    this.language = resolveLanguage(language);
    const baselineChanged = baseline != null && !sameCircuitDocument(this.baseline, baseline);
    if (baseline != null) this.baseline = validateCircuit(cloneCircuit(baseline));
    if (completionQuizSpec !== undefined) {
      this.completionQuizSpec = normalizeCompletionQuizSpec(completionQuizSpec);
    }
    if (this.isBaselineProtectionEnabled() && (!protectionWasEnabled || baselineChanged)) {
      const restored = validateCircuit(this.restoreBaselineEntities(this.history.document));
      this.history.replace(restored);
      this.persist();
      this.reconcileRenders();
    }
    this.refreshInterfaceText();
    this.applyTheme();
  }

  refreshTheme(): void {
    if (!this.destroyed) this.applyTheme();
  }

  exportJSON(): string {
    return stringifyCircuit(this.history.document);
  }

  exportMacros(targetBoardId?: string, profile?: ElectroExportProfile): string {
    const effectiveProfile = profile
      ? {
          ...profile,
          ...(profile.completionQuizSpec === undefined && this.completionQuizSpec
            ? { completionQuizSpec: this.completionQuizSpec }
            : {}),
        }
      : (this.completionQuizSpec
        ? {
          componentIds: new Set(
            this.config.componentIds === null
              ? Object.values(ELECTRO_COMPONENT_CAPABILITIES)
              : this.config.componentIds,
          ),
          restrictionIds: new Set(this.config.restrictionIds),
          completionQuizSpec: this.completionQuizSpec,
        }
        : undefined);
    return buildElectroMacroBlock(
      this.history.document,
      this.sourceSpec,
      this.language,
      targetBoardId,
      effectiveProfile,
    );
  }

  downloadMacros(content = this.exportMacros()): string | null {
    const filename = `${this.safeExportName()}.lia.md`;
    return this.downloadText(content, filename, 'text/markdown;charset=utf-8');
  }

  downloadJSON(): string | null {
    const filename = `${this.safeExportName()}.electro.json`;
    return this.downloadText(this.exportJSON(), filename, 'application/json;charset=utf-8');
  }

  private downloadText(content: string, filename: string, type: string): string | null {
    const urlApi = window.URL;
    if (typeof window.Blob !== 'function' || typeof urlApi?.createObjectURL !== 'function') {
      this.setStatus(TEXT[this.language].downloadFailed);
      return null;
    }
    let url: string | null = null;
    const anchor = document.createElement('a');
    try {
      const blob = new window.Blob([content], { type });
      url = urlApi.createObjectURL(blob);
      anchor.href = url;
      anchor.download = filename;
      anchor.hidden = true;
      this.container.appendChild(anchor);
      anchor.click();
      this.setStatus(TEXT[this.language].downloaded(filename));
      return filename;
    } catch (error) {
      this.setStatus(TEXT[this.language].downloadFailed);
      return null;
    } finally {
      anchor.remove();
      if (url) {
        const objectUrl = url;
        window.setTimeout(() => urlApi.revokeObjectURL?.(objectUrl), 0);
      }
    }
  }

  analyzeDC(): DcAnalysis {
    return analyzeDcCircuit(this.history.document);
  }

  checkCompletion(
    ruleOrSpec: CompletionRule | string = this.completionQuizSpec || '',
  ): CompletionResult {
    const rule = typeof ruleOrSpec === 'string'
      ? parseCompletionRule(ruleOrSpec)
      : ruleOrSpec;
    const result = evaluateCircuitCompletion(
      this.history.document,
      this.baseline,
      rule,
      analyzeDcCircuit(this.history.document),
      this.language,
    );
    this.setStatus(result.message);
    return result;
  }

  importJSON(input: string): CircuitDocument {
    const parsed = parseCircuitJSON(input);
    this.closeProperties(false);
    this.selection = null;
    this.cancelPendingWire();
    this.commit(parsed);
    return this.document;
  }

  undo(): void {
    this.closeProperties(false);
    if (!this.history.undo()) return;
    this.selection = null;
    this.cancelPendingWire();
    this.persist();
    this.reconcileRenders();
  }

  redo(): void {
    this.closeProperties(false);
    if (!this.history.redo()) return;
    this.selection = null;
    this.cancelPendingWire();
    this.persist();
    this.reconcileRenders();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.container.removeEventListener('pointerdown', this.handlePointerDown, true);
    this.container.removeEventListener('pointermove', this.handlePointerMove, true);
    this.container.removeEventListener('pointerup', this.handlePointerUp, true);
    this.container.removeEventListener('pointercancel', this.handlePointerCancel, true);
    this.container.removeEventListener('contextmenu', this.handleContextMenu, true);
    this.container.removeEventListener('keydown', this.handleKeyDown, true);
    this.componentRenders.forEach((render) => this.removeBoardObjects([
      render.curve,
      render.selection,
      ...render.terminals,
      ...render.labels,
    ]));
    this.wireRenders.forEach((render) => this.removeBoardObjects([render.curve]));
    this.componentRenders.clear();
    this.wireRenders.clear();
    this.removeBoardObjects([this.previewCurve]);
    this.previewCurve = null;
    this.toolbar.remove();
    this.palette.remove();
    this.status.remove();
    this.objectListClip.remove();
    this.propertiesClip.remove();
    this.dialogBackdrop.remove();
    if (this.container.dataset.liaElectroUid === this.uid) {
      delete this.container.dataset.liaElectroUid;
      delete this.container.dataset.liaElectroBoard;
      delete this.container.dataset.liaElectroMode;
      delete this.container.dataset.liaElectroPropertiesOpen;
      delete this.container.dataset.liaElectroObjectListOpen;
    }
    this.container.style.removeProperty('--lia-electro-object-list-inset');
    this.container.style.removeProperty('--lia-electro-right-inset');
    try { this.board.update(); } catch (error) {}
  }

  private prepareContainer(): void {
    const position = getComputedStyle(this.container).position;
    if (!position || position === 'static') this.container.style.position = 'relative';
    if (!this.container.hasAttribute('tabindex')) this.container.tabIndex = 0;
    this.container.dataset.liaElectroUid = this.uid;
    this.container.dataset.liaElectroBoard = this.boardId;
  }

  private createInterface(): void {
    this.toolbar = document.createElement('div');
    this.toolbar.className = 'lia-electro-toolbar';
    this.toolbar.setAttribute('role', 'toolbar');

    this.addToolbarButton('components', ICONS.components);
    this.addToolbarButton('select', ICONS.select, true);
    this.addToolbarButton('wire', ICONS.wire, true);
    this.addToolbarButton('rotate', ICONS.rotate);
    this.addToolbarButton('properties', ICONS.properties);
    this.addToolbarButton('remove', ICONS.remove);
    this.addSeparator();
    this.addToolbarButton('undo', ICONS.undo);
    this.addToolbarButton('redo', ICONS.redo);
    this.addSeparator();
    this.addToolbarButton('objectList', ICONS.objectList, true);
    this.addToolbarButton('clear', ICONS.clear);
    this.toolbar.addEventListener('click', (event) => this.onToolbarClick(event));

    this.palette = document.createElement('div');
    this.palette.className = 'lia-electro-palette';
    this.palette.id = `lia-electro-palette-${this.uid}`;
    this.palette.hidden = true;
    this.palette.setAttribute('role', 'dialog');
    this.palette.setAttribute('aria-label', TEXT[this.language].components);
    const componentsButton = this.buttons.get('components');
    componentsButton?.setAttribute('aria-expanded', 'false');
    componentsButton?.setAttribute('aria-controls', this.palette.id);
    SYMBOLS.forEach((definition) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.symbol = definition.id;
      button.setAttribute('aria-pressed', 'false');
      button.innerHTML = symbolToSvg(definition);
      const label = document.createElement('span');
      label.textContent = definition.label[this.language];
      button.appendChild(label);
      this.palette.appendChild(button);
    });
    this.palette.addEventListener('click', (event) => this.onPaletteClick(event));

    this.status = document.createElement('div');
    this.status.className = 'lia-electro-status';
    this.status.setAttribute('role', 'status');
    this.status.setAttribute('aria-live', 'polite');

    this.objectListClip = document.createElement('div');
    this.objectListClip.className = 'lia-electro-object-list-clip';
    this.objectListPanel = document.createElement('aside');
    this.objectListPanel.className = 'lia-electro-object-list-panel';
    this.objectListPanel.id = `lia-electro-object-list-${this.uid}`;
    this.objectListPanel.setAttribute('role', 'complementary');
    this.objectListPanel.setAttribute('aria-hidden', 'true');
    this.objectListPanel.dataset.open = '0';
    this.objectListPanel.inert = true;
    const objectListHeader = document.createElement('div');
    objectListHeader.className = 'lia-electro-object-list-header';
    this.objectListTitle = document.createElement('span');
    this.objectListCloseButton = document.createElement('button');
    this.objectListCloseButton.type = 'button';
    this.objectListCloseButton.className = 'lia-electro-object-list-close';
    this.objectListCloseButton.textContent = '×';
    this.objectListCloseButton.tabIndex = -1;
    objectListHeader.append(this.objectListTitle, this.objectListCloseButton);
    this.objectListContent = document.createElement('div');
    this.objectListContent.className = 'lia-electro-object-list-content';
    this.objectListContent.setAttribute('role', 'list');
    const objectListFooter = document.createElement('div');
    objectListFooter.className = 'lia-electro-object-list-footer';
    this.objectListExportButton = document.createElement('button');
    this.objectListExportButton.type = 'button';
    this.objectListExportButton.className = 'lia-electro-object-list-export';
    this.objectListExportButton.tabIndex = -1;
    objectListFooter.appendChild(this.objectListExportButton);
    this.objectListPanel.append(objectListHeader, this.objectListContent, objectListFooter);
    this.objectListClip.appendChild(this.objectListPanel);
    const objectListButton = this.buttons.get('objectList');
    objectListButton?.setAttribute('aria-controls', this.objectListPanel.id);
    objectListButton?.setAttribute('aria-expanded', 'false');
    this.objectListCloseButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.setObjectListOpen(false, true);
    });
    this.objectListExportButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.openDialog(this.objectListExportButton);
    });

    this.propertiesClip = document.createElement('div');
    this.propertiesClip.className = 'lia-electro-properties-clip';
    this.propertiesPanel = document.createElement('div');
    this.propertiesPanel.className = 'lia-electro-properties';
    this.propertiesPanel.id = `lia-electro-properties-${this.uid}`;
    this.propertiesPanel.setAttribute('role', 'dialog');
    this.propertiesPanel.setAttribute('aria-label', TEXT[this.language].propertiesTitle);
    this.propertiesPanel.setAttribute('aria-hidden', 'true');
    this.propertiesPanel.dataset.open = '0';
    const propertiesHeader = document.createElement('div');
    propertiesHeader.className = 'lia-electro-properties-header';
    const propertiesTitle = document.createElement('div');
    propertiesTitle.className = 'lia-electro-properties-title';
    this.propertiesType = document.createElement('span');
    this.propertiesNameInput = document.createElement('input');
    this.propertiesNameInput.name = 'name';
    this.propertiesNameInput.type = 'text';
    this.propertiesNameInput.className = 'lia-electro-properties-name';
    this.propertiesNameInput.maxLength = MAX_COMPONENT_TEXT_LENGTH;
    this.propertiesNameInput.autocomplete = 'off';
    this.propertiesNameInput.spellcheck = false;
    this.propertiesNameInput.setAttribute('aria-invalid', 'false');
    this.propertiesNameInput.tabIndex = -1;
    propertiesTitle.append(this.propertiesType, this.propertiesNameInput);
    this.propertiesCloseButton = document.createElement('button');
    this.propertiesCloseButton.type = 'button';
    this.propertiesCloseButton.className = 'lia-electro-properties-close';
    this.propertiesCloseButton.textContent = '×';
    this.propertiesCloseButton.tabIndex = -1;
    propertiesHeader.append(propertiesTitle, this.propertiesCloseButton);

    const valueLabel = document.createElement('label');
    valueLabel.className = 'lia-electro-properties-field';
    const valueText = document.createElement('span');
    valueText.dataset.role = 'properties-value-label';
    this.propertiesValueInput = document.createElement('input');
    this.propertiesValueInput.name = 'value';
    this.propertiesValueInput.type = 'text';
    this.propertiesValueInput.maxLength = MAX_COMPONENT_TEXT_LENGTH;
    this.propertiesValueInput.autocomplete = 'off';
    this.propertiesValueInput.spellcheck = false;
    this.propertiesValueInput.setAttribute('aria-invalid', 'false');
    this.propertiesValueInput.tabIndex = -1;
    valueLabel.append(valueText, this.propertiesValueInput);

    this.propertiesLockField = document.createElement('label');
    this.propertiesLockField.className = 'lia-electro-properties-field lia-electro-toggle-field lia-electro-lock-field';
    this.propertiesLockInput = document.createElement('input');
    this.propertiesLockInput.name = 'locked';
    this.propertiesLockInput.type = 'checkbox';
    this.propertiesLockInput.tabIndex = -1;
    const lockText = document.createElement('span');
    lockText.dataset.role = 'properties-lock-label';
    this.propertiesLockField.append(this.propertiesLockInput, lockText);

    this.propertiesMeasurementField = document.createElement('label');
    this.propertiesMeasurementField.className = 'lia-electro-properties-field lia-electro-toggle-field lia-electro-measurement-field';
    this.propertiesMeasurementField.hidden = true;
    this.propertiesMeasurementInput = document.createElement('input');
    this.propertiesMeasurementInput.name = 'showMeasurement';
    this.propertiesMeasurementInput.type = 'checkbox';
    this.propertiesMeasurementInput.tabIndex = -1;
    const measurementText = document.createElement('span');
    measurementText.dataset.role = 'properties-measurement-label';
    this.propertiesMeasurementField.append(this.propertiesMeasurementInput, measurementText);

    const physicsSection = document.createElement('section');
    physicsSection.className = 'lia-electro-physics';
    const physicsTitle = document.createElement('div');
    physicsTitle.className = 'lia-electro-physics-title';
    physicsTitle.id = `lia-electro-physics-title-${this.uid}`;
    physicsTitle.dataset.role = 'physics-title';
    physicsSection.setAttribute('aria-labelledby', physicsTitle.id);
    this.propertiesPhysicsStatus = document.createElement('div');
    this.propertiesPhysicsStatus.className = 'lia-electro-physics-status';
    this.propertiesPhysicsStatus.id = `lia-electro-physics-status-${this.uid}`;
    this.propertiesPhysicsStatus.setAttribute('role', 'status');
    this.propertiesPhysicsStatus.setAttribute('aria-live', 'polite');
    this.propertiesPhysicsStatus.setAttribute('aria-atomic', 'true');
    this.propertiesValueInput.setAttribute('aria-describedby', this.propertiesPhysicsStatus.id);
    this.propertiesPhysicsValues = document.createElement('dl');
    this.propertiesPhysicsValues.className = 'lia-electro-physics-values';
    physicsSection.append(physicsTitle, this.propertiesPhysicsStatus, this.propertiesPhysicsValues);

    this.propertiesPanel.append(
      propertiesHeader,
      valueLabel,
      this.propertiesLockField,
      this.propertiesMeasurementField,
      physicsSection,
    );
    this.propertiesClip.appendChild(this.propertiesPanel);
    this.propertiesPanel.addEventListener('pointerdown', (event) => event.stopPropagation());
    this.propertiesPanel.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    this.propertiesCloseButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.closeProperties(true);
    });
    this.propertiesNameInput.addEventListener('blur', () => this.applyPropertyInput('name'));
    this.propertiesValueInput.addEventListener('blur', () => this.applyPropertyInput('value'));
    this.propertiesLockInput.addEventListener('change', () => this.applyComponentLock());
    this.propertiesMeasurementInput.addEventListener('change', () => this.applyMeasurementVisibility());
    this.propertiesNameInput.addEventListener('keydown', (event) => this.onPropertyInputKeyDown(event, 'name'));
    this.propertiesValueInput.addEventListener('keydown', (event) => this.onPropertyInputKeyDown(event, 'value'));
    const propertiesButton = this.buttons.get('properties');
    propertiesButton?.setAttribute('aria-haspopup', 'dialog');
    propertiesButton?.setAttribute('aria-controls', this.propertiesPanel.id);
    propertiesButton?.setAttribute('aria-expanded', 'false');
    propertiesButton?.setAttribute('aria-keyshortcuts', 'Shift+F10');

    this.dialogBackdrop = document.createElement('div');
    this.dialogBackdrop.className = 'lia-electro-dialog-backdrop';
    this.dialogBackdrop.hidden = true;
    this.dialogBackdrop.inert = true;
    this.dialogBackdrop.setAttribute('aria-hidden', 'true');
    this.dialogBackdrop.addEventListener('click', (event) => {
      if (event.target === this.dialogBackdrop) this.closeDialog();
    });
    this.dialog = document.createElement('div');
    this.dialog.className = 'lia-electro-dialog lia-electro-export-dialog';
    this.dialog.id = `lia-electro-export-dialog-${this.uid}`;
    this.dialog.setAttribute('role', 'dialog');
    this.dialog.setAttribute('aria-modal', 'true');
    this.dialogTitle = document.createElement('h3');
    this.dialogTitle.id = `lia-electro-export-title-${this.uid}`;
    this.dialogTitle.dataset.role = 'dialog-title';
    this.dialog.setAttribute('aria-labelledby', this.dialogTitle.id);
    this.objectListExportButton.setAttribute('aria-haspopup', 'dialog');
    this.objectListExportButton.setAttribute('aria-controls', this.dialog.id);
    this.objectListExportButton.setAttribute('aria-expanded', 'false');

    this.dialogComponentsStep = document.createElement('div');
    this.dialogComponentsStep.className = 'lia-electro-export-step lia-electro-export-components-step';
    this.dialogComponentsHint = document.createElement('p');
    this.dialogComponentsHint.id = `lia-electro-export-components-help-${this.uid}`;
    this.dialogComponentsHint.className = 'lia-electro-export-hint';
    this.dialogComponentsHint.dataset.role = 'dialog-components-help';
    const componentGroups = document.createElement('div');
    componentGroups.className = 'lia-electro-export-component-groups';
    EXPORT_COMPONENT_GROUPS.forEach((groupDefinition) => {
      const group = document.createElement('section');
      group.className = 'lia-electro-export-component-group';
      group.setAttribute('role', 'group');
      const groupTitle = document.createElement('h4');
      groupTitle.id = `lia-electro-export-group-${groupDefinition.id}-${this.uid}`;
      groupTitle.dataset.exportGroup = groupDefinition.id;
      group.setAttribute('aria-labelledby', groupTitle.id);
      const grid = document.createElement('div');
      grid.className = 'lia-electro-export-component-grid';
      groupDefinition.kinds.forEach((kind) => {
        const definition = SYMBOL_BY_ID[kind];
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'lia-electro-export-component';
        button.dataset.componentKind = kind;
        button.dataset.componentId = String(ELECTRO_COMPONENT_CAPABILITIES[kind]);
        button.dataset.enabled = '1';
        button.setAttribute('aria-pressed', 'true');
        const icon = document.createElement('span');
        icon.className = 'lia-electro-export-component-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.innerHTML = symbolToSvg(definition);
        const status = document.createElement('span');
        status.className = 'lia-electro-export-component-status';
        status.setAttribute('aria-hidden', 'true');
        status.textContent = '\u2713';
        button.append(icon, status);
        button.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.toggleDialogComponent(kind);
        });
        this.dialogComponentButtons.set(kind, button);
        grid.appendChild(button);
      });
      group.append(groupTitle, grid);
      componentGroups.appendChild(group);
    });

    const restrictions = document.createElement('fieldset');
    restrictions.className = 'lia-electro-export-restrictions';
    const restrictionsTitle = document.createElement('legend');
    restrictionsTitle.dataset.role = 'dialog-restrictions-title';
    restrictions.appendChild(restrictionsTitle);
    const restrictionDefinitions = [
      { id: ELECTRO_RESTRICTIONS.componentPropertiesLocked, role: 'all-properties' },
      { id: ELECTRO_RESTRICTIONS.macroComponentPropertiesLocked, role: 'macro-properties' },
      { id: ELECTRO_RESTRICTIONS.baselineLocked, role: 'baseline' },
      { id: ELECTRO_RESTRICTIONS.measurementControlsLocked, role: 'measurements' },
      { id: ELECTRO_RESTRICTIONS.exportLocked, role: 'export' },
    ] as const;
    restrictionDefinitions.forEach((definition) => {
      const label = document.createElement('label');
      label.className = 'lia-electro-export-restriction-option';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.dataset.restrictionId = String(definition.id);
      const caption = document.createElement('span');
      caption.dataset.exportRestriction = definition.role;
      label.append(input, caption);
      restrictions.appendChild(label);
      this.dialogRestrictionInputs.set(definition.id, input);
      input.addEventListener('change', (event) => {
        event.stopPropagation();
        this.toggleDialogRestriction(definition.id, input.checked);
      });
    });
    this.dialogComponentsStep.append(this.dialogComponentsHint, componentGroups, restrictions);

    this.dialogQuizStep = document.createElement('div');
    this.dialogQuizStep.className = 'lia-electro-export-step lia-electro-export-quiz-step';
    this.dialogQuizStep.hidden = true;
    this.dialogQuizStep.inert = true;
    this.dialogQuizHint = document.createElement('p');
    this.dialogQuizHint.id = `lia-electro-export-quiz-help-${this.uid}`;
    this.dialogQuizHint.className = 'lia-electro-export-hint';
    this.dialogQuizHint.dataset.role = 'dialog-quiz-help';

    const quizEnabledLabel = document.createElement('label');
    quizEnabledLabel.className = 'lia-electro-export-quiz-toggle';
    this.dialogQuizEnabledInput = document.createElement('input');
    this.dialogQuizEnabledInput.type = 'checkbox';
    const quizEnabledCaption = document.createElement('span');
    quizEnabledCaption.dataset.role = 'dialog-quiz-enable';
    quizEnabledLabel.append(this.dialogQuizEnabledInput, quizEnabledCaption);

    const quizFields = document.createElement('div');
    quizFields.className = 'lia-electro-export-quiz-fields';
    quizFields.dataset.role = 'dialog-quiz-fields';

    const conditionField = document.createElement('label');
    conditionField.className = 'lia-electro-export-quiz-field';
    const conditionCaption = document.createElement('span');
    conditionCaption.dataset.role = 'dialog-quiz-condition';
    this.dialogQuizConditionSelect = document.createElement('select');
    this.dialogQuizConditionSelect.name = 'completion-condition';
    COMPLETION_CONDITIONS.forEach((condition) => {
      const option = document.createElement('option');
      option.value = condition;
      option.dataset.condition = condition;
      this.dialogQuizConditionSelect.appendChild(option);
    });
    conditionField.append(conditionCaption, this.dialogQuizConditionSelect);

    this.dialogQuizComponentField = document.createElement('label');
    this.dialogQuizComponentField.className = 'lia-electro-export-quiz-field';
    const componentCaption = document.createElement('span');
    componentCaption.dataset.role = 'dialog-quiz-component';
    this.dialogQuizComponentSelect = document.createElement('select');
    this.dialogQuizComponentSelect.name = 'completion-component';
    this.dialogQuizComponentField.append(componentCaption, this.dialogQuizComponentSelect);

    this.dialogQuizTargetField = document.createElement('label');
    this.dialogQuizTargetField.className = 'lia-electro-export-quiz-field';
    const targetCaption = document.createElement('span');
    targetCaption.dataset.role = 'dialog-quiz-target';
    this.dialogQuizTargetInput = document.createElement('input');
    this.dialogQuizTargetInput.type = 'text';
    this.dialogQuizTargetInput.name = 'completion-target';
    this.dialogQuizTargetInput.placeholder = '20 mA';
    this.dialogQuizTargetInput.autocomplete = 'off';
    this.dialogQuizTargetField.append(targetCaption, this.dialogQuizTargetInput);

    this.dialogQuizToleranceField = document.createElement('label');
    this.dialogQuizToleranceField.className = 'lia-electro-export-quiz-field';
    const toleranceCaption = document.createElement('span');
    toleranceCaption.dataset.role = 'dialog-quiz-tolerance';
    this.dialogQuizToleranceInput = document.createElement('input');
    this.dialogQuizToleranceInput.type = 'text';
    this.dialogQuizToleranceInput.name = 'completion-tolerance';
    this.dialogQuizToleranceInput.placeholder = '0.1 mA';
    this.dialogQuizToleranceInput.autocomplete = 'off';
    this.dialogQuizToleranceField.append(toleranceCaption, this.dialogQuizToleranceInput);

    this.dialogQuizMagnitudeField = document.createElement('label');
    this.dialogQuizMagnitudeField.className = 'lia-electro-export-quiz-option lia-electro-export-quiz-magnitude';
    this.dialogQuizMagnitudeInput = document.createElement('input');
    this.dialogQuizMagnitudeInput.type = 'checkbox';
    this.dialogQuizMagnitudeInput.checked = true;
    const magnitudeCaption = document.createElement('span');
    magnitudeCaption.dataset.role = 'dialog-quiz-magnitude';
    this.dialogQuizMagnitudeField.append(this.dialogQuizMagnitudeInput, magnitudeCaption);

    const required = document.createElement('fieldset');
    required.className = 'lia-electro-export-quiz-required';
    const requiredTitle = document.createElement('legend');
    requiredTitle.dataset.role = 'dialog-quiz-required-title';
    const requiredHint = document.createElement('p');
    requiredHint.className = 'lia-electro-export-hint';
    requiredHint.dataset.role = 'dialog-quiz-required-hint';
    const requiredGrid = document.createElement('div');
    requiredGrid.className = 'lia-electro-export-quiz-required-grid';
    COMPLETION_REQUIRED_KINDS.forEach((kind) => {
      const option = document.createElement('div');
      option.className = 'lia-electro-export-quiz-required-option';
      const toggle = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.dataset.requiredKind = kind;
      const caption = document.createElement('span');
      caption.dataset.requiredKindLabel = kind;
      toggle.append(checkbox, caption);
      const countField = document.createElement('label');
      countField.className = 'lia-electro-export-quiz-count';
      const countCaption = document.createElement('span');
      countCaption.dataset.role = 'dialog-quiz-count';
      const count = document.createElement('input');
      count.type = 'number';
      count.min = '1';
      count.max = '99';
      count.step = '1';
      count.value = '1';
      count.disabled = true;
      count.dataset.requiredKindCount = kind;
      countField.append(countCaption, count);
      option.append(toggle, countField);
      requiredGrid.appendChild(option);
      this.dialogQuizRequiredInputs.set(kind, { checkbox, count });
      checkbox.addEventListener('change', () => this.refreshDialogQuizControls());
    });
    required.append(requiredTitle, requiredHint, requiredGrid);

    const policies = document.createElement('div');
    policies.className = 'lia-electro-export-quiz-policies';
    const preserveLabel = document.createElement('label');
    preserveLabel.className = 'lia-electro-export-quiz-option';
    this.dialogQuizPreserveInput = document.createElement('input');
    this.dialogQuizPreserveInput.type = 'checkbox';
    this.dialogQuizPreserveInput.checked = true;
    const preserveCaption = document.createElement('span');
    preserveCaption.dataset.role = 'dialog-quiz-preserve';
    preserveLabel.append(this.dialogQuizPreserveInput, preserveCaption);
    const changedLabel = document.createElement('label');
    changedLabel.className = 'lia-electro-export-quiz-option';
    this.dialogQuizChangedInput = document.createElement('input');
    this.dialogQuizChangedInput.type = 'checkbox';
    this.dialogQuizChangedInput.checked = true;
    const changedCaption = document.createElement('span');
    changedCaption.dataset.role = 'dialog-quiz-changed';
    changedLabel.append(this.dialogQuizChangedInput, changedCaption);
    policies.append(preserveLabel, changedLabel);

    this.dialogQuizError = document.createElement('p');
    this.dialogQuizError.className = 'lia-electro-export-quiz-error';
    this.dialogQuizError.setAttribute('role', 'alert');
    this.dialogQuizError.hidden = true;
    quizFields.append(
      conditionField,
      this.dialogQuizComponentField,
      this.dialogQuizTargetField,
      this.dialogQuizToleranceField,
      this.dialogQuizMagnitudeField,
      required,
      policies,
    );
    this.dialogQuizStep.append(this.dialogQuizHint, quizEnabledLabel, quizFields, this.dialogQuizError);
    this.dialogQuizEnabledInput.addEventListener('change', () => this.refreshDialogQuizControls());
    this.dialogQuizConditionSelect.addEventListener('change', () => this.refreshDialogQuizControls(true));

    this.dialogMacroStep = document.createElement('div');
    this.dialogMacroStep.className = 'lia-electro-export-step lia-electro-export-macro-step';
    this.dialogMacroStep.hidden = true;
    this.dialogMacroStep.inert = true;
    this.dialogTextarea = document.createElement('textarea');
    this.dialogTextarea.className = 'lia-electro-export-textarea';
    this.dialogTextarea.spellcheck = false;
    this.dialogTextarea.readOnly = true;
    this.dialogTextarea.tabIndex = -1;
    const help = document.createElement('p');
    help.id = `lia-electro-export-help-${this.uid}`;
    help.className = 'lia-electro-export-hint';
    help.dataset.role = 'dialog-help';
    this.dialogMacroStep.append(this.dialogTextarea, help);
    const actions = document.createElement('div');
    actions.className = 'lia-electro-dialog-actions';
    this.dialogBackButton = this.dialogButton('back');
    this.dialogCopyButton = this.dialogButton('copy');
    this.dialogCopyButton.dataset.primary = '1';
    this.dialogDownloadButton = this.dialogButton('download');
    this.dialogCloseButton = this.dialogButton('close');
    actions.append(this.dialogBackButton, this.dialogDownloadButton, this.dialogCloseButton, this.dialogCopyButton);
    actions.addEventListener('click', (event) => this.onDialogClick(event));
    this.dialog.append(
      this.dialogTitle,
      this.dialogComponentsStep,
      this.dialogQuizStep,
      this.dialogMacroStep,
      actions,
    );
    this.dialogBackdrop.appendChild(this.dialog);

    this.container.append(
      this.toolbar,
      this.palette,
      this.status,
      this.objectListClip,
      this.propertiesClip,
      this.dialogBackdrop,
    );
    this.refreshInterfaceText();
  }

  private addToolbarButton(action: string, icon: string, toggle = false): void {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.action = action;
    button.innerHTML = icon;
    if (toggle) button.setAttribute('aria-pressed', 'false');
    this.buttons.set(action, button);
    this.toolbar.appendChild(button);
  }

  private dialogButton(action: 'back' | 'copy' | 'download' | 'close'): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.dialogAction = action;
    return button;
  }

  private addSeparator(): void {
    const separator = document.createElement('span');
    separator.className = 'lia-electro-separator';
    separator.setAttribute('aria-hidden', 'true');
    this.toolbar.appendChild(separator);
  }

  private refreshInterfaceText(): void {
    const text = TEXT[this.language];
    const labels: Record<string, string> = {
      components: text.components,
      select: text.select,
      wire: text.wire,
      rotate: text.rotate,
      properties: text.properties,
      remove: text.remove,
      undo: text.undo,
      redo: text.redo,
      objectList: text.objectList,
      clear: this.isBaselineProtectionEnabled() ? text.clearBaseline : text.clear,
    };
    this.buttons.forEach((button, action) => {
      button.title = labels[action] || action;
      button.setAttribute('aria-label', labels[action] || action);
    });
    this.palette.setAttribute('aria-label', text.components);
    this.palette.querySelectorAll<HTMLButtonElement>('button[data-symbol]').forEach((button) => {
      const kind = button.dataset.symbol as SymbolId;
      const label = SYMBOL_BY_ID[kind].label[this.language];
      button.title = label;
      button.setAttribute('aria-label', label);
      const span = button.querySelector('span');
      if (span) span.textContent = label;
    });
    this.objectListPanel.setAttribute('aria-label', text.objectList);
    this.objectListTitle.textContent = text.objectList;
    this.objectListCloseButton.setAttribute('aria-label', text.closeObjectList);
    this.objectListExportButton.textContent = text.export;
    this.objectListExportButton.title = text.exchange;
    this.objectListExportButton.setAttribute('aria-label', text.exchange);
    this.propertiesPanel.setAttribute('aria-label', text.propertiesTitle);
    this.propertiesNameInput.setAttribute('aria-label', text.nameLabel);
    this.propertiesNameInput.placeholder = text.nameLabel;
    this.propertiesCloseButton.setAttribute('aria-label', text.closeProperties);
    const measurementLabel = this.propertiesPanel.querySelector<HTMLElement>('[data-role="properties-measurement-label"]');
    if (measurementLabel) measurementLabel.textContent = text.showMeasurement;
    const lockLabel = this.propertiesPanel.querySelector<HTMLElement>('[data-role="properties-lock-label"]');
    if (lockLabel) lockLabel.textContent = text.lockComponent;
    const propertyComponent = this.propertyComponentId
      ? this.history.document.components.find((component) => component.id === this.propertyComponentId)
      : null;
    this.refreshPropertyValueText(propertyComponent || null);
    this.refreshLockControl(propertyComponent || null);
    this.refreshMeasurementControl(propertyComponent || null);
    this.propertiesType.textContent = propertyComponent
      ? text.componentType(SYMBOL_BY_ID[propertyComponent.kind].label[this.language])
      : '';
    const physicsTitle = this.propertiesPanel.querySelector<HTMLElement>('[data-role="physics-title"]');
    if (physicsTitle) physicsTitle.textContent = text.physicsTitle;
    this.refreshPhysicsPanel();
    this.dialogComponentsHint.textContent = text.exportComponentsHint;
    const help = this.dialogBackdrop.querySelector<HTMLElement>('[data-role="dialog-help"]');
    if (help) help.textContent = text.dialogHelp;
    this.dialogBackdrop.querySelectorAll<HTMLElement>('[data-export-group]').forEach((heading) => {
      const group = heading.dataset.exportGroup as keyof typeof text.exportGroups;
      heading.textContent = text.exportGroups[group] || group;
    });
    const restrictionsTitle = this.dialogBackdrop.querySelector<HTMLElement>('[data-role="dialog-restrictions-title"]');
    if (restrictionsTitle) restrictionsTitle.textContent = text.exportRestrictionsTitle;
    const restrictionLabels = {
      'all-properties': text.restrictAllProperties,
      'macro-properties': text.restrictMacroProperties,
      baseline: text.restrictBaseline,
      measurements: text.restrictMeasurements,
      export: text.restrictExport,
    };
    this.dialogBackdrop.querySelectorAll<HTMLElement>('[data-export-restriction]').forEach((caption) => {
      const role = caption.dataset.exportRestriction as keyof typeof restrictionLabels;
      caption.textContent = restrictionLabels[role] || role;
    });
    this.dialogQuizHint.textContent = text.exportQuizHint;
    const quizLabels: Readonly<Record<string, string>> = {
      'dialog-quiz-enable': text.quizEnable,
      'dialog-quiz-condition': text.quizCondition,
      'dialog-quiz-component': text.quizMeter,
      'dialog-quiz-target': text.quizTarget,
      'dialog-quiz-tolerance': text.quizTolerance,
      'dialog-quiz-magnitude': text.quizMagnitude,
      'dialog-quiz-required-title': text.quizRequiredTitle,
      'dialog-quiz-required-hint': text.quizRequiredHint,
      'dialog-quiz-count': text.quizCount,
      'dialog-quiz-preserve': text.quizPreserve,
      'dialog-quiz-changed': text.quizChanged,
    };
    this.dialogQuizStep.querySelectorAll<HTMLElement>('[data-role]').forEach((element) => {
      const label = quizLabels[element.dataset.role || ''];
      if (label) element.textContent = label;
    });
    this.dialogQuizConditionSelect.querySelectorAll<HTMLOptionElement>('option[data-condition]').forEach((option) => {
      const condition = option.dataset.condition as CompletionCondition;
      option.textContent = text.quizConditions[condition];
    });
    this.dialogQuizRequiredInputs.forEach(({ checkbox, count }, kind) => {
      const caption = this.dialogQuizStep.querySelector<HTMLElement>(`[data-required-kind-label="${kind}"]`);
      if (caption) caption.textContent = SYMBOL_BY_ID[kind].label[this.language];
      checkbox.setAttribute('aria-label', SYMBOL_BY_ID[kind].label[this.language]);
      count.setAttribute('aria-label', `${text.quizCount}: ${SYMBOL_BY_ID[kind].label[this.language]}`);
    });
    this.dialogTextarea.setAttribute('aria-label', text.dialogTitle);
    this.dialogBackButton.textContent = text.back;
    this.dialogDownloadButton.textContent = text.download;
    this.dialogCloseButton.textContent = text.close;
    this.refreshDialogQuizControls();
    this.renderDialogSelection();
    this.refreshDialogStep(false);
    this.applyRuntimeProfile();
    this.refreshObjectList(true);
    this.updateStatus();
  }

  private bindEvents(): void {
    this.container.addEventListener('pointerdown', this.handlePointerDown, true);
    this.container.addEventListener('pointermove', this.handlePointerMove, true);
    this.container.addEventListener('pointerup', this.handlePointerUp, true);
    this.container.addEventListener('pointercancel', this.handlePointerCancel, true);
    this.container.addEventListener('contextmenu', this.handleContextMenu, true);
    this.container.addEventListener('keydown', this.handleKeyDown, true);
  }

  private createPreviewCurve(): void {
    try {
      this.previewCurve = this.board.create('curve', [[], []], {
        fixed: true,
        highlight: false,
        strokeWidth: 2.6,
        dash: 2,
        layer: 8,
        visible: false,
      });
      this.previewCurve.updateDataArray = () => {
        const route = this.getPreviewRoute();
        this.previewCurve.dataX = route.map((point) => point[0]);
        this.previewCurve.dataY = route.map((point) => point[1]);
      };
    } catch (error) {
      this.previewCurve = null;
    }
  }

  private reconcileRenders(): void {
    this.dcAnalysis = analyzeDcCircuit(this.history.document);
    const componentById = new Map(this.history.document.components.map((component) => [component.id, component]));
    const wireIds = new Set(this.history.document.wires.map((wire) => wire.id));
    if (this.propertyComponentId && !componentById.has(this.propertyComponentId)) {
      this.closeProperties(false);
    }

    this.componentRenders.forEach((render, id) => {
      const component = componentById.get(id);
      if (component && component.kind === render.kind) return;
      this.removeBoardObjects([render.curve, render.selection, ...render.terminals, ...render.labels]);
      this.componentRenders.delete(id);
    });
    this.wireRenders.forEach((render, id) => {
      if (wireIds.has(id)) return;
      this.removeBoardObjects([render.curve]);
      this.wireRenders.delete(id);
    });

    this.history.document.components.forEach((component) => {
      if (!this.componentRenders.has(component.id)) this.createComponentRender(component);
    });
    this.history.document.wires.forEach((wire) => {
      if (!this.wireRenders.has(wire.id)) this.createWireRender(wire);
    });

    this.updateRenderAttributes();
    this.updateButtons();
    this.updatePreviewVisibility();
    this.refreshPhysicsPanel();
    const propertyComponent = this.propertyComponentId
      ? this.history.document.components.find((component) => component.id === this.propertyComponentId) || null
      : null;
    this.refreshLockControl(propertyComponent);
    this.refreshMeasurementControl(propertyComponent);
    this.refreshObjectList();
    this.updateStatus();
    try { this.board.update(); } catch (error) {}
  }

  private createComponentRender(component: ComponentModel): void {
    const definition = SYMBOL_BY_ID[component.kind];
    const renderedObjects: any[] = [];
    try {
      const curve = this.board.create('curve', [[], []], {
        fixed: true,
        highlight: true,
        strokeWidth: COMPONENT_STROKE_WIDTH,
        highlightStrokeWidth: COMPONENT_HIGHLIGHT_STROKE_WIDTH,
        layer: 9,
      });
      renderedObjects.push(curve);
      curve.updateDataArray = () => {
        const current = this.getComponentView(component.id);
        if (!current) {
          curve.dataX = [];
          curve.dataY = [];
          return;
        }
        const xs: number[] = [];
        const ys: number[] = [];
        definition.paths.forEach((path, pathIndex) => {
          if (pathIndex > 0) {
            xs.push(Number.NaN);
            ys.push(Number.NaN);
          }
          path.forEach((point) => {
            const world = transformPoint(point, current.at[0], current.at[1], current.rotation);
            xs.push(world[0]);
            ys.push(world[1]);
          });
        });
        curve.dataX = xs;
        curve.dataY = ys;
      };

      const selection = this.board.create('curve', [[], []], {
        fixed: true,
        highlight: false,
        strokeWidth: 2.1,
        dash: 2,
        layer: 11,
        visible: false,
      });
      renderedObjects.push(selection);
      selection.updateDataArray = () => {
        const current = this.getComponentView(component.id);
        if (!current) {
          selection.dataX = [];
          selection.dataY = [];
          return;
        }
        const [minX, minY, maxX, maxY] = definition.bounds;
        const padding = 0.13;
        const local: Vec2[] = [
          [minX - padding, minY - padding],
          [maxX + padding, minY - padding],
          [maxX + padding, maxY + padding],
          [minX - padding, maxY + padding],
          [minX - padding, minY - padding],
        ];
        const world = local.map((point) => transformPoint(point, current.at[0], current.at[1], current.rotation));
        selection.dataX = world.map((point) => point[0]);
        selection.dataY = world.map((point) => point[1]);
      };

      const terminals = definition.terminals.map((terminal) => {
        const point = this.board.create('point', [
          () => this.getTerminalPoint(component.id, terminal.id)[0],
          () => this.getTerminalPoint(component.id, terminal.id)[1],
        ], {
          name: '',
          withLabel: false,
          fixed: true,
          highlight: true,
          showInfobox: false,
          face: 'o',
          size: 2.7,
          strokeWidth: 2,
          layer: 12,
        });
        renderedObjects.push(point);
        return point;
      });
      const nameLabel = this.board.create('text', [
        () => this.getComponentLabelPlacement(component.id, 'name').point[0],
        () => this.getComponentLabelPlacement(component.id, 'name').point[1],
        () => renderComponentLabel(this.getComponentView(component.id)?.name),
      ], {
        display: 'html',
        parse: false,
        useMathJax: true,
        fixed: true,
        highlight: false,
        anchorX: 'middle',
        anchorY: 'bottom',
        fontSize: 14,
        layer: 10,
      });
      renderedObjects.push(nameLabel);
      const valueLabel = this.board.create('text', [
        () => this.getComponentLabelPlacement(component.id, 'value').point[0],
        () => this.getComponentLabelPlacement(component.id, 'value').point[1],
        () => this.renderComponentValue(component.id),
      ], {
        display: 'html',
        parse: false,
        useMathJax: true,
        fixed: true,
        highlight: false,
        anchorX: 'middle',
        anchorY: 'top',
        fontSize: component.kind === 'ammeter' || component.kind === 'voltmeter' ? 14 : 13,
        layer: 10,
      });
      renderedObjects.push(valueLabel);
      this.componentRenders.set(component.id, {
        kind: component.kind,
        curve,
        selection,
        terminals,
        labels: [nameLabel, valueLabel],
      });
    } catch (error) {
      this.removeBoardObjects(renderedObjects);
      console.warn('[lia-electro] Could not render component', component.id, error);
    }
  }

  private createWireRender(wire: WireModel): void {
    try {
      const curve = this.board.create('curve', [[], []], {
        fixed: true,
        highlight: true,
        strokeWidth: WIRE_STROKE_WIDTH,
        highlightStrokeWidth: 4,
        layer: 6,
      });
      curve.updateDataArray = () => {
        const current = this.history.document.wires.find((candidate) => candidate.id === wire.id);
        const route = current ? routeWire(this.getViewComponents(), current, this.history.document.settings.wireStub) : [];
        curve.dataX = route.map((point) => point[0]);
        curve.dataY = route.map((point) => point[1]);
      };
      this.wireRenders.set(wire.id, { curve });
    } catch (error) {
      console.warn('[lia-electro] Could not render wire', wire.id, error);
    }
  }

  private updateRenderAttributes(theme: ElectroTheme = this.getTheme()): void {
    this.componentRenders.forEach((render, id) => {
      const selected = this.selection?.type === 'component' && this.selection.id === id;
      const labelPlacements = [
        this.getComponentLabelPlacement(id, 'name'),
        this.getComponentLabelPlacement(id, 'value'),
      ];
      this.setObjectAttributes(render.curve, {
        strokeColor: theme.foreground,
        highlightStrokeColor: theme.action,
        strokeWidth: selected ? COMPONENT_SELECTED_STROKE_WIDTH : COMPONENT_STROKE_WIDTH,
      });
      this.setObjectAttributes(render.selection, { strokeColor: theme.action, visible: selected });
      this.setObjectVisible(render.selection, selected);
      render.terminals.forEach((terminal) => this.setObjectAttributes(terminal, {
        strokeColor: this.tool === 'wire' ? theme.action : theme.foreground,
        fillColor: theme.surface,
        highlightStrokeColor: theme.action,
        highlightFillColor: theme.surface,
      }));
      render.labels.forEach((label, index) => this.setObjectAttributes(label, {
        strokeColor: theme.foreground,
        highlightStrokeColor: theme.foreground,
        anchorX: labelPlacements[index]?.anchorX || 'middle',
        anchorY: labelPlacements[index]?.anchorY || 'middle',
      }));
    });
    this.wireRenders.forEach((render, id) => {
      const selected = this.selection?.type === 'wire' && this.selection.id === id;
      this.setObjectAttributes(render.curve, {
        strokeColor: selected ? theme.action : theme.foreground,
        highlightStrokeColor: theme.action,
        strokeWidth: selected ? WIRE_SELECTED_STROKE_WIDTH : WIRE_STROKE_WIDTH,
      });
    });
    if (this.previewCurve) this.setObjectAttributes(this.previewCurve, { strokeColor: theme.action });
  }

  private applyTheme(): void {
    const theme = this.getTheme();
    this.container.dataset.liaElectroMode = theme.mode;
    [this.toolbar, this.palette, this.status, this.objectListClip, this.propertiesClip, this.dialogBackdrop].forEach((element) => {
      element.dataset.liaElectroMode = theme.mode;
      element.style.colorScheme = theme.mode;
      element.style.setProperty('--lia-electro-neutral', theme.foreground);
      element.style.setProperty('--lia-electro-accent', theme.accent);
      element.style.setProperty('--lia-electro-action', theme.action);
      element.style.setProperty('--lia-electro-surface', theme.surface);
      element.style.setProperty('--lia-electro-surface-muted', theme.surfaceMuted);
      element.style.setProperty('--lia-electro-on-accent', theme.onAccent);
      element.style.setProperty('--lia-electro-shadow', theme.shadow);
      element.style.setProperty('--lia-electro-backdrop', theme.backdrop);
      element.style.setProperty('--lia-electro-terminal-fill', theme.surface);
    });
    this.updateRenderAttributes(theme);
    try { this.board.update(); } catch (error) {}
  }

  private onToolbarClick(event: Event): void {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>('button[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    switch (action) {
      case 'components':
        this.palette.hidden = !this.palette.hidden;
        button.setAttribute('aria-expanded', String(!this.palette.hidden));
        break;
      case 'select': this.setTool('select'); break;
      case 'wire': this.setTool('wire'); break;
      case 'rotate': this.rotateSelection(); break;
      case 'properties': {
        if (this.selection?.type !== 'component') break;
        this.openProperties(this.selection.id, button);
        break;
      }
      case 'remove': this.deleteSelection(); break;
      case 'undo': this.undo(); break;
      case 'redo': this.redo(); break;
      case 'objectList': {
        this.palette.hidden = true;
        this.buttons.get('components')?.setAttribute('aria-expanded', 'false');
        this.setTool('select');
        this.setObjectListOpen(!this.isObjectListOpen(), false);
        break;
      }
      case 'clear': this.clearCircuit(); break;
    }
  }

  private onPaletteClick(event: Event): void {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>('button[data-symbol]');
    if (!button) return;
    const kind = button.dataset.symbol as SymbolId;
    if (!isComponentAllowed(this.config, kind)) return;
    this.setTool('place', kind);
    this.palette.hidden = true;
    this.buttons.get('components')?.setAttribute('aria-expanded', 'false');
  }

  private onDialogClick(event: Event): void {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>('button[data-dialog-action]');
    if (!button) return;
    switch (button.dataset.dialogAction) {
      case 'back':
        this.setDialogStep(this.dialogStep === 'macro' ? 'quiz' : 'components');
        break;
      case 'copy':
        if (this.dialogStep === 'components') this.setDialogStep('quiz');
        else if (this.dialogStep === 'quiz') {
          if (this.commitDialogQuiz()) this.setDialogStep('macro');
        } else this.copyDialogText();
        break;
      case 'download':
        if (this.dialogStep === 'macro') this.downloadMacros(this.dialogTextarea.value);
        break;
      case 'close': this.closeDialog(); break;
    }
  }

  private onContextMenu(event: MouseEvent): void {
    if (this.destroyed || this.isInterfaceEvent(event)) return;
    const pointer = this.eventToPointer(event);
    if (!pointer) return;
    const component = this.findComponentAt(pointer.user);
    if (!component) {
      if (this.isPropertiesOpen()) {
        this.consumePointerEvent(event);
        this.closeProperties(false);
      }
      return;
    }
    this.consumePointerEvent(event);
    if (!this.canOpenProperties(component)) {
      this.closeProperties(false);
      this.select({ type: 'component', id: component.id });
      this.setStatus(this.isProtectedComponent(component)
        ? TEXT[this.language].protectedObject
        : TEXT[this.language].propertiesRestricted);
      return;
    }
    this.openProperties(component.id, this.container);
  }

  private onPointerDown(event: PointerEvent): void {
    if (this.destroyed || this.isInterfaceEvent(event) || event.button > 0) return;
    const pointer = this.eventToPointer(event);
    if (!pointer) return;
    try { this.container.focus({ preventScroll: true }); } catch (error) {}

    if (this.tool === 'place' && this.placementKind) {
      this.consumePointerEvent(event);
      this.addComponent(this.placementKind, pointer.user);
      return;
    }

    if (this.tool === 'wire') {
      this.consumePointerEvent(event);
      const terminal = this.findTerminalAt(pointer.localX, pointer.localY);
      if (terminal) this.handleWireTerminal(terminal);
      return;
    }

    const component = this.findComponentAt(pointer.user);
    if (component) {
      this.consumePointerEvent(event);
      this.select({ type: 'component', id: component.id });
      if (component.locked === true || this.isProtectedComponent(component)) return;
      this.drag = {
        componentId: component.id,
        pointerId: event.pointerId,
        offset: [pointer.user[0] - component.at[0], pointer.user[1] - component.at[1]],
      };
      try { this.container.setPointerCapture(event.pointerId); } catch (error) {}
      return;
    }

    const wire = this.findWireAt(pointer.localX, pointer.localY);
    if (wire) {
      this.consumePointerEvent(event);
      this.select({ type: 'wire', id: wire.id });
      return;
    }

    this.select(null);
  }

  private onPointerMove(event: PointerEvent): void {
    const pointer = this.eventToPointer(event);
    if (!pointer) return;
    if (this.drag && this.drag.pointerId === event.pointerId) {
      this.consumePointerEvent(event);
      const component = this.history.document.components.find((candidate) => candidate.id === this.drag!.componentId);
      if (!component || component.locked === true || this.isProtectedComponent(component)) {
        this.transientPositions.delete(this.drag.componentId);
        this.drag = null;
        try { this.container.releasePointerCapture(event.pointerId); } catch (error) {}
        try { this.board.update(); } catch (error) {}
        return;
      }
      const next = snapPoint([
        pointer.user[0] - this.drag.offset[0],
        pointer.user[1] - this.drag.offset[1],
      ], this.history.document.settings.snapStep);
      this.transientPositions.set(this.drag.componentId, next);
      try { this.board.update(); } catch (error) {}
      return;
    }
    if (this.tool === 'wire' && this.pendingWire) {
      this.pointerPreview = snapPoint(pointer.user, this.history.document.settings.snapStep);
      this.updatePreviewVisibility();
      try { this.board.update(); } catch (error) {}
    }
  }

  private onPointerUp(event: PointerEvent): void {
    if (!this.drag || this.drag.pointerId !== event.pointerId) return;
    this.consumePointerEvent(event);
    const componentId = this.drag.componentId;
    const nextAt = this.transientPositions.get(componentId);
    this.drag = null;
    this.transientPositions.delete(componentId);
    try { this.container.releasePointerCapture(event.pointerId); } catch (error) {}
    if (!nextAt) return;
    const next = this.document;
    const component = next.components.find((candidate) => candidate.id === componentId);
    if (!component || component.locked === true || this.isProtectedComponent(component)) return;
    component.at = nextAt;
    this.commit(next);
  }

  private onPointerCancel(event: PointerEvent): void {
    if (!this.drag || this.drag.pointerId !== event.pointerId) return;
    this.transientPositions.delete(this.drag.componentId);
    this.drag = null;
    try { this.board.update(); } catch (error) {}
  }

  private onKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if (!this.dialogBackdrop.hidden) {
      if (key === 'escape') {
        event.preventDefault();
        event.stopPropagation();
        this.closeDialog();
        return;
      }
      if (key === 'tab') {
        this.trapDialogFocus(event);
        return;
      }
      if (this.dialogBackdrop.contains(event.target as Node | null)) return;
      event.preventDefault();
      this.dialogFocusableElements()[0]?.focus();
      return;
    }
    if (this.propertiesPanel.contains(event.target as Node | null)) return;
    if (this.objectListPanel.contains(event.target as Node | null)) {
      if (key === 'escape') {
        event.preventDefault();
        event.stopPropagation();
        this.setObjectListOpen(false, true);
      }
      return;
    }
    if (isEditableTarget(event.target)) return;
    if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
      if (this.selection?.type !== 'component') return;
      event.preventDefault();
      event.stopPropagation();
      this.openProperties(this.selection.id, this.container);
      return;
    }
    const command = event.ctrlKey || event.metaKey;
    if (command && key === 'z') {
      event.preventDefault();
      if (event.shiftKey) this.redo(); else this.undo();
      return;
    }
    if (command && key === 'y') {
      event.preventDefault();
      this.redo();
      return;
    }
    switch (key) {
      case 'escape':
        if (!this.dialogBackdrop.hidden) this.closeDialog();
        else if (this.pendingWire) this.cancelPendingWire();
        else if (this.isObjectListOpen()) this.setObjectListOpen(false, true);
        else this.setTool('select');
        break;
      case 'delete':
      case 'backspace':
        event.preventDefault();
        this.deleteSelection();
        break;
      case 'r':
        event.preventDefault();
        this.rotateSelection();
        break;
      case 'w':
        event.preventDefault();
        this.setTool('wire');
        break;
      case 'v':
        event.preventDefault();
        this.setTool('select');
        break;
      case ' ':
        if (this.pendingWire) {
          event.preventDefault();
          this.pendingWire.route = oppositeRoute(this.pendingWire.route);
          try { this.board.update(); } catch (error) {}
        }
        break;
    }
  }

  private addComponent(kind: SymbolId, point: Vec2): void {
    if (!isComponentAllowed(this.config, kind)) {
      this.setTool('select');
      return;
    }
    const next = this.document;
    const component: ComponentModel = {
      id: nextEntityId('c', next.components.map((candidate) => candidate.id)),
      kind,
      at: snapPoint(point, next.settings.snapStep),
      rotation: 0,
      origin: 'editor',
    };
    next.components.push(component);
    this.selection = { type: 'component', id: component.id };
    this.commit(next);
  }

  private handleWireTerminal(reference: PortReference): void {
    const text = TEXT[this.language];
    if (!this.pendingWire) {
      const pose = resolvePort(this.getViewComponents(), reference);
      if (!pose) return;
      this.pendingWire = { from: reference, route: defaultRouteForDirection(pose.direction) };
      this.pointerPreview = pose.point;
      this.updatePreviewVisibility();
      this.updateStatus();
      return;
    }
    if (samePort(this.pendingWire.from, reference)) {
      this.setStatus(text.samePort);
      return;
    }
    const current = this.history.document;
    const duplicate = current.wires.some((wire) =>
      (samePort(wire.from, this.pendingWire!.from) && samePort(wire.to, reference)) ||
      (samePort(wire.to, this.pendingWire!.from) && samePort(wire.from, reference)));
    if (duplicate) {
      this.setStatus(text.duplicateWire);
      return;
    }
    const next = this.document;
    const wire: WireModel = {
      id: nextEntityId('w', next.wires.map((candidate) => candidate.id)),
      from: { ...this.pendingWire.from },
      to: { ...reference },
      route: this.pendingWire.route,
    };
    next.wires.push(wire);
    this.pendingWire = null;
    this.pointerPreview = null;
    this.selection = { type: 'wire', id: wire.id };
    this.commit(next);
  }

  private rotateSelection(): void {
    if (!this.selection) return;
    const next = this.document;
    if (this.selection.type === 'component') {
      const component = next.components.find((candidate) => candidate.id === this.selection!.id);
      if (!component) return;
      if (this.isProtectedComponent(component)) {
        this.setStatus(TEXT[this.language].protectedObject);
        return;
      }
      if (component.locked === true) {
        this.setStatus(TEXT[this.language].selectedLockedComponent(
          SYMBOL_BY_ID[component.kind].label[this.language],
        ));
        return;
      }
      component.rotation = normalizeRotation(component.rotation + 90);
    } else {
      const wire = next.wires.find((candidate) => candidate.id === this.selection!.id);
      if (!wire) return;
      if (this.isProtectedWire(wire)) {
        this.setStatus(TEXT[this.language].protectedObject);
        return;
      }
      wire.route = oppositeRoute(wire.route);
    }
    this.commit(next);
  }

  private deleteSelection(): void {
    this.closeProperties(false);
    if (!this.selection) {
      this.setStatus(TEXT[this.language].emptyStatus);
      return;
    }
    if (this.isSelectionProtected()) {
      this.setStatus(TEXT[this.language].protectedObject);
      return;
    }
    const next = this.document;
    if (this.selection.type === 'component') {
      const id = this.selection.id;
      next.components = next.components.filter((component) => component.id !== id);
      next.wires = next.wires.filter((wire) => wire.from.componentId !== id && wire.to.componentId !== id);
    } else {
      next.wires = next.wires.filter((wire) => wire.id !== this.selection!.id);
    }
    this.selection = null;
    this.commit(next);
  }

  private clearCircuit(): void {
    this.closeProperties(false);
    const current = this.history.document;
    const resetBaseline = this.isBaselineProtectionEnabled();
    const target = resetBaseline
      ? cloneCircuit(this.baseline)
      : createEmptyCircuit(current.settings);
    if (sameCircuitDocument(current, target)) {
      this.setStatus(resetBaseline
        ? TEXT[this.language].noAdditions
        : TEXT[this.language].emptyStatus);
      return;
    }
    if (!window.confirm(resetBaseline
      ? TEXT[this.language].clearBaselineConfirm
      : TEXT[this.language].clearConfirm)) return;
    this.selection = null;
    this.cancelPendingWire();
    this.commit(target);
  }

  private setTool(mode: ToolMode, kind: SymbolId | null = null): void {
    if (mode === 'place' && (!kind || !isComponentAllowed(this.config, kind))) {
      mode = 'select';
      kind = null;
    }
    this.tool = mode;
    this.placementKind = mode === 'place' ? kind : null;
    if (mode !== 'wire') this.cancelPendingWire();
    this.buttons.get('select')?.setAttribute('aria-pressed', String(mode === 'select'));
    this.buttons.get('wire')?.setAttribute('aria-pressed', String(mode === 'wire'));
    this.palette.querySelectorAll<HTMLButtonElement>('button[data-symbol]').forEach((button) => {
      button.setAttribute('aria-pressed', String(mode === 'place' && button.dataset.symbol === kind));
    });
    this.updateRenderAttributes();
    this.updatePreviewVisibility();
    this.updateStatus();
    try { this.board.update(); } catch (error) {}
  }

  private select(selection: Selection): void {
    if (
      this.propertyComponentId &&
      (selection?.type !== 'component' || selection.id !== this.propertyComponentId)
    ) this.closeProperties(false);
    this.selection = selection;
    this.updateRenderAttributes();
    this.updateButtons();
    this.updateObjectListSelection();
    this.updateStatus();
    try { this.board.update(); } catch (error) {}
  }

  private commit(next: CircuitDocument): void {
    const validated = validateCircuit(next);
    if (!this.preservesProtectedEntities(validated)) {
      this.reconcileRenders();
      this.setStatus(TEXT[this.language].protectedObject);
      return;
    }
    if (!this.history.commit(validated)) {
      this.reconcileRenders();
      return;
    }
    this.persist();
    this.reconcileRenders();
  }

  private persist(): void {
    window.__electroDocuments = window.__electroDocuments || {};
    window.__electroDocuments[this.boardId] = this.document;
  }

  private isBaselineProtectionEnabled(): boolean {
    return hasElectroRestriction(this.config, ELECTRO_RESTRICTIONS.baselineLocked);
  }

  private isProtectedComponent(component: ComponentModel | null | undefined): boolean {
    if (!component || !this.isBaselineProtectionEnabled()) return false;
    return component.origin === 'macro' ||
      this.baseline.components.some((candidate) => candidate.id === component.id);
  }

  private isProtectedWire(wire: WireModel | null | undefined): boolean {
    if (!wire || !this.isBaselineProtectionEnabled()) return false;
    return this.baseline.wires.some((candidate) => candidate.id === wire.id);
  }

  private isSelectionProtected(): boolean {
    if (!this.selection || !this.isBaselineProtectionEnabled()) return false;
    if (this.selection.type === 'component') {
      return this.isProtectedComponent(this.history.document.components.find(
        (component) => component.id === this.selection!.id,
      ));
    }
    return this.isProtectedWire(this.history.document.wires.find(
      (wire) => wire.id === this.selection!.id,
    ));
  }

  private restoreBaselineEntities(document: CircuitDocument): CircuitDocument {
    const next = cloneCircuit(document);
    const baseline = cloneCircuit(this.baseline);
    const componentIds = new Set(baseline.components.map((component) => component.id));
    const wireIds = new Set(baseline.wires.map((wire) => wire.id));
    next.components = [
      ...baseline.components,
      ...next.components.filter((component) => !componentIds.has(component.id)),
    ];
    next.wires = [
      ...baseline.wires,
      ...next.wires.filter((wire) => !wireIds.has(wire.id)),
    ];
    return next;
  }

  private preservesProtectedEntities(next: CircuitDocument): boolean {
    if (!this.isBaselineProtectionEnabled()) return true;
    const expectedComponents = new Map(
      this.baseline.components.map((component) => [component.id, component]),
    );
    this.history.document.components.forEach((component) => {
      if (component.origin === 'macro' && !expectedComponents.has(component.id)) {
        expectedComponents.set(component.id, component);
      }
    });
    for (const expected of expectedComponents.values()) {
      const actual = next.components.find((component) => component.id === expected.id);
      if (!actual || !sameComponentModel(actual, expected)) return false;
    }
    for (const expected of this.baseline.wires) {
      const actual = next.wires.find((wire) => wire.id === expected.id);
      if (!actual || !sameWireModel(actual, expected)) return false;
    }
    return true;
  }

  private cancelPendingWire(): void {
    this.pendingWire = null;
    this.pointerPreview = null;
    this.updatePreviewVisibility();
  }

  private applyRuntimeProfile(): void {
    if (!this.palette || !this.objectListExportButton) return;
    let hasAllowedComponent = false;
    this.palette.querySelectorAll<HTMLButtonElement>('button[data-symbol]').forEach((button) => {
      const kind = button.dataset.symbol as SymbolId;
      const allowed = isComponentAllowed(this.config, kind);
      hasAllowedComponent ||= allowed;
      button.hidden = !allowed;
      button.disabled = !allowed;
      button.tabIndex = allowed ? 0 : -1;
      button.setAttribute('aria-hidden', String(!allowed));
    });
    const componentsButton = this.buttons.get('components');
    if (componentsButton) componentsButton.disabled = !hasAllowedComponent;
    if (!hasAllowedComponent) {
      this.palette.hidden = true;
      componentsButton?.setAttribute('aria-expanded', 'false');
    }
    if (this.tool === 'place' && (!this.placementKind || !isComponentAllowed(this.config, this.placementKind))) {
      this.setTool('select');
    }

    const propertyComponent = this.propertyComponentId
      ? this.history.document.components.find((component) => component.id === this.propertyComponentId) || null
      : null;
    if (propertyComponent && !this.canOpenProperties(propertyComponent)) this.closeProperties(false);
    this.refreshMeasurementControl(propertyComponent);

    const exportLocked = hasElectroRestriction(this.config, ELECTRO_RESTRICTIONS.exportLocked);
    this.objectListExportButton.hidden = exportLocked;
    this.objectListExportButton.disabled = exportLocked;
    this.objectListExportButton.parentElement?.toggleAttribute('hidden', exportLocked);
    this.objectListExportButton.tabIndex = this.isObjectListOpen() && !exportLocked ? 0 : -1;
    if (exportLocked && !this.dialogBackdrop.hidden) this.closeDialog();

    this.objectListSignature = '';
    this.refreshObjectList(true);
    this.updateButtons();
    this.updateStatus();
    try { this.board.update(); } catch (error) {}
  }

  private currentDialogProfile(): ElectroExportProfile {
    return {
      componentIds: new Set(this.dialogSelectedComponentIds),
      restrictionIds: new Set(this.dialogSelectedRestrictionIds),
      completionQuizSpec: this.dialogCompletionQuizSpec || null,
    };
  }

  private initializeDialogQuiz(): void {
    let rule: CompletionRule | null = null;
    try {
      if (this.completionQuizSpec) rule = parseCompletionRule(this.completionQuizSpec);
    } catch (error) {}
    this.dialogQuizEnabledInput.checked = !!rule;
    this.dialogQuizConditionSelect.value = rule?.condition || 'closed';
    this.dialogQuizComponentSelect.dataset.preferred = rule?.componentId || '';
    this.dialogQuizTargetInput.value = rule?.target == null ? '' : String(rule.target);
    this.dialogQuizToleranceInput.value = rule?.target == null ? '' : String(rule.tolerance);
    this.dialogQuizMagnitudeInput.checked = rule?.magnitude !== false;
    this.dialogQuizPreserveInput.checked = rule?.preserveBaseline !== false;
    this.dialogQuizChangedInput.checked = rule?.requireChange !== false;
    this.dialogQuizRequiredInputs.forEach(({ checkbox, count }, kind) => {
      const requiredCount = rule?.requiredAdded.get(kind) || 0;
      checkbox.checked = requiredCount > 0;
      count.value = String(requiredCount || 1);
    });
    this.dialogCompletionQuizSpec = rule ? formatCompletionRule(rule, this.boardId) : undefined;
    this.dialogQuizError.hidden = true;
    this.dialogQuizError.textContent = '';
    this.dialogQuizError.title = '';
    this.refreshDialogQuizControls(true);
  }

  private refreshDialogQuizControls(rebuildMeters = false): void {
    if (!this.dialogQuizStep) return;
    const text = TEXT[this.language];
    const enabled = this.dialogQuizEnabledInput.checked;
    const condition = COMPLETION_CONDITIONS.includes(this.dialogQuizConditionSelect.value as CompletionCondition)
      ? this.dialogQuizConditionSelect.value as CompletionCondition
      : 'closed';
    const meterKind = condition === 'ammeter-current'
      ? 'ammeter'
      : condition === 'voltmeter-voltage'
        ? 'voltmeter'
        : null;
    const hasTarget = condition !== 'closed';
    const fields = this.dialogQuizStep.querySelector<HTMLElement>('[data-role="dialog-quiz-fields"]');
    fields?.toggleAttribute('data-disabled', !enabled);
    fields?.setAttribute('aria-disabled', String(!enabled));

    this.dialogQuizConditionSelect.disabled = !enabled;
    this.dialogQuizComponentField.hidden = !meterKind;
    this.dialogQuizComponentSelect.disabled = !enabled || !meterKind;
    this.dialogQuizTargetField.hidden = !hasTarget;
    this.dialogQuizTargetInput.disabled = !enabled || !hasTarget;
    this.dialogQuizToleranceField.hidden = !hasTarget;
    this.dialogQuizToleranceInput.disabled = !enabled || !hasTarget;
    this.dialogQuizMagnitudeField.hidden = !meterKind;
    this.dialogQuizMagnitudeInput.disabled = !enabled || this.dialogQuizMagnitudeField.hidden;
    this.dialogQuizPreserveInput.disabled = !enabled;
    this.dialogQuizChangedInput.disabled = !enabled;

    if (rebuildMeters || this.dialogQuizComponentSelect.dataset.meterKind !== String(meterKind || '')) {
      const preferred = this.dialogQuizComponentSelect.dataset.preferred || this.dialogQuizComponentSelect.value;
      this.dialogQuizComponentSelect.replaceChildren();
      const candidates = meterKind
        ? this.history.document.components.filter((component) => component.kind === meterKind)
        : [];
      if (candidates.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = text.quizNoMeter;
        this.dialogQuizComponentSelect.appendChild(option);
      } else {
        candidates.forEach((component) => {
          const option = document.createElement('option');
          option.value = component.id;
          option.textContent = `${component.name || component.id} (${component.id})`;
          this.dialogQuizComponentSelect.appendChild(option);
        });
        this.dialogQuizComponentSelect.value = candidates.some((component) => component.id === preferred)
          ? preferred
          : candidates[0].id;
      }
      this.dialogQuizComponentSelect.dataset.meterKind = meterKind || '';
      delete this.dialogQuizComponentSelect.dataset.preferred;
    }

    this.dialogQuizRequiredInputs.forEach(({ checkbox, count }) => {
      checkbox.disabled = !enabled;
      count.disabled = !enabled || !checkbox.checked;
    });
    this.dialogQuizError.hidden = true;
    this.dialogQuizError.textContent = '';
    this.dialogQuizError.title = '';
  }

  private commitDialogQuiz(): boolean {
    this.dialogQuizError.hidden = true;
    this.dialogQuizError.textContent = '';
    this.dialogQuizError.title = '';
    if (!this.dialogQuizEnabledInput.checked) {
      this.dialogCompletionQuizSpec = undefined;
      return true;
    }
    const text = TEXT[this.language];
    const condition = this.dialogQuizConditionSelect.value as CompletionCondition;
    const unsupported = this.history.document.components.find(
      (component) => !COMPLETION_REQUIRED_KINDS.includes(component.kind),
    );
    if (unsupported) {
      this.dialogQuizError.textContent = text.quizUnsupported(
        SYMBOL_BY_ID[unsupported.kind].label[this.language],
      );
      this.dialogQuizError.hidden = false;
      return false;
    }
    const needsMeter = condition === 'ammeter-current' || condition === 'voltmeter-voltage';
    const needsTarget = condition !== 'closed';
    if (needsMeter && !this.dialogQuizComponentSelect.value) {
      this.dialogQuizError.textContent = text.quizMeterMissing;
      this.dialogQuizError.hidden = false;
      this.dialogQuizComponentSelect.focus();
      return false;
    }
    if (needsTarget && !this.dialogQuizTargetInput.value.trim()) {
      this.dialogQuizError.textContent = text.quizInvalid;
      this.dialogQuizError.hidden = false;
      this.dialogQuizTargetInput.focus();
      return false;
    }

    const parts = [this.boardId, `condition=${condition}`];
    if (needsMeter) parts.push(`component=${this.dialogQuizComponentSelect.value}`);
    if (needsTarget) parts.push(`target=${this.dialogQuizTargetInput.value.trim()}`);
    if (needsTarget && this.dialogQuizToleranceInput.value.trim()) {
      parts.push(`tolerance=${this.dialogQuizToleranceInput.value.trim()}`);
    }
    if (needsMeter && !this.dialogQuizMagnitudeInput.checked) {
      parts.push('mode=signed');
    }
    const required: string[] = [];
    for (const [kind, inputs] of this.dialogQuizRequiredInputs) {
      if (!inputs.checkbox.checked) continue;
      const count = Number(inputs.count.value);
      if (!Number.isSafeInteger(count) || count < 1 || count > 99) {
        this.dialogQuizError.textContent = text.quizInvalid;
        this.dialogQuizError.hidden = false;
        inputs.count.focus();
        return false;
      }
      required.push(`${kind}:${count}`);
    }
    if (required.length > 0) parts.push(`required=[${required.join(';')}]`);
    parts.push(`preserve=${this.dialogQuizPreserveInput.checked ? 1 : 0}`);
    parts.push(`changed=${this.dialogQuizChangedInput.checked ? 1 : 0}`);

    try {
      const rule = parseCompletionRule(parts.join(';'));
      this.dialogCompletionQuizSpec = formatCompletionRule(rule, this.boardId);
      rule.requiredAdded.forEach((_count, kind) => {
        this.dialogSelectedComponentIds.add(ELECTRO_COMPONENT_CAPABILITIES[kind]);
      });
      if (rule.preserveBaseline) {
        this.dialogSelectedRestrictionIds.add(ELECTRO_RESTRICTIONS.baselineLocked);
      }
      this.renderDialogSelection();
      return true;
    } catch (error) {
      this.dialogQuizError.textContent = text.quizInvalid;
      this.dialogQuizError.title = error instanceof Error ? error.message : '';
      this.dialogQuizError.hidden = false;
      return false;
    }
  }

  private toggleDialogComponent(kind: SymbolId): void {
    const capabilityId = ELECTRO_COMPONENT_CAPABILITIES[kind];
    if (this.dialogSelectedComponentIds.has(capabilityId)) {
      this.dialogSelectedComponentIds.delete(capabilityId);
    } else {
      this.dialogSelectedComponentIds.add(capabilityId);
    }
    this.renderDialogSelection();
  }

  private toggleDialogRestriction(restrictionId: number, enabled: boolean): void {
    if (enabled) {
      if (restrictionId === ELECTRO_RESTRICTIONS.componentPropertiesLocked) {
        this.dialogSelectedRestrictionIds.delete(ELECTRO_RESTRICTIONS.macroComponentPropertiesLocked);
      } else if (restrictionId === ELECTRO_RESTRICTIONS.macroComponentPropertiesLocked) {
        this.dialogSelectedRestrictionIds.delete(ELECTRO_RESTRICTIONS.componentPropertiesLocked);
      }
      this.dialogSelectedRestrictionIds.add(restrictionId);
    } else {
      this.dialogSelectedRestrictionIds.delete(restrictionId);
    }
    this.renderDialogSelection();
  }

  private renderDialogSelection(): void {
    if (!this.dialogBackdrop) return;
    const text = TEXT[this.language];
    const interactive = !this.dialogBackdrop.hidden && this.dialogStep === 'components';
    this.dialogComponentButtons.forEach((button, kind) => {
      const enabled = this.dialogSelectedComponentIds.has(ELECTRO_COMPONENT_CAPABILITIES[kind]);
      button.dataset.enabled = enabled ? '1' : '0';
      button.setAttribute('aria-pressed', String(enabled));
      const label = SYMBOL_BY_ID[kind].label[this.language];
      button.title = label;
      button.setAttribute('aria-label', `${label}: ${enabled ? text.available : text.unavailable}`);
      button.tabIndex = interactive ? 0 : -1;
      const status = button.querySelector<HTMLElement>('.lia-electro-export-component-status');
      if (status) status.textContent = enabled ? '\u2713' : '\u00d7';
    });
    this.dialogRestrictionInputs.forEach((input, restrictionId) => {
      input.checked = this.dialogSelectedRestrictionIds.has(restrictionId);
      input.tabIndex = interactive ? 0 : -1;
    });
  }

  private setDialogStep(step: ExportDialogStep): void {
    this.dialogStep = step;
    this.refreshDialogStep(true);
  }

  private refreshDialogStep(focus: boolean): void {
    if (!this.dialog) return;
    const text = TEXT[this.language];
    const componentsStep = this.dialogStep === 'components';
    const quizStep = this.dialogStep === 'quiz';
    const macroStep = this.dialogStep === 'macro';
    const open = !this.dialogBackdrop.hidden;
    this.dialogComponentsStep.hidden = !componentsStep;
    this.dialogComponentsStep.inert = !componentsStep;
    this.dialogQuizStep.hidden = !quizStep;
    this.dialogQuizStep.inert = !quizStep;
    this.dialogMacroStep.hidden = !macroStep;
    this.dialogMacroStep.inert = !macroStep;
    this.dialogTitle.textContent = componentsStep
      ? text.exportComponentsTitle
      : quizStep
        ? text.exportQuizTitle
        : text.dialogTitle;
    this.dialogCopyButton.textContent = macroStep ? text.copy : text.next;
    this.dialogBackButton.hidden = componentsStep;
    this.dialogDownloadButton.hidden = !macroStep;
    this.dialogBackButton.tabIndex = open && !componentsStep ? 0 : -1;
    this.dialogDownloadButton.tabIndex = open && macroStep ? 0 : -1;
    this.dialogCloseButton.tabIndex = open ? 0 : -1;
    this.dialogCopyButton.tabIndex = open ? 0 : -1;
    this.dialogTextarea.tabIndex = open && macroStep ? 0 : -1;
    this.dialog.setAttribute(
      'aria-describedby',
      componentsStep
        ? this.dialogComponentsHint.id
        : quizStep
          ? this.dialogQuizHint.id
          : `lia-electro-export-help-${this.uid}`,
    );
    this.renderDialogSelection();
    if (quizStep) this.refreshDialogQuizControls();
    if (open && macroStep) {
      this.dialogTextarea.value = this.exportMacros(undefined, this.currentDialogProfile());
    }
    if (!focus || !open) return;
    const expectedStep = this.dialogStep;
    window.setTimeout(() => {
      if (this.dialogBackdrop.hidden || this.dialogStep !== expectedStep) return;
      if (componentsStep) {
        this.dialogComponentButtons.values().next().value?.focus();
      } else if (quizStep) {
        this.dialogQuizEnabledInput.focus();
      } else {
        this.dialogTextarea.focus();
        this.dialogTextarea.select();
      }
    }, 0);
  }

  private openDialog(returnFocus: HTMLElement = this.container): void {
    if (hasElectroRestriction(this.config, ELECTRO_RESTRICTIONS.exportLocked)) return;
    this.closeProperties(false);
    this.dialogReturnFocus = returnFocus;
    this.dialogSelectedComponentIds = new Set(
      this.config.componentIds === null
        ? Object.values(ELECTRO_COMPONENT_CAPABILITIES)
        : this.config.componentIds,
    );
    this.dialogSelectedRestrictionIds = new Set(this.config.restrictionIds);
    this.initializeDialogQuiz();
    this.dialogBackdrop.hidden = false;
    this.dialogBackdrop.inert = false;
    this.dialogBackdrop.setAttribute('aria-hidden', 'false');
    this.objectListExportButton.setAttribute('aria-expanded', 'true');
    this.setDialogStep('components');
  }

  private dialogFocusableElements(): HTMLElement[] {
    return Array.from(
      this.dialog.querySelectorAll<HTMLElement>('button, input, select, textarea'),
    ).filter((element) =>
      element.tabIndex >= 0 &&
      !('disabled' in element && (element as HTMLButtonElement | HTMLInputElement).disabled) &&
      !element.hidden &&
      !element.closest('[hidden]'),
    );
  }

  private trapDialogFocus(event: KeyboardEvent): void {
    const focusable = this.dialogFocusableElements();
    if (!focusable.length) return;
    const active = (this.dialogBackdrop.getRootNode() as Document | ShadowRoot).activeElement;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!focusable.includes(active as HTMLElement)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private closeDialog(): void {
    const wasOpen = !this.dialogBackdrop.hidden;
    this.dialogBackdrop.hidden = true;
    this.dialogBackdrop.inert = true;
    this.dialogBackdrop.setAttribute('aria-hidden', 'true');
    this.dialogComponentButtons.forEach((button) => { button.tabIndex = -1; });
    this.dialogRestrictionInputs.forEach((input) => { input.tabIndex = -1; });
    this.dialogTextarea.tabIndex = -1;
    this.dialogBackButton.tabIndex = -1;
    this.dialogDownloadButton.tabIndex = -1;
    this.dialogCloseButton.tabIndex = -1;
    this.dialogCopyButton.tabIndex = -1;
    this.objectListExportButton.setAttribute('aria-expanded', 'false');
    const returnFocus = this.dialogReturnFocus;
    this.dialogReturnFocus = null;
    if (!wasOpen) return;
    const directTargetAvailable = returnFocus?.isConnected &&
      !('disabled' in returnFocus && returnFocus.disabled) &&
      !returnFocus.hidden;
    const target = directTargetAvailable
      ? returnFocus
      : (this.isObjectListOpen() && !this.objectListExportButton.hidden
          ? this.objectListExportButton
          : this.buttons.get('objectList')) || this.container;
    try { target.focus({ preventScroll: true }); } catch (error) {}
  }

  private copyDialogText(): void {
    const text = TEXT[this.language];
    const fallback = () => {
      this.dialogTextarea.focus();
      this.dialogTextarea.select();
      try {
        if (typeof document.execCommand === 'function' && document.execCommand('copy')) {
          this.markMacroCopied();
          return;
        }
      } catch (error) {}
      this.setStatus(text.copyFailed);
    };
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(this.dialogTextarea.value)
          .then(() => this.markMacroCopied())
          .catch(fallback);
        return;
      }
    } catch (error) {}
    fallback();
  }

  private markMacroCopied(): void {
    const text = TEXT[this.language];
    const button = this.dialogBackdrop.querySelector<HTMLButtonElement>('[data-dialog-action="copy"]');
    this.setStatus(text.copied);
    if (!button) return;
    button.textContent = text.copied;
    window.setTimeout(() => {
      button.textContent = this.dialogStep === 'macro'
        ? TEXT[this.language].copy
        : TEXT[this.language].next;
    }, 1200);
  }

  private refreshPropertyValueText(component: ComponentModel | null): void {
    const text = TEXT[this.language];
    let label: string = text.valueLabel;
    let placeholder: string = text.valuePlaceholder;
    if (component?.kind === 'battery' || component?.kind === 'voltage-source') {
      label = text.sourceValueLabel;
      placeholder = text.sourceValuePlaceholder;
    } else if (component?.kind === 'resistor' || component?.kind === 'variable-resistor') {
      label = text.resistanceValueLabel;
      placeholder = text.resistanceValuePlaceholder;
    }
    this.propertiesValueInput.setAttribute('aria-label', label);
    this.propertiesValueInput.placeholder = placeholder;
    const valueLabel = this.propertiesPanel.querySelector<HTMLElement>('[data-role="properties-value-label"]');
    if (valueLabel) valueLabel.textContent = label;
  }

  private refreshMeasurementControl(component: ComponentModel | null): void {
    if (!this.propertiesMeasurementField || !this.propertiesMeasurementInput) return;
    const isMeter = component?.kind === 'ammeter' || component?.kind === 'voltmeter';
    const restricted = hasElectroRestriction(
      this.config,
      ELECTRO_RESTRICTIONS.measurementControlsLocked,
    );
    this.propertiesMeasurementField.hidden = !isMeter || restricted;
    this.propertiesMeasurementInput.disabled = !isMeter || restricted;
    this.propertiesMeasurementInput.checked = isMeter && component.showMeasurement !== false;
    this.propertiesMeasurementInput.tabIndex = isMeter && !restricted && this.isPropertiesOpen() ? 0 : -1;
  }

  private refreshLockControl(component: ComponentModel | null): void {
    if (!this.propertiesLockInput) return;
    this.propertiesLockInput.checked = component?.locked === true;
    this.propertiesLockInput.disabled = !component;
    this.propertiesLockInput.tabIndex = component && this.isPropertiesOpen() ? 0 : -1;
  }

  private refreshPhysicsPanel(): void {
    if (!this.propertiesPhysicsStatus || !this.propertiesPhysicsValues) return;
    this.propertiesPhysicsValues.replaceChildren();
    this.propertiesValueInput.setAttribute('aria-invalid', 'false');
    if (!this.propertyComponentId) {
      this.propertiesPhysicsStatus.dataset.status = this.dcAnalysis.status;
      this.propertiesPhysicsStatus.textContent = this.physicsStatusText(false);
      return;
    }

    const circuit = this.dcAnalysis.circuits.find((candidate) =>
      candidate.componentIds.includes(this.propertyComponentId!));
    if (!circuit) {
      this.propertiesPhysicsStatus.dataset.status = 'no-source';
      this.propertiesPhysicsStatus.textContent = TEXT[this.language].physicsNotConnected;
      return;
    }
    this.propertiesPhysicsStatus.dataset.status = circuit.status;
    this.propertiesPhysicsStatus.textContent = this.physicsStatusText(
      false,
      circuit.status,
      circuit.componentIds,
    );
    const valueIssue = this.dcAnalysis.diagnostics.find((candidate) =>
      candidate.componentId === this.propertyComponentId &&
      (candidate.code === 'missing-value' || candidate.code === 'invalid-value'));
    this.propertiesValueInput.setAttribute('aria-invalid', String(!!valueIssue));
    if (circuit?.voltageV != null) {
      this.addPhysicsRow(TEXT[this.language].totalVoltage, this.formatSi(circuit.voltageV, 'V'));
    }
    if (circuit?.equivalentResistanceOhm != null) {
      this.addPhysicsRow(TEXT[this.language].totalResistance, this.formatSi(circuit.equivalentResistanceOhm, 'Ω'));
    }
    if (circuit?.currentA != null) {
      this.addPhysicsRow(TEXT[this.language].totalCurrent, this.formatSi(circuit.currentA, 'A'));
    }

    const result = this.dcAnalysis.components.find((candidate) =>
      candidate.componentId === this.propertyComponentId);
    if (result) this.addComponentPhysicsRows(result);
  }

  private addComponentPhysicsRows(result: DcComponentResult): void {
    const text = TEXT[this.language];
    const direction = `(${result.fromPort} → ${result.toPort})`;
    if (result.role === 'source') {
      if (result.voltageV != null) {
        this.addPhysicsRow(`${text.componentVoltage} (+ → −)`, this.formatSi(result.voltageV, 'V'));
      }
      if (result.currentA != null) {
        this.addPhysicsRow(text.deliveredCurrent, this.formatSi(-result.currentA, 'A'));
      }
      if (result.powerW != null) {
        this.addPhysicsRow(text.componentPower, this.formatSi(-result.powerW, 'W'));
      }
      return;
    }
    if (result.role === 'resistor') {
      if (result.voltageV != null) {
        this.addPhysicsRow(`${text.componentVoltage} ${direction}`, this.formatSi(result.voltageV, 'V'));
      }
      if (result.currentA != null) {
        this.addPhysicsRow(`${text.componentCurrent} ${direction}`, this.formatSi(result.currentA, 'A'));
      }
      if (result.powerW != null) {
        this.addPhysicsRow(text.componentPower, this.formatSi(result.powerW, 'W'));
      }
      return;
    }
    if (result.role === 'ammeter' && result.currentA != null) {
      this.addPhysicsRow(`${text.componentCurrent} ${direction}`, this.formatSi(result.currentA, 'A'));
    }
    if (result.role === 'voltmeter' && result.voltageV != null) {
      this.addPhysicsRow(`${text.componentVoltage} ${direction}`, this.formatSi(result.voltageV, 'V'));
    }
  }

  private addPhysicsRow(label: string, value: string): void {
    const term = document.createElement('dt');
    term.textContent = label;
    const description = document.createElement('dd');
    const output = document.createElement('output');
    output.textContent = value;
    description.appendChild(output);
    this.propertiesPhysicsValues.append(term, description);
  }

  private physicsStatusText(
    includeSummary: boolean,
    status: DcAnalysisStatus = this.dcAnalysis.status,
    componentIds?: readonly string[],
  ): string {
    const text = TEXT[this.language];
    let message: string;
    const appliesToCircuit = (componentId?: string) =>
      !componentIds || (componentId != null && componentIds.includes(componentId));
    switch (status) {
      case 'empty': return text.selectStatus;
      case 'no-source': return text.physicsNoSource;
      case 'solved': message = text.physicsSolved; break;
      case 'open': return text.physicsOpen;
      case 'short-circuit': return text.physicsShort;
      case 'incomplete': {
        const issue = this.dcAnalysis.diagnostics.find((candidate) =>
          appliesToCircuit(candidate.componentId) &&
          (candidate.code === 'missing-value' || candidate.code === 'invalid-value'));
        return text.physicsIncomplete(this.physicsComponentName(issue?.componentId));
      }
      case 'unsupported': {
        const issue = this.dcAnalysis.diagnostics.find((candidate) =>
          appliesToCircuit(candidate.componentId) && candidate.code === 'unsupported-component');
        return text.physicsUnsupported(this.physicsComponentName(issue?.componentId));
      }
      default: return text.physicsInvalid;
    }
    if (!includeSummary) return message;
    const circuit = this.dcAnalysis.circuits[0];
    if (circuit?.currentA != null) message += ` · I = ${this.formatSi(circuit.currentA, 'A')}`;
    if (circuit?.voltageV != null) message += ` · U = ${this.formatSi(circuit.voltageV, 'V')}`;
    return message;
  }

  private physicsComponentName(componentId?: string): string {
    const component = componentId
      ? this.history.document.components.find((candidate) => candidate.id === componentId)
      : null;
    if (!component) return this.language === 'de' ? 'das Bauteil' : 'the component';
    const name = component.name?.trim();
    if (name?.startsWith('$') && name.endsWith('$')) return name.slice(1, -1);
    return name || SYMBOL_BY_ID[component.kind].label[this.language];
  }

  private formatSi(value: number, unit: 'V' | 'A' | 'Ω' | 'W'): string {
    const normalized = Math.abs(value) < 1e-14 ? 0 : value;
    const absolute = Math.abs(normalized);
    let factor = 1;
    let prefix = '';
    if (absolute >= 1e9) { factor = 1e9; prefix = 'G'; }
    else if (absolute >= 1e6) { factor = 1e6; prefix = 'M'; }
    else if (absolute >= 1e3) { factor = 1e3; prefix = 'k'; }
    else if (absolute > 0 && absolute < 1e-6) { factor = 1e-9; prefix = 'n'; }
    else if (absolute > 0 && absolute < 1e-3) { factor = 1e-6; prefix = 'µ'; }
    else if (absolute > 0 && absolute < 1) { factor = 1e-3; prefix = 'm'; }
    const number = new Intl.NumberFormat(this.language === 'de' ? 'de-DE' : 'en-US', {
      maximumSignificantDigits: 3,
    }).format(normalized / factor);
    return `${number} ${prefix}${unit}`;
  }

  private openProperties(
    componentId: string,
    returnFocus: HTMLElement,
  ): void {
    const component = this.history.document.components.find((candidate) => candidate.id === componentId);
    if (!component) return;
    if (!this.canOpenProperties(component)) {
      this.closeProperties(false);
      this.setStatus(this.isProtectedComponent(component)
        ? TEXT[this.language].protectedObject
        : TEXT[this.language].propertiesRestricted);
      return;
    }
    if (this.isObjectListOpen() && this.container.getBoundingClientRect().width < 520) {
      this.setObjectListOpen(false, false);
    }
    this.palette.hidden = true;
    this.buttons.get('components')?.setAttribute('aria-expanded', 'false');
    this.setTool('select');
    this.select({ type: 'component', id: componentId });
    this.propertyComponentId = componentId;
    this.propertyReturnFocus = returnFocus;
    this.propertyReturnObjectKey = returnFocus.dataset.objectKey || null;
    this.propertiesNameInput.value = component.name || '';
    this.propertiesValueInput.value = component.value || '';
    this.propertiesNameInput.setCustomValidity('');
    this.propertiesValueInput.setCustomValidity('');
    this.propertiesNameInput.setAttribute('aria-invalid', 'false');
    this.propertiesValueInput.setAttribute('aria-invalid', 'false');
    const typeLabel = TEXT[this.language].componentType(SYMBOL_BY_ID[component.kind].label[this.language]);
    this.propertiesType.textContent = typeLabel;
    this.propertiesType.title = typeLabel;
    this.refreshPropertyValueText(component);
    this.refreshPhysicsPanel();
    this.propertiesPanel.dataset.open = '1';
    this.propertiesPanel.classList.add('is-open');
    this.propertiesPanel.setAttribute('aria-hidden', 'false');
    this.propertiesNameInput.tabIndex = 0;
    this.propertiesValueInput.tabIndex = 0;
    this.propertiesCloseButton.tabIndex = 0;
    this.container.dataset.liaElectroPropertiesOpen = 'true';
    this.refreshLockControl(component);
    this.refreshMeasurementControl(component);
    this.updatePanelLayout();
    this.buttons.get('properties')?.setAttribute('aria-expanded', 'true');
  }

  private applyPropertyInput(field: 'name' | 'value'): boolean {
    if (!this.propertyComponentId) return false;
    const active = this.history.document.components.find((candidate) => candidate.id === this.propertyComponentId);
    if (!active || !this.canOpenProperties(active)) {
      const input = field === 'name' ? this.propertiesNameInput : this.propertiesValueInput;
      input.value = active?.[field] || '';
      return false;
    }
    const next = this.document;
    const component = next.components.find((candidate) => candidate.id === this.propertyComponentId);
    if (!component) {
      return false;
    }
    const input = field === 'name' ? this.propertiesNameInput : this.propertiesValueInput;
    const value = input.value.trim();
    if (value) component[field] = value; else delete component[field];
    const symbolName = SYMBOL_BY_ID[component.kind].label[this.language];
    try {
      this.commit(next);
      const current = this.history.document.components.find((candidate) => candidate.id === component.id);
      input.value = current?.[field] || '';
      input.setAttribute('aria-invalid', 'false');
      this.refreshPhysicsPanel();
      this.setStatus(TEXT[this.language].propertiesSaved(symbolName));
      return true;
    } catch (error) {
      input.value = this.history.document.components.find((candidate) => candidate.id === component.id)?.[field] || '';
      input.setAttribute('aria-invalid', 'true');
      return false;
    }
  }

  private applyMeasurementVisibility(): void {
    if (!this.propertyComponentId) return;
    if (hasElectroRestriction(this.config, ELECTRO_RESTRICTIONS.measurementControlsLocked)) {
      const current = this.history.document.components.find((candidate) => candidate.id === this.propertyComponentId) || null;
      this.refreshMeasurementControl(current);
      return;
    }
    const next = this.document;
    const component = next.components.find((candidate) => candidate.id === this.propertyComponentId);
    if (!component || !this.canOpenProperties(component) ||
        (component.kind !== 'ammeter' && component.kind !== 'voltmeter')) return;
    if (this.propertiesMeasurementInput.checked) delete component.showMeasurement;
    else component.showMeasurement = false;
    this.commit(next);
    const current = this.history.document.components.find((candidate) => candidate.id === component.id) || null;
    this.refreshMeasurementControl(current);
    this.setStatus(TEXT[this.language].propertiesSaved(SYMBOL_BY_ID[component.kind].label[this.language]));
  }

  private applyComponentLock(): void {
    if (!this.propertyComponentId) return;
    const next = this.document;
    const component = next.components.find((candidate) => candidate.id === this.propertyComponentId);
    if (!component || !this.canOpenProperties(component)) {
      this.refreshLockControl(component || null);
      return;
    }
    const locked = this.propertiesLockInput.checked;
    if (locked) component.locked = true;
    else delete component.locked;
    this.commit(next);
    const current = this.history.document.components.find((candidate) => candidate.id === component.id) || null;
    this.refreshLockControl(current);
    const name = SYMBOL_BY_ID[component.kind].label[this.language];
    this.setStatus(locked
      ? TEXT[this.language].componentLocked(name)
      : TEXT[this.language].componentUnlocked(name));
  }

  private onPropertyInputKeyDown(event: KeyboardEvent, field: 'name' | 'value'): void {
    if (event.key.startsWith('Arrow')) {
      event.stopPropagation();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      if (this.applyPropertyInput(field)) (event.currentTarget as HTMLInputElement).blur();
      return;
    }
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    const input = event.currentTarget as HTMLInputElement;
    const component = this.propertyComponentId
      ? this.history.document.components.find((candidate) => candidate.id === this.propertyComponentId)
      : null;
    input.value = component?.[field] || '';
    input.setAttribute('aria-invalid', 'false');
    input.blur();
  }

  private canOpenProperties(component: ComponentModel | null | undefined): boolean {
    if (!component) return false;
    if (this.isProtectedComponent(component)) return false;
    if (hasElectroRestriction(this.config, ELECTRO_RESTRICTIONS.componentPropertiesLocked)) {
      return false;
    }
    return !(
      component.origin === 'macro' &&
      hasElectroRestriction(this.config, ELECTRO_RESTRICTIONS.macroComponentPropertiesLocked)
    );
  }

  private isPropertiesOpen(): boolean {
    return this.propertiesPanel?.dataset.open === '1';
  }

  private closeProperties(restoreFocus: boolean): void {
    if (!this.propertiesPanel || !this.isPropertiesOpen()) return;
    const root = this.propertiesPanel.getRootNode() as Document | ShadowRoot;
    const active = root.activeElement;
    if (active === this.propertiesNameInput || active === this.propertiesValueInput) {
      (active as HTMLInputElement).blur();
    }
    this.propertiesPanel.dataset.open = '0';
    this.propertiesPanel.classList.remove('is-open');
    this.propertiesPanel.setAttribute('aria-hidden', 'true');
    this.propertiesNameInput.tabIndex = -1;
    this.propertiesValueInput.tabIndex = -1;
    this.propertiesLockInput.tabIndex = -1;
    this.propertiesMeasurementInput.tabIndex = -1;
    this.propertiesCloseButton.tabIndex = -1;
    this.propertyComponentId = null;
    this.buttons.get('properties')?.setAttribute('aria-expanded', 'false');
    delete this.container.dataset.liaElectroPropertiesOpen;
    const returnFocus = this.propertyReturnFocus;
    const returnObjectKey = this.propertyReturnObjectKey;
    this.propertyReturnFocus = null;
    this.propertyReturnObjectKey = null;
    this.updatePanelLayout();
    if (!restoreFocus) return;
    const currentEntry = returnObjectKey && this.isObjectListOpen()
      ? this.objectListContent.querySelector<HTMLElement>(`[data-object-key="${returnObjectKey}"]`)
      : null;
    const canRestoreDirectly = returnFocus?.isConnected &&
      !('disabled' in returnFocus && returnFocus.disabled) &&
      !(returnObjectKey && !this.isObjectListOpen());
    const target = currentEntry || (canRestoreDirectly
      ? returnFocus
      : (returnObjectKey ? this.buttons.get('objectList') : null)) || this.container;
    try { target.focus({ preventScroll: true }); } catch (error) {}
  }

  private isObjectListOpen(): boolean {
    return this.objectListPanel?.dataset.open === '1';
  }

  private setObjectListOpen(open: boolean, restoreFocus: boolean): void {
    if (!this.objectListPanel) return;
    this.objectListPanel.dataset.open = open ? '1' : '0';
    this.objectListPanel.classList.toggle('is-open', open);
    this.objectListPanel.setAttribute('aria-hidden', String(!open));
    this.objectListPanel.inert = !open;
    const button = this.buttons.get('objectList');
    button?.setAttribute('aria-pressed', String(open));
    button?.setAttribute('aria-expanded', String(open));
    this.objectListCloseButton.tabIndex = open ? 0 : -1;
    const exportLocked = hasElectroRestriction(this.config, ELECTRO_RESTRICTIONS.exportLocked);
    this.objectListExportButton.tabIndex = open && !exportLocked ? 0 : -1;
    this.objectListContent.querySelectorAll<HTMLButtonElement>('button[data-object-key]').forEach((entry) => {
      entry.tabIndex = open ? 0 : -1;
    });
    if (open) {
      this.container.dataset.liaElectroObjectListOpen = 'true';
      this.refreshObjectList(true);
    } else {
      delete this.container.dataset.liaElectroObjectListOpen;
      this.objectListSignature = '';
    }
    this.updatePanelLayout();
    if (restoreFocus) {
      try { button?.focus({ preventScroll: true }); } catch (error) {}
    }
  }

  private refreshObjectList(force = false): void {
    if (!this.objectListContent || (!this.isObjectListOpen() && !force)) return;
    const signature = JSON.stringify({
      language: this.language,
      components: this.history.document.components.map((component) => [
        component.id, component.kind, component.name || '', component.value || '',
        component.showMeasurement === false ? 0 : 1,
        component.locked === true ? 1 : 0,
        component.origin || '',
      ]),
      restrictions: Array.from(this.config.restrictionIds).sort((left, right) => left - right),
      wires: this.history.document.wires.map((wire) => [
        wire.id, wire.from.componentId, wire.from.portId, wire.to.componentId, wire.to.portId, wire.route,
      ]),
    });
    if (!force && signature === this.objectListSignature) {
      this.updateObjectListSelection();
      return;
    }
    this.objectListSignature = signature;
    this.objectListContent.replaceChildren();
    const text = TEXT[this.language];
    if (this.history.document.components.length === 0 && this.history.document.wires.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'lia-electro-object-list-empty';
      empty.textContent = text.noObjects;
      this.objectListContent.appendChild(empty);
      return;
    }

    this.history.document.components.forEach((component, index) => {
      const typeLabel = SYMBOL_BY_ID[component.kind].label[this.language];
      const name = this.plainObjectName(component.name) || `${typeLabel} ${index + 1}`;
      const details = [typeLabel];
      if (component.locked === true) details.push(text.locked);
      if (this.isProtectedComponent(component)) details.push(text.protected);
      if (component.showMeasurement === false &&
          (component.kind === 'ammeter' || component.kind === 'voltmeter')) {
        details.push(text.readingHidden);
      }
      const detail = details.join(' · ');
      const entry = this.createObjectListEntry(
        `component:${component.id}`,
        name,
        detail,
        symbolToSvg(SYMBOL_BY_ID[component.kind]),
        `${name}, ${detail}`,
      );
      const propertiesAllowed = this.canOpenProperties(component);
      entry.setAttribute('aria-disabled', String(!propertiesAllowed));
      if (!propertiesAllowed) {
        const reason = this.isProtectedComponent(component)
          ? text.protectedObject
          : text.propertiesRestricted;
        entry.title = reason;
        entry.setAttribute('aria-label', `${name}, ${detail}, ${reason}`);
      }
      const openProperties = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!this.canOpenProperties(component)) {
          this.select({ type: 'component', id: component.id });
          this.setStatus(this.isProtectedComponent(component)
            ? TEXT[this.language].protectedObject
            : TEXT[this.language].propertiesRestricted);
          return;
        }
        this.openProperties(component.id, entry);
      };
      entry.addEventListener('click', openProperties);
      entry.addEventListener('contextmenu', openProperties);
      entry.addEventListener('keydown', (event) => {
        if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) openProperties(event);
      });
      this.appendObjectListEntry(entry);
    });

    this.history.document.wires.forEach((wire, index) => {
      const name = text.wireName(index + 1);
      const from = `${this.objectListComponentName(wire.from.componentId)}.${wire.from.portId}`;
      const to = `${this.objectListComponentName(wire.to.componentId)}.${wire.to.portId}`;
      const detail = [
        text.wireType,
        `${from} → ${to}`,
        ...(this.isProtectedWire(wire) ? [text.protected] : []),
      ].join(' · ');
      const entry = this.createObjectListEntry(
        `wire:${wire.id}`,
        name,
        detail,
        ICONS.wire,
        `${name}, ${detail}`,
      );
      const selectWire = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        this.select({ type: 'wire', id: wire.id });
      };
      entry.addEventListener('click', selectWire);
      entry.addEventListener('contextmenu', selectWire);
      entry.addEventListener('keydown', (event) => {
        if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) selectWire(event);
      });
      this.appendObjectListEntry(entry);
    });
    this.updateObjectListSelection();
  }

  private createObjectListEntry(
    key: string,
    name: string,
    type: string,
    iconMarkup: string,
    accessibleLabel: string,
  ): HTMLButtonElement {
    const entry = document.createElement('button');
    entry.type = 'button';
    entry.className = 'lia-electro-object-list-entry';
    entry.dataset.objectKey = key;
    const [objectType, objectId] = key.split(':');
    entry.dataset.objectType = objectType;
    entry.dataset.objectId = objectId;
    entry.setAttribute('aria-label', accessibleLabel);
    entry.tabIndex = this.isObjectListOpen() ? 0 : -1;
    const icon = document.createElement('span');
    icon.className = 'lia-electro-object-list-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = iconMarkup;
    const copy = document.createElement('span');
    copy.className = 'lia-electro-object-list-copy';
    const nameElement = document.createElement('span');
    nameElement.className = 'lia-electro-object-list-name';
    nameElement.textContent = name;
    const typeElement = document.createElement('span');
    typeElement.className = 'lia-electro-object-list-type';
    typeElement.textContent = type;
    copy.append(nameElement, typeElement);
    entry.append(icon, copy);
    return entry;
  }

  private appendObjectListEntry(entry: HTMLButtonElement): void {
    const item = document.createElement('div');
    item.setAttribute('role', 'listitem');
    item.appendChild(entry);
    this.objectListContent.appendChild(item);
  }

  private updateObjectListSelection(): void {
    if (!this.objectListContent) return;
    const selectedKey = this.selection ? `${this.selection.type}:${this.selection.id}` : '';
    this.objectListContent.querySelectorAll<HTMLButtonElement>('button[data-object-key]').forEach((entry) => {
      const selected = entry.dataset.objectKey === selectedKey;
      entry.classList.toggle('is-selected', selected);
      if (selected) entry.setAttribute('aria-current', 'true');
      else entry.removeAttribute('aria-current');
    });
  }

  private plainObjectName(value: string | undefined): string {
    const text = value?.trim() || '';
    if (text.startsWith('$$') && text.endsWith('$$') && text.length > 4) return text.slice(2, -2);
    if (text.startsWith('$') && text.endsWith('$') && text.length > 2) return text.slice(1, -1);
    if ((text.startsWith('\\(') && text.endsWith('\\)')) ||
        (text.startsWith('\\[') && text.endsWith('\\]'))) return text.slice(2, -2);
    return text;
  }

  private objectListComponentName(componentId: string): string {
    const index = this.history.document.components.findIndex((component) => component.id === componentId);
    const component = this.history.document.components[index];
    if (!component) return componentId;
    return this.plainObjectName(component.name) ||
      `${SYMBOL_BY_ID[component.kind].label[this.language]} ${index + 1}`;
  }

  private updatePanelLayout(): void {
    const objectListInset = this.isObjectListOpen() ? OBJECT_LIST_WIDTH_PX : 0;
    const propertiesInset = this.isPropertiesOpen() ? PROPERTIES_WIDTH_PX : 0;
    this.container.style.setProperty('--lia-electro-object-list-inset', `${objectListInset}px`);
    this.container.style.setProperty('--lia-electro-right-inset', `${objectListInset + propertiesInset}px`);
  }

  private safeExportName(): string {
    return this.boardId.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'circuit';
  }

  private getComponentView(id: string): ComponentModel | null {
    const component = this.history.document.components.find((candidate) => candidate.id === id);
    if (!component) return null;
    const transient = this.transientPositions.get(id);
    return transient ? { ...component, at: [transient[0], transient[1]] } : component;
  }

  private renderComponentValue(componentId: string): string {
    const component = this.getComponentView(componentId);
    if (!component) return '';
    if (component.kind !== 'ammeter' && component.kind !== 'voltmeter') {
      return renderComponentLabel(component.value);
    }
    if (hasElectroRestriction(this.config, ELECTRO_RESTRICTIONS.measurementControlsLocked)) return '';
    if (component.showMeasurement === false) return '';

    const circuit = this.dcAnalysis.circuits.find((candidate) =>
      candidate.componentIds.includes(componentId));
    if (circuit?.status !== 'solved') return '';

    const result = this.dcAnalysis.components.find((candidate) =>
      candidate.componentId === componentId);
    const measurement = component.kind === 'ammeter' ? result?.currentA : result?.voltageV;
    if (measurement == null || !Number.isFinite(measurement)) return '';

    return renderComponentLabel(this.formatSi(
      measurement,
      component.kind === 'ammeter' ? 'A' : 'V',
    ));
  }

  private getComponentLabelPlacement(
    id: string,
    placement: 'name' | 'value',
  ): ComponentLabelPlacement {
    const component = this.getComponentView(id);
    if (!component) return { point: [0, 0], anchorX: 'middle', anchorY: 'middle' };
    const [minX, minY, maxX, maxY] = SYMBOL_BY_ID[component.kind].bounds;
    const corners: Vec2[] = [
      [minX, minY],
      [maxX, minY],
      [maxX, maxY],
      [minX, maxY],
    ];
    const world = corners.map((point) => transformPoint(
      point,
      component.at[0],
      component.at[1],
      component.rotation,
    ));
    const xs = world.map((point) => point[0]);
    const ys = world.map((point) => point[1]);
    const left = Math.min(...xs);
    const right = Math.max(...xs);
    const bottom = Math.min(...ys);
    const top = Math.max(...ys);
    const centerX = (left + right) / 2;
    const centerY = (bottom + top) / 2;
    const localVertical = maxY - minY > maxX - minX;
    const orientation = normalizeRotation(component.rotation + (localVertical ? 90 : 0));
    const gapX = this.componentLabelGap('x');
    const gapY = this.componentLabelGap('y');

    if (orientation === 90 || orientation === 270) {
      const nameOnLeft = orientation === 90;
      const onLeft = placement === 'name' ? nameOnLeft : !nameOnLeft;
      return {
        point: [onLeft ? left - gapX : right + gapX, centerY],
        anchorX: onLeft ? 'right' : 'left',
        anchorY: 'middle',
      };
    }

    const nameOnTop = orientation === 0;
    const onTop = placement === 'name' ? nameOnTop : !nameOnTop;
    return {
      point: [centerX, onTop ? top + gapY : bottom - gapY],
      anchorX: 'middle',
      anchorY: onTop ? 'bottom' : 'top',
    };
  }

  private componentLabelGap(axis: 'x' | 'y'): number {
    const unit = Math.abs(Number(axis === 'x' ? this.board.unitX : this.board.unitY));
    return Number.isFinite(unit) && unit > 1e-9 ? COMPONENT_LABEL_GAP_PX / unit : 0.28;
  }

  private getViewComponents(): ComponentModel[] {
    return this.history.document.components.map((component) => this.getComponentView(component.id) || component);
  }

  private getTerminalPoint(componentId: string, portId: string): Vec2 {
    return resolvePort(this.getViewComponents(), { componentId, portId })?.point || [0, 0];
  }

  private getPreviewRoute(): Vec2[] {
    if (!this.pendingWire || !this.pointerPreview) return [];
    const from = resolvePort(this.getViewComponents(), this.pendingWire.from);
    return from
      ? routeToPoint(from, this.pointerPreview, this.pendingWire.route, this.history.document.settings.wireStub)
      : [];
  }

  private updatePreviewVisibility(): void {
    const visible = !!this.previewCurve && !!this.pendingWire && !!this.pointerPreview;
    if (this.previewCurve) this.setObjectVisible(this.previewCurve, visible);
  }

  private findTerminalAt(localX: number, localY: number): PortReference | null {
    const originX = Number(this.board?.origin?.scrCoords?.[1] || 0);
    const originY = Number(this.board?.origin?.scrCoords?.[2] || 0);
    const unitX = Number(this.board?.unitX || 0);
    const unitY = Number(this.board?.unitY || 0);
    if (!unitX || !unitY) return null;
    const components = [...this.getViewComponents()].reverse();
    let bestReference: PortReference | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const component of components) {
      for (const terminal of SYMBOL_BY_ID[component.kind].terminals) {
        const point = transformPoint(terminal.point, component.at[0], component.at[1], component.rotation);
        const screenX = originX + point[0] * unitX;
        const screenY = originY - point[1] * unitY;
        const distance = Math.hypot(localX - screenX, localY - screenY);
        if (distance <= 16 && distance < bestDistance) {
          bestDistance = distance;
          bestReference = { componentId: component.id, portId: terminal.id };
        }
      }
    }
    return bestReference;
  }

  private findComponentAt(point: Vec2): ComponentModel | null {
    const tolerance = 8 / Math.max(1, Math.min(Math.abs(Number(this.board.unitX || 1)), Math.abs(Number(this.board.unitY || 1))));
    const components = [...this.getViewComponents()].reverse();
    return components.find((component) => {
      const definition = SYMBOL_BY_ID[component.kind];
      const delta: Vec2 = [point[0] - component.at[0], point[1] - component.at[1]];
      const local = rotateVector(delta, normalizeRotation(360 - component.rotation));
      const [minX, minY, maxX, maxY] = definition.bounds;
      return local[0] >= minX - tolerance && local[0] <= maxX + tolerance &&
        local[1] >= minY - tolerance && local[1] <= maxY + tolerance;
    }) || null;
  }

  private findWireAt(localX: number, localY: number): WireModel | null {
    const originX = Number(this.board?.origin?.scrCoords?.[1] || 0);
    const originY = Number(this.board?.origin?.scrCoords?.[2] || 0);
    const unitX = Number(this.board?.unitX || 0);
    const unitY = Number(this.board?.unitY || 0);
    if (!unitX || !unitY) return null;
    const components = this.getViewComponents();
    const wires = [...this.history.document.wires].reverse();
    return wires.find((wire) => distanceToRouteScreen(
      localX,
      localY,
      routeWire(components, wire, this.history.document.settings.wireStub),
      originX,
      originY,
      unitX,
      unitY,
    ) <= 9) || null;
  }

  private eventToPointer(event: MouseEvent): LocalPointer | null {
    const origin = this.board?.origin?.scrCoords;
    const unitX = Number(this.board?.unitX || 0);
    const unitY = Number(this.board?.unitY || 0);
    if (!origin || !Number.isFinite(unitX) || !Number.isFinite(unitY) || Math.abs(unitX) < 1e-12 || Math.abs(unitY) < 1e-12) {
      return null;
    }
    const rect = this.container.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    if (localX < 0 || localY < 0 || localX > rect.width || localY > rect.height) return null;
    return {
      localX,
      localY,
      user: [
        (localX - Number(origin[1] || 0)) / unitX,
        (Number(origin[2] || 0) - localY) / unitY,
      ],
    };
  }

  private isInterfaceEvent(event: Event): boolean {
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [event.target];
    return path.some((node) => {
      const element = node as Element;
      return !!element && typeof element.matches === 'function' && element.matches(
        '.lia-electro-toolbar, .lia-electro-palette, .lia-electro-object-list-panel, .lia-electro-properties, .lia-electro-dialog-backdrop, .lia-jxg-resize-handle, .JXG_navigation',
      );
    });
  }

  private consumePointerEvent(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  private updateButtons(): void {
    const hasSelection = !!this.selection;
    const hasComponentSelection = this.selection?.type === 'component';
    const selectedComponent = hasComponentSelection
      ? this.history.document.components.find((component) => component.id === this.selection!.id)
      : null;
    const protectedSelection = this.isSelectionProtected();
    const rotate = this.buttons.get('rotate');
    const properties = this.buttons.get('properties');
    const remove = this.buttons.get('remove');
    const undo = this.buttons.get('undo');
    const redo = this.buttons.get('redo');
    if (rotate) {
      rotate.disabled = !hasSelection || protectedSelection || selectedComponent?.locked === true;
    }
    if (properties) properties.disabled = !hasComponentSelection || !this.canOpenProperties(selectedComponent);
    if (remove) remove.disabled = !hasSelection || protectedSelection;
    if (undo) undo.disabled = !this.history.canUndo;
    if (redo) redo.disabled = !this.history.canRedo;
  }

  private updateStatus(): void {
    const text = TEXT[this.language];
    if (this.selection?.type === 'component') {
      const component = this.history.document.components.find((candidate) => candidate.id === this.selection!.id);
      if (component) {
        const name = SYMBOL_BY_ID[component.kind].label[this.language];
        if (this.isProtectedComponent(component)) {
          this.setStatus(text.selectedProtectedComponent(name));
          return;
        }
        if (!this.canOpenProperties(component)) {
          this.setStatus(`${name}. ${text.propertiesRestricted}`);
          return;
        }
        this.setStatus(component.locked === true
          ? text.selectedLockedComponent(name)
          : text.selectedComponent(name));
        return;
      }
    }
    if (this.selection?.type === 'wire') {
      const wire = this.history.document.wires.find((candidate) => candidate.id === this.selection!.id);
      this.setStatus(this.isProtectedWire(wire)
        ? text.selectedProtectedWire
        : text.selectedWire);
      return;
    }
    if (this.tool === 'place' && this.placementKind) {
      this.setStatus(text.placeStatus(SYMBOL_BY_ID[this.placementKind].label[this.language]));
      return;
    }
    if (this.tool === 'wire') {
      this.setStatus(this.pendingWire ? text.wireEndStatus : text.wireStatus);
      return;
    }
    if (this.history.document.components.length > 0) {
      this.setStatus(this.physicsStatusText(true));
      return;
    }
    this.setStatus(text.selectStatus);
  }

  private setStatus(message: string): void {
    this.status.textContent = message;
  }

  private getNeutralColor(): string {
    try { return window.__coord?.getNeutralColor?.() || '#172033'; } catch (error) { return '#172033'; }
  }

  private getAccentColor(): string {
    try { return window.__coord?.getAccentColor?.() || '#b41f65'; } catch (error) { return '#b41f65'; }
  }

  private getTheme(): ElectroTheme {
    return resolveElectroTheme(this.getNeutralColor(), this.getAccentColor());
  }

  private setObjectAttributes(object: any, attributes: Record<string, unknown>): void {
    try { object?.setAttribute?.(attributes); } catch (error) {}
  }

  private setObjectVisible(object: any, visible: boolean): void {
    this.setObjectAttributes(object, { visible });
    try {
      if (visible) object?.showElement?.(); else object?.hideElement?.();
    } catch (error) {}
  }

  private removeBoardObjects(objects: any[]): void {
    objects.filter(Boolean).forEach((object) => {
      try { this.board.removeObject(object); } catch (error) {}
    });
  }
}

export function controllerFromSpec(
  uid: string,
  board: any,
  spec: string,
  language?: string,
  initial?: CircuitDocument,
  baseline?: CircuitDocument,
  completionQuizSpec?: string,
): ElectroController {
  return new ElectroController(
    uid,
    board,
    spec,
    language,
    initial,
    baseline,
    completionQuizSpec,
  );
}

function normalizeCompletionQuizSpec(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function sameCircuitDocument(left: CircuitDocument, right: CircuitDocument): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sameComponentModel(left: ComponentModel, right: ComponentModel): boolean {
  return left.id === right.id &&
    left.kind === right.kind &&
    left.at[0] === right.at[0] &&
    left.at[1] === right.at[1] &&
    left.rotation === right.rotation &&
    left.name === right.name &&
    left.value === right.value &&
    left.showMeasurement === right.showMeasurement &&
    left.locked === right.locked &&
    left.origin === right.origin;
}

function sameWireModel(left: WireModel, right: WireModel): boolean {
  return left.id === right.id &&
    samePort(left.from, right.from) &&
    samePort(left.to, right.to) &&
    left.route === right.route;
}

function oppositeRoute(route: WireRoute): WireRoute {
  return route === 'horizontal-first' ? 'vertical-first' : 'horizontal-first';
}

function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;
  return element.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName);
}
