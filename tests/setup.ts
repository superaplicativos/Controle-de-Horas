import '@testing-library/jest-dom/vitest';

// Node 18+ tem globalThis.crypto, mas jsdom pode sobrescrever. Garante que crypto.subtle está disponível.
if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.subtle) {
  const nodeCrypto = await import('node:crypto');
  Object.defineProperty(globalThis, 'crypto', {
    value: nodeCrypto.webcrypto,
    writable: false,
    configurable: true,
  });
}
