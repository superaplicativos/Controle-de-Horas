'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Professor, Sessao } from '@/types';
import { gerarSalt, hashSenha, verificarSenha, gerarId } from './crypto';
import { salvarProfessor, buscarProfessorPorUsername } from './db';
import { seedGuilherme } from './seed';

const SESSION_KEY = 'controle-aulas-session';

interface AuthContextValue {
  sessao: Sessao | null;
  professor: Professor | null;
  carregando: boolean;
  login: (username: string, senha: string) => Promise<{ ok: boolean; erro?: string }>;
  cadastrar: (dados: { username: string; senha: string; nome: string; valor_hora: number }) => Promise<{ ok: boolean; erro?: string }>;
  logout: () => void;
  atualizarProfessor: (p: Professor) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        await seedGuilherme();
        const raw = localStorage.getItem(SESSION_KEY);
        if (raw) {
          const s = JSON.parse(raw) as Sessao;
          const prof = await buscarProfessorPorUsername(s.username);
          if (prof && prof.id === s.professor_id) { setSessao(s); setProfessor(prof); }
          else localStorage.removeItem(SESSION_KEY);
        }
      } catch {} finally { setCarregando(false); }
    })();
  }, []);

  async function login(username: string, senha: string) {
    try {
      await seedGuilherme();
      const prof = await buscarProfessorPorUsername(username.trim());
      if (!prof) return { ok: false, erro: 'Usuário não encontrado' };
      const ok = await verificarSenha(senha, prof.salt, prof.senha_hash);
      if (!ok) return { ok: false, erro: 'Senha incorreta' };
      const s: Sessao = { professor_id: prof.id, username: prof.username, nome: prof.nome, login_em: Date.now() };
      localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      setSessao(s); setProfessor(prof);
      return { ok: true };
    } catch { return { ok: false, erro: 'Erro ao fazer login' }; }
  }

  async function cadastrar(dados: { username: string; senha: string; nome: string; valor_hora: number }) {
    try {
      const username = dados.username.trim().toLowerCase();
      if (username.length < 3) return { ok: false, erro: 'Usuário deve ter no mínimo 3 caracteres' };
      if (dados.senha.length < 4) return { ok: false, erro: 'Senha deve ter no mínimo 4 caracteres' };
      const existente = await buscarProfessorPorUsername(username);
      if (existente) return { ok: false, erro: 'Usuário já existe' };
      const salt = gerarSalt();
      const senhaHash = await hashSenha(dados.senha, salt);
      const prof: Professor = {
        id: gerarId(), username, senha_hash: senhaHash, salt,
        nome: dados.nome.trim(), valor_hora: dados.valor_hora, valor_falta: 35,
        criado_em: Date.now(), assinatura_status: 'free_trial',
        trial_fim: Date.now() + 7*24*60*60*1000, bloqueado: false,
        is_admin: username === 'guilherme',
      };
      await salvarProfessor(prof);
      const s: Sessao = { professor_id: prof.id, username: prof.username, nome: prof.nome, login_em: Date.now() };
      localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      setSessao(s); setProfessor(prof);
      return { ok: true };
    } catch { return { ok: false, erro: 'Erro ao cadastrar' }; }
  }

  function logout() { localStorage.removeItem(SESSION_KEY); setSessao(null); setProfessor(null); }
  async function atualizarProfessor(p: Professor) { await salvarProfessor(p); setProfessor(p); }

  return (
    <AuthContext.Provider value={{ sessao, professor, carregando, login, cadastrar, logout, atualizarProfessor }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
