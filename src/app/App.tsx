import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { Layout } from './Layout';
import { TelaCorrompida } from '../components/TelaCorrompida';
import { Dashboard } from '../features/dashboard/Dashboard';
import { Aulas } from '../features/aulas/Aulas';
import { Calendario } from '../features/calendario/Calendario';
import { Cronograma } from '../features/cronograma/Cronograma';
import { Alunos } from '../features/alunos/Alunos';
import { Turmas } from '../features/turmas/Turmas';
import { Fechamentos } from '../features/fechamentos/Fechamentos';
import { Configuracoes } from '../features/configuracoes/Configuracoes';
import { Diagnostico } from '../features/diagnostico/Diagnostico';

export function App() {
  const erroCorrupcao = useStore((s) => s.erroCorrupcao);

  if (erroCorrupcao) {
    return <TelaCorrompida erro={erroCorrupcao} />;
  }

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
