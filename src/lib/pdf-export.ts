/**
 * Exporta dados para PDF (HTML → print → salvar como PDF).
 * Funciona para qualquer página do sistema.
 */

import { formatarMoeda, formatarHoras, nomeMes, diaDaSemana } from './calculations';
import type { Aula, Aluno, Turma, CronogramaItem, Fechamento, Professor } from '@/types';

function abrirHTML(titulo: string, professorNome: string, conteudo: string) {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${titulo}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', 'Times New Roman', serif; color: #1a1a1a; padding: 40px; background: #f5f5f0; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0a1410; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { font-size: 24px; color: #0a1410; }
  .header .subtitle { font-size: 13px; color: #666; margin-top: 4px; }
  .header .logo { font-size: 20px; font-weight: bold; color: #059669; }
  .professor-box { background: #0a1410; color: white; padding: 15px 25px; border-radius: 8px; margin-bottom: 25px; }
  .professor-box .nome { font-size: 18px; font-weight: bold; }
  .professor-box .info { font-size: 12px; opacity: 0.8; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #0a1410; color: white; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 6px 10px; border-bottom: 1px solid #e0e0e0; font-size: 12px; }
  tr:nth-child(even) { background: #f9f9f5; }
  .status-presenca { color: #10b981; font-weight: bold; }
  .status-falta { color: #ef4444; font-weight: bold; }
  .status-cancelada { color: #999; }
  .subtotal-row { background: #f0f9f4 !important; font-weight: bold; }
  .section-title { font-size: 15px; font-weight: bold; color: #0a1410; border-bottom: 2px solid #059669; padding-bottom: 6px; margin-bottom: 12px; margin-top: 25px; }
  .total-box { background: linear-gradient(135deg, #0a1410, #1a3020); color: white; padding: 25px; border-radius: 10px; text-align: center; margin-top: 25px; }
  .total-box .label { font-size: 13px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.7; }
  .total-box .value { font-size: 36px; font-weight: bold; margin-top: 8px; color: #fbbf24; }
  .footer { text-align: center; font-size: 10px; color: #999; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; }
  .no-print { text-align: center; margin-top: 20px; }
  @media print { body { background: white; padding: 0; } .no-print { display: none; } }
</style>
</head>
<body>
  <div class="header">
    <div><h1>${titulo}</h1><div class="subtitle">Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR').substring(0, 5)}</div></div>
    <div class="logo">Controle de Aulas</div>
  </div>
  <div class="professor-box"><div class="nome">${professorNome}</div><div class="info">Sistema de gestão para professores</div></div>
  ${conteudo}
  <div class="footer">Controle de Aulas — Professor apoiando professor — R$ 3,49/mês</div>
  <div class="no-print"><button onclick="window.print()" style="padding:10px 25px;font-size:14px;background:#059669;color:white;border:none;border-radius:6px;cursor:pointer;">Salvar como PDF</button></div>
</body>
</html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
}

export function exportarAulasPDF(mesRef: string, professorNome: string, aulas: Aula[]) {
  const total = aulas.reduce((s, a) => s + a.valor, 0);
  const horas = aulas.reduce((s, a) => s + (a.status === 'presenca' ? a.duracao : a.status === 'falta' ? 1 : 0), 0);
  const presencas = aulas.filter(a => a.status === 'presenca').length;
  const faltas = aulas.filter(a => a.status === 'falta').length;

  const porAluno: Record<string, Aula[]> = {};
  for (const a of aulas) {
    if (!porAluno[a.aluno_nome]) porAluno[a.aluno_nome] = [];
    porAluno[a.aluno_nome].push(a);
  }

  let conteudo = `
    <div class="section-title">Resumo — ${nomeMes(mesRef)}</div>
    <table>
      <tr><th>Aulas</th><th>Horas</th><th>Presenças</th><th>Faltas</th><th>Total</th></tr>
      <tr><td>${aulas.length}</td><td>${formatarHoras(horas)}</td><td style="color:#10b981;font-weight:bold">${presencas}</td><td style="color:#ef4444;font-weight:bold">${faltas}</td><td style="font-weight:bold">${formatarMoeda(total)}</td></tr>
    </table>
  `;

  for (const [alunoNome, aulasAluno] of Object.entries(porAluno)) {
    const subtotal = aulasAluno.reduce((s, a) => s + a.valor, 0);
    conteudo += `<div class="section-title">${alunoNome} — ${formatarMoeda(subtotal)}</div>
    <table><thead><tr><th>Data</th><th>Dia</th><th>Horário</th><th>Dur.</th><th>Status</th><th>Conteúdo</th><th>Valor</th></tr></thead><tbody>`;
    for (const a of aulasAluno) {
      const statusClass = `status-${a.status}`;
      const statusLabel = a.status === 'presenca' ? 'Presença' : a.status === 'falta' ? 'Falta' : a.status;
      conteudo += `<tr>
        <td>${a.data.split('-')[2]}/${a.data.split('-')[1]}</td>
        <td>${diaDaSemana(a.data)}</td>
        <td>${a.horario || '--'}</td>
        <td>${a.duracao}h</td>
        <td class="${statusClass}">${statusLabel}</td>
        <td>${a.conteudo || '-'}</td>
        <td>${formatarMoeda(a.valor)}</td>
      </tr>`;
    }
    conteudo += `<tr class="subtotal-row"><td colspan="6">Subtotal ${alunoNome}</td><td>${formatarMoeda(subtotal)}</td></tr></tbody></table>`;
  }

  conteudo += `<div class="total-box"><div class="label">Total — ${nomeMes(mesRef)}</div><div class="value">${formatarMoeda(total)}</div></div>`;
  abrirHTML(`Relatório de Aulas — ${nomeMes(mesRef)}`, professorNome, conteudo);
}

export function exportarAlunosPDF(professorNome: string, alunos: Aluno[], turmas: Turma[]) {
  let conteudo = '<div class="section-title">Alunos VIP</div><table><thead><tr><th>#</th><th>Nome</th><th>Tipo</th><th>Status</th></tr></thead><tbody>';
  const vips = alunos.filter(a => a.tipo === 'vip');
  vips.forEach((a, i) => {
    conteudo += `<tr><td>${i+1}</td><td>${a.nome}</td><td>VIP</td><td style="color:${a.ativo ? '#10b981' : '#999'}">${a.ativo ? 'Ativo' : 'Inativo'}</td></tr>`;
  });
  conteudo += '</tbody></table>';

  const turmasAlunos = alunos.filter(a => a.tipo === 'turma');
  if (turmasAlunos.length > 0) {
    conteudo += '<div class="section-title">Turmas</div><table><thead><tr><th>#</th><th>Nome</th><th>Status</th></tr></thead><tbody>';
    turmasAlunos.forEach((a, i) => {
      conteudo += `<tr><td>${i+1}</td><td>${a.nome}</td><td style="color:${a.ativo ? '#10b981' : '#999'}">${a.ativo ? 'Ativo' : 'Inativo'}</td></tr>`;
    });
    conteudo += '</tbody></table>';
  }

  conteudo += `<div class="total-box"><div class="label">Total de alunos</div><div class="value">${alunos.length}</div></div>`;
  abrirHTML('Lista de Alunos', professorNome, conteudo);
}

export function exportarCronogramaPDF(professorNome: string, itens: CronogramaItem[]) {
  const porData: Record<string, CronogramaItem[]> = {};
  for (const c of itens) {
    if (!porData[c.data]) porData[c.data] = [];
    porData[c.data].push(c);
  }

  let conteudo = `<div class="section-title">Itens do Cronograma (${itens.length})</div>`;
  for (const [data, itensData] of Object.entries(porData).sort()) {
    conteudo += `<div class="section-title">${data.split('-')[2]}/${data.split('-')[1]} — ${diaDaSemana(data)}</div>
    <table><thead><tr><th>Título</th><th>Aluno</th><th>Horário</th><th>Dur.</th><th>Observação</th></tr></thead><tbody>`;
    for (const c of itensData) {
      conteudo += `<tr><td>${c.titulo}</td><td>${c.aluno_nome || '-'}</td><td>${c.horario || '--'}</td><td>${c.duracao}h</td><td>${c.observacao || '-'}</td></tr>`;
    }
    conteudo += '</tbody></table>';
  }

  conteudo += `<div class="total-box"><div class="label">Total de itens</div><div class="value">${itens.length}</div></div>`;
  abrirHTML('Cronograma de Aulas', professorNome, conteudo);
}

export function exportarGeralPDF(professorNome: string, aulas: Aula[], alunos: Aluno[], turmas: Turma[], cronograma: CronogramaItem[], fechamentos: Fechamento[]) {
  const total = aulas.reduce((s, a) => s + a.valor, 0);
  const horas = aulas.reduce((s, a) => s + (a.status === 'presenca' ? a.duracao : a.status === 'falta' ? 1 : 0), 0);
  const presencas = aulas.filter(a => a.status === 'presenca').length;
  const faltas = aulas.filter(a => a.status === 'falta').length;

  const meses = [...new Set(aulas.map(a => a.mes_ref))].sort();

  let conteudo = `
    <div class="section-title">Resumo Geral</div>
    <table>
      <tr><th>Total Aulas</th><th>Horas</th><th>Presenças</th><th>Faltas</th><th>Alunos</th><th>Turmas</th><th>Total Geral</th></tr>
      <tr><td>${aulas.length}</td><td>${formatarHoras(horas)}</td><td style="color:#10b981;font-weight:bold">${presencas}</td><td style="color:#ef4444;font-weight:bold">${faltas}</td><td>${alunos.length}</td><td>${turmas.length}</td><td style="font-weight:bold">${formatarMoeda(total)}</td></tr>
    </table>
  `;

  // Por mês
  for (const mes of meses) {
    const aulasMes = aulas.filter(a => a.mes_ref === mes);
    const totalMes = aulasMes.reduce((s, a) => s + a.valor, 0);
    conteudo += `<div class="section-title">${nomeMes(mes)} — ${aulasMes.length} aulas — ${formatarMoeda(totalMes)}</div>
    <table><thead><tr><th>Data</th><th>Aluno</th><th>Status</th><th>Dur.</th><th>Conteúdo</th><th>Valor</th></tr></thead><tbody>`;
    for (const a of aulasMes) {
      const statusClass = `status-${a.status}`;
      const statusLabel = a.status === 'presenca' ? 'Presença' : a.status === 'falta' ? 'Falta' : a.status;
      conteudo += `<tr><td>${a.data.split('-')[2]}/${a.data.split('-')[1]}</td><td>${a.aluno_nome}</td><td class="${statusClass}">${statusLabel}</td><td>${a.duracao}h</td><td>${a.conteudo || '-'}</td><td>${formatarMoeda(a.valor)}</td></tr>`;
    }
    conteudo += '</tbody></table>';
  }

  // Alunos
  conteudo += '<div class="section-title">Alunos</div><table><thead><tr><th>Nome</th><th>Tipo</th><th>Status</th></tr></thead><tbody>';
  for (const a of alunos) {
    conteudo += `<tr><td>${a.nome}</td><td>${a.tipo === 'vip' ? 'VIP' : 'Turma'}</td><td style="color:${a.ativo ? '#10b981' : '#999'}">${a.ativo ? 'Ativo' : 'Inativo'}</td></tr>`;
  }
  conteudo += '</tbody></table>';

  // Cronograma
  if (cronograma.length > 0) {
    conteudo += `<div class="section-title">Cronograma (${cronograma.length} itens)</div><table><thead><tr><th>Data</th><th>Título</th><th>Aluno</th><th>Horário</th></tr></thead><tbody>`;
    for (const c of cronograma) {
      conteudo += `<tr><td>${c.data.split('-')[2]}/${c.data.split('-')[1]}</td><td>${c.titulo}</td><td>${c.aluno_nome || '-'}</td><td>${c.horario || '--'}</td></tr>`;
    }
    conteudo += '</tbody></table>';
  }

  // Fechamentos
  if (fechamentos.length > 0) {
    conteudo += '<div class="section-title">Fechamentos</div><table><thead><tr><th>Mês</th><th>Aulas</th><th>Horas</th><th>Total</th></tr></thead><tbody>';
    for (const f of fechamentos) {
      conteudo += `<tr><td>${f.mes}</td><td>${f.total_aulas}</td><td>${formatarHoras(f.total_horas)}</td><td>${formatarMoeda(f.total_ganhos)}</td></tr>`;
    }
    conteudo += '</tbody></table>';
  }

  conteudo += `<div class="total-box"><div class="label">Total Geral</div><div class="value">${formatarMoeda(total)}</div></div>`;
  abrirHTML('Relatório Geral Completo', professorNome, conteudo);
}
