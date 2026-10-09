import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';

class FakeBoardObject {
  dataX: number[] = [];
  dataY: number[] = [];
  updateDataArray?: () => void;
  visible = true;
  kind: string;
  args: unknown[];
  attributes: Record<string, unknown>;

  constructor(kind: string, args: unknown[], attributes: Record<string, unknown>) {
    this.kind = kind;
    this.args = args;
    this.attributes = attributes;
  }

  setAttribute(attributes: Record<string, unknown>): void {
    Object.assign(this.attributes, attributes);
    if (typeof attributes.visible === 'boolean') this.visible = attributes.visible;
  }

  showElement(): void { this.visible = true; }
  hideElement(): void { this.visible = false; }
  X(): number { return Number(typeof this.args[0] === 'function' ? this.args[0]() : this.args[0]); }
  Y(): number { return Number(typeof this.args[1] === 'function' ? this.args[1]() : this.args[1]); }
}

function prepareContainer(container: HTMLDivElement): void {
  container.getBoundingClientRect = () => ({
    x: 0, y: 0, left: 0, top: 0, right: 800, bottom: 600,
    width: 800, height: 600, toJSON: () => ({}),
  });
}

function fakeBoard(container: HTMLDivElement) {
  const objects: FakeBoardObject[] = [];
  return {
    containerObj: container,
    origin: { scrCoords: [1, 400, 300] },
    unitX: 40,
    unitY: 40,
    objects,
    create(kind: string, args: unknown[], attributes: Record<string, unknown>) {
      const object = new FakeBoardObject(kind, args, { ...attributes });
      objects.push(object);
      return object;
    },
    removeObject(object: FakeBoardObject) {
      const index = objects.indexOf(object);
      if (index >= 0) objects.splice(index, 1);
    },
    update() {
      objects.forEach((object) => object.updateDataArray?.());
    },
  };
}

async function waitFor(predicate: () => boolean, view: Window): Promise<void> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (predicate()) return;
    await new Promise<void>((resolve) => view.setTimeout(resolve, 5));
  }
  assert.fail('Timed out while waiting for the Electro lifecycle bootstrap.');
}

