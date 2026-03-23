/// <reference types="vite/client" />

// Chrome extension API declarations
interface ChromeRuntime {
  sendMessage(options: { action: string; interval?: number | null }): Promise<any>;
  lastError: any;
}

interface Chrome {
  runtime: ChromeRuntime;
}

declare const chrome: Chrome;
