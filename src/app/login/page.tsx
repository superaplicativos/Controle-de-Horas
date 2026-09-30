'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, LogIn, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, cadastrar } = useAuth();
  const [modo, setModo] = useState<'login' | 'cadastro'>('login');
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [valorHora, setValorHora] = useState('35');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    const vh = parseFloat(valorHora.replace(',', '.'));
    const result = modo === 'login'
      ? await login(username, senha)
      : await cadastrar({ username, senha, nome, valor_hora: isNaN(vh) ? 35 : vh });

    setCarregando(false);
    if (result.ok) {
      router.push('/dashboard');
    } else {
      setErro(result.erro || 'Erro');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-sky-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg mb-3">
            <BookOpen className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Controle de Aulas</h1>
          <p className="text-sm text-muted-foreground">Seu painel de gestão de horas e ganhos</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                variant={modo === 'login' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setModo('login')}
                className="flex-1"
              >
                <LogIn className="w-4 h-4 mr-2" /> Entrar
              </Button>
              <Button
                type="button"
                variant={modo === 'cadastro' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setModo('cadastro')}
                className="flex-1"
              >
                <UserPlus className="w-4 h-4 mr-2" /> Cadastrar
              </Button>
            </div>
            <CardTitle>
              {modo === 'login' ? 'Bem-vindo de volta' : 'Criar conta de professor'}
            </CardTitle>
            <CardDescription>
              {modo === 'login'
                ? 'Entre com seu usuário e senha'
                : 'Preencha os dados para criar sua conta'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-3">
              {modo === 'cadastro' && (
                <div className="space-y-1.5">
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Guilherme Miranda"
                    required
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="seu_usuario"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••"
                  autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
                  required
                />
              </div>
              {modo === 'cadastro' && (
                <div className="space-y-1.5">
                  <Label htmlFor="valor">Valor por hora (R$)</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    min="0"
                    value={valorHora}
                    onChange={(e) => setValorHora(e.target.value)}
                    placeholder="35"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Padrão: R$ 35/h. Falta = R$ 35 (1h). Você pode alterar depois.
                  </p>
                </div>
              )}
              {erro && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                  {erro}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col gap-3 mt-4">
              <Button type="submit" disabled={carregando} className="w-full">
                {carregando ? 'Processando...' : modo === 'login' ? 'Entrar' : 'Criar conta'}
              </Button>
            </CardFooter>
          </form>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-4">
          Seus dados ficam salvos no seu navegador. Configure o sync via GitHub nas configurações.
        </p>
      </div>
    </div>
  );
}
