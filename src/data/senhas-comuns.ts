// 100 senhas mais comuns. R-24.3: rejeitar no assistente de primeira configuração.
// Lista curta e deliberada — não é exaustiva, mas pega as óbvias.

export const SENHAS_COMUNS = new Set([
  '1234567890', '123456789', '12345678', '1234567', '123456',
  'password', 'password1', 'password12', 'password123',
  'qwerty', 'qwerty123', 'qwertyuiop', 'abc123', 'abc12345',
  'iloveyou', 'letmein', 'welcome', 'welcome1', 'monkey',
  'dragon', 'master', 'login', 'login123', 'princess',
  'football', 'shadow', 'sunshine', 'trustno1', 'baseball',
  'superman', 'batman', 'michael', 'jennifer', 'jordan',
  'hunter', 'passw0rd', '1q2w3e4r', '1q2w3e', 'qazwsx',
  'q1w2e3r4', 'zxcvbnm', 'asdfghjkl', '123qwe', 'qwe123',
  'admin', 'admin123', 'root', 'root123', 'test',
  'test123', 'guest', 'guest123', 'user', 'user123',
  '11111111', '22222222', '33333333', '44444444', '55555555',
  '66666666', '77777777', '88888888', '99999999', '00000000',
  'abcdefgh', 'abcd1234', 'aaaa1111', 'aaaa2222', 'aabb1122',
  'minhasenha', 'minhasenha1', 'senha', 'senha123', 'senha1234',
  'professor', 'professor123', 'aluno', 'aluno123', 'aula',
  'aula123', 'escola', 'escola123', 'controle', 'horas',
  'guilherme', 'miranda', 'professor', 'sao paulo', 'brasil',
  'Brasil123', 'Senha@123', 'P@ssw0rd', 'P@ssword1', 'Admin@123',
]);

/** R-24.3: verifica se a senha é forte o suficiente. Retorna null se OK, mensagem se rejeitada. */
export function validarForcaSenha(senha: string): string | null {
  if (senha.length < 10) {
    return 'A senha deve ter no mínimo 10 caracteres';
  }
  if (SENHAS_COMUNS.has(senha.toLowerCase())) {
    return 'Esta senha é muito comum. Escolha outra.';
  }
  return null;
}
