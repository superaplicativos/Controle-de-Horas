// Criptografia. Único arquivo com crypto.subtle. (R-73)
//
// AES-256-GCM para cifrar/decifrar arquivos.
// PBKDF2-SHA256 com 600000 iterações para derivar chave da senha.
// R-74: IV aleatório novo a cada escrita, nunca reaproveitado.
// R-75: falha de autenticação GCM vira erro em português, nunca ignorada.

const ALGORITMO_CIFRA = 'AES-GCM';
const ALGORITMO_KDF = 'PBKDF2';
const ITERACOES_KDF = 600000;
const TAMANHO_IV = 12; // 96 bits, recomendado para GCM
const TAMANHO_SAL = 16;

// ===== Base64 helpers (compatíveis com TextEncoder/TextDecoder) =====

export function bytesParaBase64(bytes: Uint8Array): string {
  let binario = '';
  for (let i = 0; i < bytes.length; i++) {
    binario += String.fromCharCode(bytes[i]!);
  }
  return btoa(binario);
}

export function base64ParaBytes(b64: string): Uint8Array {
  const limpo = b64.replace(/\s/g, '');
  const binario = atob(limpo);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) {
    bytes[i] = binario.charCodeAt(i);
  }
  return bytes;
}

// Helper: copia um Uint8Array para um ArrayBuffer puro (evita conflito de tipos TS com SharedArrayBuffer)
function paraArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(bytes.byteLength);
  const view = new Uint8Array(ab);
  view.set(bytes);
  return ab;
}

// Helper: garante que o retorno seja um Uint8Array com ArrayBuffer puro (não SharedArrayBuffer)
// Necessário porque crypto.subtle no Node exige ArrayBuffer, não SharedArrayBuffer.
function paraUint8Array(bytes: Uint8Array): Uint8Array {
  const ab = new ArrayBuffer(bytes.byteLength);
  const view = new Uint8Array(ab);
  view.set(bytes);
  return view;
}

// ===== Aleatório (R-73: crypto.getRandomValues, nunca Math.random) =====

export function ivAleatorio(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(TAMANHO_IV));
}

export function salAleatorio(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(TAMANHO_SAL));
}

export function chaveDadosAleatoria(): Uint8Array {
  // 32 bytes = 256 bits para AES-256
  return crypto.getRandomValues(new Uint8Array(32));
}

// ===== Derivação de chave (PBKDF2-SHA256, 600000 iterações) =====

