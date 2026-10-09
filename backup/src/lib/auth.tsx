'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Professor, Sessao } from '@/types';
import { salvarProfessor, buscarProfessorPorUsername } from './db';
import { cadastrarProfessorAPI, loginProfessorAPI, puxarDoCloud } from './api';
import { gerarId } from './crypto';

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

function traduzirErro(erro: string | undefined, fallback: string): string {
  if (!erro) return fallback;
  const e = erro.toLowerCase();
  if (e.includes('failed to fetch') || e.includes('network') || e.includes('load failed')) {
    return 'Sem internet. Verifique sua conexão e tente novamente.';
  }
  if (e.includes('não encontrado') || e.includes('not found')) return 'Usuário não encontrado';
  if (e.includes('senha') || e.includes('password')) return 'Senha incorreta';
  if (e.includes('bloque')) return 'Conta bloqueada pelo administrador';
  return erro;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (raw) {
          const s = JSON.parse(raw) as Sessao;
          const prof = await buscarProfessorPorUsername(s.username);
          if (prof && prof.id === s.professor_id) {
            setSessao(s);
            setProfessor(prof);
            // Traz dados atualizados do cloud em background (não bloqueia o login)
            puxarDoCloud(prof).then((r) => {
              if (r.ok) {
                buscarProfessorPorUsername(s.username).then((p) => {
                  if (p) setProfessor(p);
                });
              }
            }).catch(() => {});
          } else {
            localStorage.removeItem(SESSION_KEY);
          }
        }
      } catch {} finally { setCarregando(false); }
    })();
  }, []);

  async function login(username: string, senha: string) {
    try {
      const result = await loginProfessorAPI(username.trim(), senha);
      if (!result.ok || !result.professor) {
        return { ok: false, erro: traduzirErro(result.erro, 'Erro ao fazer login') };
      }
      const prof = result.professor as Professor;
      await salvarProfessor(prof);
      const s: Sessao = { professor_id: prof.id, username: prof.username, nome: prof.nome, login_em: Date.now() };
      localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      setSessao(s);
      setProfessor(prof);
      // Puxa dados do cloud em background
      puxarDoCloud(prof).then(() => {
        buscarProfessorPorUsername(prof.username).then((p) => {
          if (p) setProfessor(p);
        });
      }).catch(() => {});
      return { ok: true };
    } catch (e: any) {
      return { ok: false, erro: traduzirErro(e?.message, 'Erro ao fazer login') };
    }
  }

  async function cadastrar(dados: { username: string; senha: string; nome: string; valor_hora: number }) {
    try {
      const username = dados.username.trim().toLowerCase();
      if (username.length < 3) return { ok: false, erro: 'Usuário deve ter no mínimo 3 caracteres' };
      if (dados.senha.length < 4) return { ok: false, erro: 'Senha deve ter no mínimo 4 caracteres' };

      const result = await cadastrarProfessorAPI({
        username,
        senha: dados.senha,
        nome: dados.nome.trim() || username,
        valor_hora: dados.valor_hora,
      });
      if (!result.ok || !result.professor) {
        return { ok: false, erro: traduzirErro(result.erro, 'Erro ao cadastrar') };
      }
      const prof = result.professor as Professor;
      await salvarProfessor(prof);
      const s: Sessao = { professor_id: prof.id, username: prof.username, nome: prof.nome, login_em: Date.now() };
      localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      setSessao(s);
      setProfessor(prof);
      // Puxa do cloud (deve estar vazio, mas garante consistência)
      puxarDoCloud(prof).catch(() => {});
      return { ok: true };
    } catch (e: any) {
      return { ok: false, erro: traduzirErro(e?.message, 'Erro ao cadastrar') };
    }
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

// Reexporta para conveniência (gerarId ainda é usado por outras partes do app)
export { gerarId };
