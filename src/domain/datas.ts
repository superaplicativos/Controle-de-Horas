// Helpers de data. Sem React, sem I/O. (R-26, R-27, R-28)
//
// P-05: datas de negócio são strings AAAA-MM-DD.
// R-27: proibido new Date('AAAA-MM-DD') — interpreta como UTC.
// Todos os Date são montados com new Date(ano, mes-1, dia) local.

/** Data de hoje no fuso local do navegador, como AAAA-MM-DD. */
export function hojeLocal(): string {
  const d = new Date();
  return formatarDataLocal(d);
}

/** Mês de referência (AAAA-MM) a partir de uma data AAAA-MM-DD. */
export function mesRefDe(data: string): string {
  return data.slice(0, 7);
}

/** Mês de referência atual. */
export function mesRefAtual(): string {
  return mesRefDe(hojeLocal());
}

/** Dia da semana abreviado em português. */
export function diaDaSemana(data: string): string {
  const [ano, mes, dia] = parseData(data);
  const d = new Date(ano, mes - 1, dia);
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return dias[d.getDay()] ?? '?';
}

/** Nome do mês por extenso: "setembro 2026". */
export function nomeMes(mesRef: string): string {
  const [anoStr, mesStr] = mesRef.split('-');
  const ano = parseInt(anoStr ?? '0', 10);
  const mes = parseInt(mesStr ?? '0', 10);
  const nomes = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ];
  const nome = nomes[mes - 1] ?? '?';
  return `${nome} ${ano}`;
}

/** Nome curto do mês: "set/2026". */
export function nomeMesCurto(mesRef: string): string {
  const [anoStr, mesStr] = mesRef.split('-');
  const ano = parseInt(anoStr ?? '0', 10);
  const mes = parseInt(mesStr ?? '0', 10);
  const nomes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const nome = nomes[mes - 1] ?? '?';
  return `${nome}/${ano}`;
}

/** Soma N meses a um mesRef. somarMes('2026-12', 1) = '2027-01'. */
export function somarMes(mesRef: string, n: number): string {
  const [anoStr, mesStr] = mesRef.split('-');
  const ano = parseInt(anoStr ?? '0', 10);
  const mes = parseInt(mesStr ?? '0', 10);
  const d = new Date(ano, mes - 1 + n, 1);
  const novoAno = d.getFullYear();
  const novoMes = d.getMonth() + 1;
  return `${novoAno}-${novoMes.toString().padStart(2, '0')}`;
}

/** Quantidade de dias no mês. */
export function diasDoMes(mesRef: string): number {
  const [anoStr, mesStr] = mesRef.split('-');
  const ano = parseInt(anoStr ?? '0', 10);
  const mes = parseInt(mesStr ?? '0', 10);
  return new Date(ano, mes, 0).getDate();
}

/** Lista de todos os dias do mês como strings AAAA-MM-DD. */
export function todasDatasDoMes(mesRef: string): string[] {
  const total = diasDoMes(mesRef);
  const datas: string[] = [];
  for (let dia = 1; dia <= total; dia++) {
    datas.push(`${mesRef}-${dia.toString().padStart(2, '0')}`);
  }
  return datas;
}

// ===== Helpers internos =====

function parseData(data: string): [number, number, number] {
  const ano = parseInt(data.slice(0, 4), 10);
  const mes = parseInt(data.slice(5, 7), 10);
  const dia = parseInt(data.slice(8, 10), 10);
  return [ano, mes, dia];
}

function formatarDataLocal(d: Date): string {
  const ano = d.getFullYear();
  const mes = (d.getMonth() + 1).toString().padStart(2, '0');
  const dia = d.getDate().toString().padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}