test('bootstrap follows a lia-coordinate board replacement without accumulating theme listeners', async (t) => {
  const dom = new JSDOM('<!doctype html><html lang="de"><head></head><body></body></html>', {
    url: 'https://example.test/',
  });
  const view = dom.window as typeof dom.window & Record<string, any>;
  Object.defineProperties(globalThis, {
    window: { value: view, configurable: true },
    document: { value: view.document, configurable: true },
    navigator: { value: view.navigator, configurable: true },
    HTMLElement: { value: view.HTMLElement, configurable: true },
    Element: { value: view.Element, configurable: true },
    Node: { value: view.Node, configurable: true },
    Document: { value: view.Document, configurable: true },
    ShadowRoot: { value: view.ShadowRoot, configurable: true },
    MutationObserver: { value: view.MutationObserver, configurable: true },
    getComputedStyle: { value: view.getComputedStyle.bind(view), configurable: true },
  });
  Object.defineProperty(view, 'confirm', { value: () => true, configurable: true });

  const themeListeners = new Set<() => void>();
  view.__boards = {};
  view.__electroDocuments = {};
  view.__coord = {
    getNeutralColor: () => '#172033',
    getAccentColor: () => '#b41f65',
  };
  view.__registerLiaThemeListener = (listener: () => void) => {
    themeListeners.add(listener);
    listener();
  };

  const firstContainer = view.document.createElement('div');
  firstContainer.className = 'jxgbox';
  prepareContainer(firstContainer);
  view.document.body.appendChild(firstContainer);
  const firstBoard = fakeBoard(firstContainer);
  view.__boards.lifecycle = firstBoard;

  const anchor = view.document.createElement('span');
  anchor.id = 'electro-ui-lifecycle-test';
  anchor.dataset.spec = 'id=lifecycle;snap=0.5;stub=0.35;components=[100;200];restrictions=[110]';
  anchor.dataset.language = 'de';
  view.document.body.appendChild(anchor);

  const componentSpecs = [
    ['battery', 'lifecycle;c_0001;-2;0;0;$B_1$;9 V'],
    ['resistor', 'lifecycle;c_0002;2;0;0;$R_1$;220 Ω;;1'],
  ];
  componentSpecs.forEach(([kind, spec]) => {
    const declaration = view.document.createElement('span');
    declaration.className = 'lia-electro-component-spec';
    declaration.dataset.kind = kind;
    declaration.dataset.spec = spec;
    view.document.body.appendChild(declaration);
  });
  [
    'lifecycle;w_0001;c_0001;b;c_0002;a;horizontal-first',
    'lifecycle;w_0002;c_0002;b;c_0001;a;horizontal-first',
  ].forEach((spec) => {
    const declaration = view.document.createElement('span');
    declaration.className = 'lia-electro-wire-spec';
    declaration.dataset.spec = spec;
    view.document.body.appendChild(declaration);
  });
  const completionDeclaration = view.document.createElement('span');
  completionDeclaration.className = 'lia-electro-completion-spec';
  completionDeclaration.dataset.spec = 'lifecycle;condition=closed;preserve=1;changed=0';
  view.document.body.appendChild(completionDeclaration);

  await import('../src/index.ts');
  t.after(() => {
    view.__liaElectroObserver?.disconnect();
    view.__electro?.getController('lifecycle')?.destroy();
    dom.window.close();
  });

  assert.equal(view.__electro?.getController('lifecycle')?.board, firstBoard);
  assert.equal(view.__electro?.getController('lifecycle')?.document.components.length, 2);
  assert.ok(view.__electro?.getController('lifecycle')?.document.components.every(
    (component) => component.origin === 'macro',
  ));
  assert.equal(
    view.__electro?.getController('lifecycle')?.document.components.find(
      (component) => component.id === 'c_0002',
    )?.locked,
    true,
  );
  assert.equal(view.__electro?.getController('lifecycle')?.document.wires.length, 2);
  assert.equal(view.__electro?.analyzeDC('lifecycle')?.status, 'solved');
  assert.equal(
    view.__electro?.checkCompletion(completionDeclaration.dataset.spec || '')?.ok,
    true,
  );
  assert.match(view.__electro?.exportMacros('lifecycle') || '', /@ElectroErgaenzungsquiz\(/);
  assert.match(view.__electro?.exportMacros('lifecycle') || '', /^@Koordinatensystem\(`/);
  assert.match(view.__electro?.exportMacros('lifecycle') || '', /@ElectroBatterie\(`/);
  assert.match(view.__electro?.exportMacros('lifecycle') || '', /220 Ω;;1`\)/);
  assert.match(
    view.__electro?.exportMacros('lifecycle') || '',
    /components=\[100;200\];restrictions=\[110\]/,
  );
  assert.match(view.__electro?.exportJSON('lifecycle') || '', /"schema": "mint-the-gap\/electro-circuit"/);
  assert.equal(themeListeners.size, 1);

  const empty = {
    schema: 'mint-the-gap/electro-circuit',
    version: 1,
    settings: { snapStep: 0.5, wireStub: 0.35 },
    components: [],
    wires: [],
  };
  view.__electro?.importJSON('lifecycle', JSON.stringify(empty));
  assert.equal(view.__electro?.analyzeDC('lifecycle')?.status, 'empty');

  firstContainer.remove();
  const secondContainer = view.document.createElement('div');
  secondContainer.className = 'jxgbox';
  prepareContainer(secondContainer);
  view.document.body.appendChild(secondContainer);
  const secondBoard = fakeBoard(secondContainer);
  view.__boards.lifecycle = secondBoard;

  await waitFor(
    () => view.__electro?.getController('lifecycle')?.board === secondBoard,
    view,
  );

  assert.equal(firstBoard.objects.length, 0);
  assert.ok(secondBoard.objects.length > 0);
  assert.equal(view.__electro?.getController('lifecycle')?.document.components.length, 0);
  assert.equal(view.__electro?.analyzeDC('lifecycle')?.status, 'empty');
  assert.equal(themeListeners.size, 1);

  anchor.remove();
  await waitFor(() => view.__electro?.getController('lifecycle') == null, view);
  assert.equal(secondBoard.objects.length, 0);
  assert.equal(themeListeners.size, 1);
});
