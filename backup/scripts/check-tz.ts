/**
 * Helper de teste: roda hojeISO() e mesRefDeData() em um TZ específico
 * e devolve JSON para o teste comparar.
 *
 * Uso: TZ=America/Sao_Paulo bun scripts/check-tz.ts
 */
import { hojeISO, mesRefDeData } from '../src/lib/calculations';

const tz = process.env.TZ || 'UTC';
// 'sv-SE' é o locale que formata data como YYYY-MM-DD em horário local.
const localDate = new Date().toLocaleDateString('sv-SE');
const iso = hojeISO();
const mes = mesRefDeData(iso);

console.log(JSON.stringify({ tz, localDate, iso, mes, match: iso === localDate }));
