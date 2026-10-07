/**
 * Gera relatório PDF profissional estilizado.
 * Abre uma nova janela com HTML formatado e dispara o print (Ctrl+P → salvar como PDF).
 */

import { formatarMoeda, formatarHoras, nomeMes, diaDaSemana } from './calculations';
import type { Aula } from '@/types';

export function exportarRelatorioPDF(mesRef: string, professorNome: string, aulas: Aula[]) {
  const total = aulas.reduce((s, a) => s + a.valor, 0);
  const horas = aulas.reduce((s, a) => s + (a.status === 'presenca' ? a.duracao : a.status === 'falta' ? 1 : 0), 0);
  const presencas = aulas.filter(a => a.status === 'presenca').length;
  const faltas = aulas.filter(a => a.status === 'falta').length;

  // Agrupa por aluno
  const porAluno: Record<string, Aula[]> = {};
  for (const a of aulas) {
    if (!porAluno[a.aluno_nome]) porAluno[a.aluno_nome] = [];
    porAluno[a.aluno_nome].push(a);
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório de Aulas — ${nomeMes(mesRef)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', 'Times New Roman', serif; color: #1a1a1a; padding: 40px; background: #f5f5f0; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0a1410; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { font-size: 28px; color: #0a1410; }
  .header .subtitle { font-size: 14px; color: #666; margin-top: 4px; }
  .header .logo { font-size: 24px; font-weight: bold; color: #059669; }
  .professor-box { background: #0a1410; color: white; padding: 20px 30px; border-radius: 8px; margin-bottom: 30px; }
  .professor-box .nome { font-size: 22px; font-weight: bold; }
  .professor-box .info { font-size: 14px; opacity: 0.8; margin-top: 4px; }
  .kpis { display: flex; gap: 15px; margin-bottom: 30px; }
  .kpi { flex: 1; background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; text-align: center; }
  .kpi .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; }
  .kpi .value { font-size: 28px; font-weight: bold; margin-top: 8px; }
  .kpi.aulas .value { color: #0ea5e9; }
  .kpi.horas .value { color: #8b5cf6; }
  .kpi.ganhos .value { color: #10b981; }
  .kpi.faltas .value { color: #ef4444; }
  .section-title { font-size: 16px; font-weight: bold; color: #0a1410; border-bottom: 2px solid #059669; padding-bottom: 8px; margin-bottom: 15px; margin-top: 30px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
  th { background: #0a1410; color: white; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 8px 12px; border-bottom: 1px solid #e0e0e0; font-size: 13px; }
  tr:nth-child(even) { background: #f9f9f5; }
  .status-presenca { color: #10b981; font-weight: bold; }
  .status-falta { color: #ef4444; font-weight: bold; }
  .status-cancelada { color: #999; }
  .subtotal-row { background: #f0f9f4 !important; font-weight: bold; }
  .total-box { background: linear-gradient(135deg, #0a1410, #1a3020); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-top: 30px; }
  .total-box .label { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.7; }
  .total-box .value { font-size: 42px; font-weight: bold; margin-top: 10px; color: #fbbf24; }
  .footer { text-align: center; font-size: 11px; color: #999; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; }
  @media print { body { background: white; padding: 0; } .no-print { display: none; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Relatório de Aulas</h1>
      <div class="subtitle">${nomeMes(mesRef)}</div>
    </div>
    <div class="logo">Controle de Aulas</div>
  </div>

  <div class="professor-box">
    <div class="nome">${professorNome}</div>
    <div class="info">Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR').substring(0, 5)}</div>
  </div>

  <div class="kpis">
    <div class="kpi aulas">
      <div class="label">Aulas</div>
      <div class="value">${aulas.length}</div>
    </div>
    <div class="kpi horas">
      <div class="label">Horas</div>
      <div class="value">${formatarHoras(horas)}</div>
    </div>
    <div class="kpi ganhos">
      <div class="label">Ganhos</div>
      <div class="value">${formatarMoeda(total)}</div>
    </div>
    <div class="kpi faltas">
      <div class="label">Faltas</div>
      <div class="value">${faltas}</div>
    </div>
  </div>

  ${Object.entries(porAluno).map(([alunoNome, aulasAluno]) => {
    const subtotal = aulasAluno.reduce((s, a) => s + a.valor, 0);
    return `
      <div class="section-title">${alunoNome} — ${formatarMoeda(subtotal)}</div>
      <table>
        <thead>
          <tr><th>Data</th><th>Dia</th><th>Horário</th><th>Duração</th><th>Status</th><th>Conteúdo</th><th>Valor</th></tr>
        </thead>
        <tbody>
          ${aulasAluno.map(a => `
            <tr>
              <td>${a.data.split('-')[2]}/${a.data.split('-')[1]}</td>
              <td>${diaDaSemana(a.data)}</td>
              <td>${a.horario || '--'}</td>
              <td>${a.duracao}h</td>
              <td class="status-${a.status}">${a.status === 'presenca' ? 'Presença' : a.status === 'falta' ? 'Falta' : a.status}</td>
              <td>${a.conteudo || '-'}</td>
              <td>${formatarMoeda(a.valor)}</td>
            </tr>
          `).join('')}
          <tr class="subtotal-row">
            <td colspan="6">Subtotal ${alunoNome}</td>
            <td>${formatarMoeda(subtotal)}</td>
          </tr>
        </tbody>
      </table>
    `;
  }).join('')}

  <div class="total-box">
    <div class="label">Total Geral do Mês</div>
    <div class="value">${formatarMoeda(total)}</div>
  </div>

  <div class="footer">
    Relatório gerado pelo Controle de Aulas — Sistema de gestão para professores<br>
    Professor apoiando professor — R$ 3,49/mês
  </div>

  <div class="no-print" style="text-align:center; margin-top:20px;">
    <button onclick="window.print()" style="padding:12px 30px; font-size:16px; background:#059669; color:white; border:none; border-radius:8px; cursor:pointer;">Salvar como PDF</button>
  </div>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}
