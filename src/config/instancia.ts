// Configuração da instância. Editada por fork. (R-22 seção 22, D-02)
//
// Cada professor tem a SUA cópia do projeto. O dono faz um fork, ajusta
// estes valores, e pronto. Não existe multi-professor nem login (D-03).

export const INSTANCIA = {
  /** Nome do professor mostrado na interface. */
  nome: 'Professor',
  /** Valor da hora em centavos. Padrão R$ 35,00. */
  valorHoraCentavos: 3500,
  /** Valor da falta em centavos. Padrão R$ 35,00 (conta como 1h). */
  valorFaltaCentavos: 3500,
} as const;