/** Deriva uma chave AES-256-GCM da senha usando PBKDF2. Determinística com o mesmo sal. */
export async function derivarChaveDeSenha(senha: string, sal: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const materialBase = await crypto.subtle.importKey(
    'raw',
    paraUint8Array(encoder.encode(senha)),
    { name: ALGORITMO_KDF },
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: ALGORITMO_KDF,
      salt: paraUint8Array(sal),
      iterations: ITERACOES_KDF,
      hash: 'SHA-256',
    },
    materialBase,
    { name: ALGORITMO_CIFRA, length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Importa uma chave de dados (32 bytes) como CryptoKey AES-256-GCM. */
export async function importarChaveDados(chaveDados: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    paraUint8Array(chaveDados),
    { name: ALGORITMO_CIFRA },
    false,
    ['encrypt', 'decrypt'],
  );
}

// ===== Cifra e decifra de arquivos (AES-256-GCM com AAD) =====

export interface ArquivoCifrado {
  formato: 1;
  iv: string; // base64
  ct: string; // base64 (texto cifrado + tag GCM)
}

/**
 * Cifra um texto claro com AES-256-GCM.
 * @param chave CryptoKey AES-256-GCM
 * @param textoClaro string a cifrar
 * @param aad Additional Authenticated Data (caminho do arquivo). R-75: AAD protege contra troca de arquivo de lugar.
 * @returns ArquivoCifrado com IV aleatório (R-74) e texto cifrado em base64.
 */
export async function cifrarArquivo(chave: CryptoKey, textoClaro: string, aad: string): Promise<ArquivoCifrado> {
  const iv = ivAleatorio();
  const encoder = new TextEncoder();
  const ctBuffer = await crypto.subtle.encrypt(
    {
      name: ALGORITMO_CIFRA,
      iv: paraUint8Array(iv),
      additionalData: paraUint8Array(encoder.encode(aad)),
      tagLength: 128,
    },
    chave,
    paraUint8Array(encoder.encode(textoClaro)),
  );
  return {
    formato: 1,
    iv: bytesParaBase64(iv),
    ct: bytesParaBase64(new Uint8Array(ctBuffer)),
  };
}

/**
 * Decifra um ArquivoCifrado. R-75: falha de autenticação GCM lança erro em português.
 * @param chave CryptoKey AES-256-GCM
 * @param arq ArquivoCifrado (iv + ct)
 * @param aad Additional Authenticated Data (caminho do arquivo — deve ser o mesmo da cifra)
 * @returns texto claro, ou lança Erro se senha errada / arquivo adulterado / AAD errado.
 */
export async function decifrarArquivo(chave: CryptoKey, arq: ArquivoCifrado, aad: string): Promise<string> {
  try {
    const iv = base64ParaBytes(arq.iv);
    const ct = base64ParaBytes(arq.ct);
    const encoder = new TextEncoder();
    const textoBuffer = await crypto.subtle.decrypt(
      {
        name: ALGORITMO_CIFRA,
        iv: paraUint8Array(iv),
        additionalData: paraUint8Array(encoder.encode(aad)),
        tagLength: 128,
      },
      chave,
      paraUint8Array(ct),
    );
    return new TextDecoder().decode(textoBuffer);
  } catch {
    throw new Error('DECRYPT_FAILED');
  }
}

// ===== Cifra do acesso.txt (chave derivada de senha) =====

export interface AcessoCifrado {
  formato: 1;
  kdf: {
    alg: 'PBKDF2-SHA256';
    iteracoes: number;
    sal: string; // base64
  };
  iv: string; // base64
  ct: string; // base64
}

/**
 * Cifra o conteúdo do acesso.txt ({ chaveDados, token }) com a chave derivada da senha.
 * AAD = 'dados/acesso.txt'.
 */
export async function cifrarAcesso(senha: string, conteudo: { chaveDados: string; token: string }): Promise<AcessoCifrado> {
  const sal = salAleatorio();
  const chave = await derivarChaveDeSenha(senha, sal);
  const iv = ivAleatorio();
  const encoder = new TextEncoder();
  const ctBuffer = await crypto.subtle.encrypt(
    {
      name: ALGORITMO_CIFRA,
      iv: paraUint8Array(iv),
      additionalData: paraUint8Array(encoder.encode('dados/acesso.txt')),
      tagLength: 128,
    },
    chave,
    paraUint8Array(encoder.encode(JSON.stringify(conteudo))),
  );
  return {
    formato: 1,
    kdf: {
      alg: 'PBKDF2-SHA256',
      iteracoes: ITERACOES_KDF,
      sal: bytesParaBase64(sal),
    },
    iv: bytesParaBase64(iv),
    ct: bytesParaBase64(new Uint8Array(ctBuffer)),
  };
}

/**
 * Decifra o acesso.txt com a senha. R-75: senha errada lança erro.
 * @returns { chaveDados: string, token: string } ou lança 'DECRYPT_FAILED'.
 */
export async function decifrarAcesso(senha: string, arq: AcessoCifrado): Promise<{ chaveDados: string; token: string }> {
  try {
    const sal = base64ParaBytes(arq.kdf.sal);
    const chave = await derivarChaveDeSenha(senha, sal);
    const iv = base64ParaBytes(arq.iv);
    const ct = base64ParaBytes(arq.ct);
    const encoder = new TextEncoder();
    const textoBuffer = await crypto.subtle.decrypt(
      {
        name: ALGORITMO_CIFRA,
        iv: paraUint8Array(iv),
        additionalData: paraUint8Array(encoder.encode('dados/acesso.txt')),
        tagLength: 128,
      },
      chave,
      paraUint8Array(ct),
    );
    const texto = new TextDecoder().decode(textoBuffer);
    return JSON.parse(texto) as { chaveDados: string; token: string };
  } catch {
    throw new Error('DECRYPT_FAILED');
  }
}

// ===== Base32 para chave de recuperação (grupos de 4 chars) =====

const ALFABETO_BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** Converte bytes para base32 sem padding. */
export function bytesParaBase32(bytes: Uint8Array): string {
  let bits = 0;
  let valor = 0;
  let saida = '';
  for (let i = 0; i < bytes.length; i++) {
    valor = (valor << 8) | bytes[i]!;
    bits += 8;
    while (bits >= 5) {
      saida += ALFABETO_BASE32[(valor >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    saida += ALFABETO_BASE32[(valor << (5 - bits)) & 31];
  }
  return saida;
}

/** Converte base32 (sem padding) para bytes. */
export function base32ParaBytes(b32: string): Uint8Array {
  const limpo = b32.replace(/\s/g, '').toUpperCase();
  let bits = 0;
  let valor = 0;
  const bytes: number[] = [];
  for (const c of limpo) {
    const idx = ALFABETO_BASE32.indexOf(c);
    if (idx < 0) continue;
    valor = (valor << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((valor >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

/** Formata a chave de dados em grupos de 4 caracteres para exibição. */
export function formatarChaveRecuperacao(chaveDados: Uint8Array): string {
  const b32 = bytesParaBase32(chaveDados);
  return b32.match(/.{1,4}/g)?.join(' ') ?? b32;
}

/** Converte chave de dados (bytes) para base64 para guardar no acesso.txt. */
export function chaveDadosParaBase64(chaveDados: Uint8Array): string {
  return bytesParaBase64(chaveDados);
}

/** Converte base64 para bytes de chave de dados. */
export function base64ParaChaveDados(b64: string): Uint8Array {
  return base64ParaBytes(b64);
}
