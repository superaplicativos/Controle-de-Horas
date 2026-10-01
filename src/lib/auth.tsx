'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Professor, Sessao } from '@/types';
import { salvarProfessor, buscarProfessorPorUsername } from './db';
import { loginProfessorAPI, cadastrarProfessorAPI } from './api';

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

  // Carrega sessão ao montar (localStorage = persiste entre sessões)
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
          } else {
            localStorage.removeItem(SESSION_KEY);
          }
        }
      } catch {
        // ignore
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  async function login(username: string, senha: string) {
    try {
      // 1. Tenta login via Worker API (D1 — banco de dados de verdade)
      const result = await loginProfessorAPI(username.trim(), senha);
      if (!result.ok) {
        return { ok: false, erro: result.erro || 'Erro ao fazer login' };
      }

      // 2. Converte dados do D1 (int → boolean) e salva no IndexedDB (cache local)
      const profData = result.professor;
      const prof: Professor = {
        id: profData.id,
        username: profData.username,
        senha_hash: profData.senha_hash,
        salt: profData.salt,
        nome: profData.nome,
        valor_hora: profData.valor_hora,
        valor_falta: profData.valor_falta,
        criado_em: profData.criado_em,
        assinatura_status: profData.assinatura_status,
        assinatura_id: profData.assinatura_id,
        trial_fim: profData.trial_fim,
        bloqueado: !!profData.bloqueado,
        is_admin: !!profData.is_admin,
      };

      // 3. Salva no IndexedDB (pra funcionar offline)
      await salvarProfessor(prof);

      // 4. Cria sessão
      const s: Sessao = {
        professor_id: prof.id,
        username: prof.username,
        nome: prof.nome,
        login_em: Date.now(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      setSessao(s);
      setProfessor(prof);
      return { ok: true };
    } catch (e) {
      return { ok: false, erro: 'Erro ao fazer login' };
    }
  }

  async function cadastrar(dados: { username: string; senha: string; nome: string; valor_hora: number }) {
    try {
      const username = dados.username.trim().toLowerCase();
      if (username.length < 3) return { ok: false, erro: 'Usuário deve ter no mínimo 3 caracteres' };
      if (dados.senha.length < 4) return { ok: false, erro: 'Senha deve ter no mínimo 4 caracteres' };

      // 1. Cadastra via Worker API (D1)
      const result = await cadastrarProfessorAPI({
        username,
        senha: dados.senha,
        nome: dados.nome.trim(),
        valor_hora: dados.valor_hora,
      });

      if (!result.ok) {
        return { ok: false, erro: result.erro || 'Erro ao cadastrar' };
      }

      // 2. Converte dados do D1 e salva no IndexedDB
      const profData = result.professor;
      const prof: Professor = {
        id: profData.id,
        username: profData.username,
        senha_hash: profData.senha_hash,
        salt: profData.salt,
        nome: profData.nome,
        valor_hora: profData.valor_hora,
        valor_falta: profData.valor_falta,
        criado_em: profData.criado_em,
        assinatura_status: profData.assinatura_status,
        trial_fim: profData.trial_fim,
        bloqueado: !!profData.bloqueado,
        is_admin: !!profData.is_admin,
      };

      await salvarProfessor(prof);

      // 3. Cria sessão
      const s: Sessao = {
        professor_id: prof.id,
        username: prof.username,
        nome: prof.nome,
        login_em: Date.now(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      setSessao(s);
      setProfessor(prof);
      return { ok: true };
    } catch (e) {
      return { ok: false, erro: 'Erro ao cadastrar' };
    }
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setSessao(null);
    setProfessor(null);
  }

  async function atualizarProfessor(p: Professor) {
    await salvarProfessor(p);
    setProfessor(p);
  }

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
