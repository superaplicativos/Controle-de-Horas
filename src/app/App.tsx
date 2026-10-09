import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { Layout } from './Layout';
import { TelaCorrompida } from '../components/TelaCorrompida';
import { PaginaInicial } from '../features/dashboard/PaginaInicial';
import { Aulas } from '../features/aulas/Aulas';
import { Alunos } from '../features/alunos/Alunos';
import { Turmas } from '../features/turmas/Turmas';
import { Cronograma } from '../features/cronograma/Cronograma';
import { Configuracoes } from '../features/configuracoes/Configuracoes';

export function App() {
  const erroCorrupcao = useStore((s) => s.erroCorrupcao);

  if (erroCorrupcao) {
    return <TelaCorrompida erro={erroCorrupcao} />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<PaginaInicial />} />
        <Route path="/aulas" element={<Aulas />} />
        <Route path="/alunos" element={<Alunos />} />
        <Route path="/turmas" element={<Turmas />} />
        <Route path="/cronograma" element={<Cronograma />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
