import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import { PaginaInicial } from '../features/dashboard/PaginaInicial';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<PaginaInicial />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
