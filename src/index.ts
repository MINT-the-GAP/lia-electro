import { parseElectroSpec } from './electro/config.ts';
import { ElectroController } from './electro/controller.ts';
import {
  circuitFromMacroElements,
  completionQuizSpecFromMacroElements,
} from './electro/macros.ts';
import { cloneCircuit, type CircuitDocument } from './electro/model.ts';
import { parseCompletionRule } from './electro/quiz.ts';
import { SYMBOLS } from './electro/symbols.ts';

const VERSION = '0.9.0';
const RETRY_DELAY_MS = 60;
const MAX_RETRIES = 180;
const controllers: Record<string, ElectroController> = {};
const retryCounts: Record<string, number> = {};
const retryTimers: Record<string, number | undefined> = {};
const retryRequests: Record<string, { spec: string; language?: string }> = {};
let bootstrapQueued = false;

window.__electroControllers = controllers;
window.__electroDocuments = window.__electroDocuments || {};

function setupElectro(uid: string, spec: string, language?: string): void {
  registerThemeBridge();
  const config = parseElectroSpec(spec);
  if (!uid || !config.boardId) {
    if (uid) clearRetry(uid);
    console.warn('[lia-electro] @Electro requires a board id.');
    return;
  }
  const board = window.__boards && window.__boards[config.boardId];
  if (!isUsableBoard(board)) {
    scheduleRetry(uid, spec, language);
    return;
  }

  clearRetry(uid);
  const anchor = document.getElementById(`electro-ui-${uid}`);
  if (anchor) {
    anchor.style.display = 'none';
    anchor.setAttribute('aria-hidden', 'true');
  }

  let declared: CircuitDocument | null = null;
  let completionQuizSpec: string | null = null;
  try {
    declared = circuitFromMacroElements(document, config.boardId, {
      snapStep: config.snapStep,
      wireStub: config.wireStub,
    });
    completionQuizSpec = completionQuizSpecFromMacroElements(document, config.boardId);
  } catch (error) {
    console.error('[lia-electro] Could not read the circuit macro declarations.', error);
    return;
  }

  const existing = controllers[uid];
  if (existing && existing.board === board && existing.boardId === config.boardId) {
    existing.update(
      spec,
      language,
      declared || undefined,
      completionQuizSpec,
    );
    return;
  }
  if (existing) existing.destroy();

  Object.keys(controllers).forEach((otherUid) => {
    const candidate = controllers[otherUid];
    if (otherUid !== uid && candidate.boardId === config.boardId) {
      candidate.destroy();
      delete controllers[otherUid];
    }
  });

  try {
    const documents = window.__electroDocuments || {};
    const hasStored = Object.prototype.hasOwnProperty.call(documents, config.boardId);
    const initial = hasStored
      ? cloneCircuit(documents[config.boardId])
      : declared || undefined;
    controllers[uid] = new ElectroController(
      uid,
      board,
      spec,
      language,
      initial,
      declared || undefined,
      completionQuizSpec || undefined,
    );
  } catch (error) {
    console.error('[lia-electro] Could not initialize the circuit editor.', error);
  }
}

function isUsableBoard(board: any): boolean {
  return !!board?.containerObj && board.containerObj.isConnected !== false;
}

function scheduleRetry(uid: string, spec: string, language?: string): void {
  retryRequests[uid] = { spec, language };
  if (retryTimers[uid] != null) return;
  const count = (retryCounts[uid] || 0) + 1;
  retryCounts[uid] = count;
  if (count > MAX_RETRIES) {
    delete retryCounts[uid];
    delete retryTimers[uid];
    delete retryRequests[uid];
    console.warn(`[lia-electro] Board for ${uid} did not become available.`);
    return;
  }
  retryTimers[uid] = window.setTimeout(() => {
    delete retryTimers[uid];
    const request = retryRequests[uid];
    if (request) setupElectro(uid, request.spec, request.language);
  }, RETRY_DELAY_MS);
}

