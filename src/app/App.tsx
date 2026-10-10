import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, HashRouter } from 'react-router-dom';
import { useStore } from '../store/store';
import { carregarSync } from '../data/storage';
import { decidirEstado, verificarAcessoExiste, type EstadoAcesso } from '../data/acesso';
import { detectarRepositorio } from '../data/github';
import { TelaCorrompida } from '../components/TelaCorrompida';
import { Layout } from './Layout';
import { Dashboard } from '../features/dashboard/Dashboard';
import { Aulas } from '../features/aulas/Aulas';
import { Calendario } from '../features/calendario/Calendario';
import { Cronograma } from '../features/cronograma/Cronograma';
import { Alunos } from '../features/alunos/Alunos';
import { Turmas } from '../features/turmas/Turmas';
import { Fechamentos } from '../features/fechamentos/Fechamentos';
import { Configuracoes } from '../features/configuracoes/Configuracoes';
import { Diagnostico } from '../features/diagnostico/Diagnostico';
import { TelaSenha } from '../features/acesso/TelaSenha';
import { AssistentePrimeiraConfiguracao } from '../features/acesso/AssistentePrimeiraConfiguracao';
import { TelaErroRede } from '../features/acesso/TelaErroRede';

function useEstadoAcesso(): EstadoAcesso {
  const erroCorrupcao = useStore((s) => s.erroCorrupcao);
  const sync = carregarSync();
  const temMaterialLocal = !!(sync && sync.token && sync.chaveDados);

  const [estado, setEstado] = useState<EstadoAcesso>(() => {
    if (erroCorrupcao) return 'desbloqueado';
    if (temMaterialLocal) return 'desbloqueado';
    return 'detectando';
  });

  useEffect(() => {
    if (erroCorrupcao || temMaterialLocal) {
      return;
    }

    const detectado = detectarRepositorio(window.location.href);
    const repo = sync?.repo ?? (detectado ? `${detectado.owner}/${detectado.repo}` : '');
    if (!repo) {
      setEstado('primeiraConfiguracao');
      return;
    }

    let cancelado = false;
    (async () => {
      const r = await verificarAcessoExiste(repo);
      if (cancelado) return;
      setEstado(decidirEstado({
        temMaterialLocal: false,
        acessoExiste: r.existe ? true : false,
        erroRede: !!r.erro,
      }));
    })();

    return () => { cancelado = true; };
  }, [erroCorrupcao, temMaterialLocal, sync]);

  return estado;
}

function RoteadorAcesso() {
  const erroCorrupcao = useStore((s) => s.erroCorrupcao);
  const estado = useEstadoAcesso();

  if (erroCorrupcao) {
    return <TelaCorrompida erro={erroCorrupcao} />;
  }

  if (estado === 'detectando') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 animate-pulse">Carregando...</div>
      </div>
    );
  }

  if (estado === 'primeiraConfiguracao') {
    return <AssistentePrimeiraConfiguracao />;
  }

  if (estado === 'pedeSenha') {
    return <TelaSenha />;
  }

  if (estado === 'erroRede') {
    return <TelaErroRede />;
  }

  // desbloqueado
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/aulas" element={<Aulas />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/cronograma" element={<Cronograma />} />
        <Route path="/alunos" element={<Alunos />} />
        <Route path="/turmas" element={<Turmas />} />
        <Route path="/fechamentos" element={<Fechamentos />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="/diagnostico" element={<Diagnostico />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <HashRouter>
      <RoteadorAcesso />
    </HashRouter>
  );
}
