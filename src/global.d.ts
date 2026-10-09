import type { CircuitDocument } from './electro/model.ts';
import type { ElectroController } from './electro/controller.ts';
import type { DcAnalysis } from './electro/physics.ts';
import type { CompletionResult } from './electro/quiz.ts';
import type { SymbolDefinition } from './electro/symbols.ts';

declare global {
  interface Window {
    __boards: Record<string, any> | undefined;
    __coord: {
      getNeutralColor?: () => string;
      getAccentColor?: () => string;
    } | undefined;
    __liaCoordHooks: Record<string, () => void> | undefined;
    __registerLiaThemeListener: ((listener: () => void) => void) | undefined;
    __electroDocuments: Record<string, CircuitDocument> | undefined;
    __electroControllers: Record<string, ElectroController> | undefined;
    __liaElectroHooks: Array<() => void> | { push(callback: () => void): void } | undefined;
    __setupElectro: ((uid: string, spec: string, language?: string) => void) | undefined;
    __bootstrapElectro: (() => void) | undefined;
    __liaElectroObserver: MutationObserver | undefined;
    __liaElectroThemeBridgeRegistered: boolean | undefined;
    __electro: {
      version: string;
      setup: (uid: string, spec: string, language?: string) => void;
      bootstrap: () => void;
      exportJSON: (boardId: string) => string | null;
      exportMacros: (boardId: string) => string | null;
      downloadMacros: (boardId: string) => string | null;
      downloadJSON: (boardId: string) => string | null;
      importJSON: (boardId: string, input: string) => CircuitDocument | null;
      analyzeDC: (boardId: string) => DcAnalysis | null;
      checkCompletion: (spec: string) => CompletionResult | null;
      getController: (boardId: string) => ElectroController | null;
      symbols: readonly SymbolDefinition[];
    } | undefined;
  }
}

export {};