function clearRetry(uid: string): void {
  if (retryTimers[uid] != null) window.clearTimeout(retryTimers[uid]);
  delete retryTimers[uid];
  delete retryCounts[uid];
  delete retryRequests[uid];
}

function bootstrapElectro(): void {
  const anchors = Array.from(
    document.querySelectorAll<HTMLElement>('[id^="electro-ui-"]'),
  );
  const activeUids = new Set(
    anchors.map((anchor) => anchor.id.slice('electro-ui-'.length)),
  );

  Object.keys(controllers).forEach((uid) => {
    if (activeUids.has(uid)) return;
    controllers[uid].destroy();
    delete controllers[uid];
    clearRetry(uid);
  });
  Object.keys(retryTimers).forEach((uid) => {
    if (!activeUids.has(uid)) clearRetry(uid);
  });

  anchors.forEach((anchor) => {
    if (anchor.dataset.spec == null) return;
    const uid = anchor.id.slice('electro-ui-'.length);
    setupElectro(uid, anchor.dataset.spec || '', anchor.dataset.language);
  });
}

function registerThemeBridge(): void {
  if (
    window.__liaElectroThemeBridgeRegistered ||
    typeof window.__registerLiaThemeListener !== 'function'
  ) return;

  window.__liaElectroThemeBridgeRegistered = true;
  window.__registerLiaThemeListener(() => {
    Object.values(window.__electroControllers || {}).forEach((controller) => {
      controller.refreshTheme();
    });
  });
}

function nodeTouchesLifecycle(node: Node): boolean {
  if (!(node instanceof Element)) return false;
  const selector = '[id^=electro-ui-], .lia-electro-completion-spec, .jxgbox';
  return node.matches(selector) || !!node.querySelector(selector);
}

function installLifecycleObserver(): void {
  const root = document.documentElement || document.body;
  if (!root || typeof MutationObserver !== 'function') return;

  window.__liaElectroObserver?.disconnect();
  const observer = new MutationObserver((records) => {
    const relevant = records.some((record) => {
      let touched = false;
      record.addedNodes.forEach((node) => { touched ||= nodeTouchesLifecycle(node); });
      record.removedNodes.forEach((node) => { touched ||= nodeTouchesLifecycle(node); });
      return touched;
    });
    if (!relevant || bootstrapQueued) return;
    bootstrapQueued = true;
    window.setTimeout(() => {
      bootstrapQueued = false;
      bootstrapElectro();
    }, 0);
  });
  observer.observe(root, { childList: true, subtree: true });
  window.__liaElectroObserver = observer;
}

function getController(boardId: string): ElectroController | null {
  return Object.values(controllers).find((controller) => controller.boardId === boardId) || null;
}

window.__setupElectro = setupElectro;
window.__bootstrapElectro = bootstrapElectro;
window.__electro = {
  version: VERSION,
  setup: setupElectro,
  bootstrap: bootstrapElectro,
  exportJSON(boardId: string) {
    return getController(boardId)?.exportJSON() || null;
  },
  exportMacros(boardId: string) {
    return getController(boardId)?.exportMacros() || null;
  },
  downloadMacros(boardId: string) {
    return getController(boardId)?.downloadMacros() || null;
  },
  downloadJSON(boardId: string) {
    return getController(boardId)?.downloadJSON() || null;
  },
  importJSON(boardId: string, input: string) {
    return getController(boardId)?.importJSON(input) || null;
  },
  analyzeDC(boardId: string) {
    return getController(boardId)?.analyzeDC() || null;
  },
  checkCompletion(spec: string) {
    const rule = parseCompletionRule(spec);
    return getController(rule.boardId)?.checkCompletion(rule) || null;
  },
  getController,
  symbols: SYMBOLS,
};

const pending = Array.isArray(window.__liaElectroHooks)
  ? window.__liaElectroHooks.slice()
  : [];
pending.forEach((callback) => {
  try { callback(); } catch (error) {}
});
window.__liaElectroHooks = {
  push(callback: () => void) {
    try { callback(); } catch (error) {}
  },
};

registerThemeBridge();
installLifecycleObserver();
bootstrapElectro();
