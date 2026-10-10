import '@testing-library/jest-dom/vitest';
import { webcrypto } from 'node:crypto';

// Node 18+ tem globalThis.crypto, mas jsdom pode sobrescrever. Garante que crypto.subtle está disponível.
if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: false,
    configurable: true,
  });
}
