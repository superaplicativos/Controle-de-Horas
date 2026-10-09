import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Uso | Controle de Aulas',
  description: 'Termos de uso do serviço Controle de Aulas para professores autônomos.',
};

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-[#0a1410] text-emerald-50">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-emerald-400">Termos de Uso</p>
          <h1 className="text-3xl sm:text-4xl font-bold">Termos de uso do serviço</h1>
          <p className="text-sm text-emerald-100/60">Última atualização: outubro de 2026.</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. O que é o serviço</h2>
          <p className="text-emerald-100/80 leading-relaxed">
            O <strong>Controle de Aulas</strong> é um sistema online para professores autônomos registrarem aulas dadas, organizarem o cronograma, calcularem o valor a receber por mês e fecharem o mês. O serviço roda no navegador e sincroniza entre dispositivos por meio de um banco de dados na Cloudflare.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Cadastro e conta</h2>
          <p className="text-emerald-100/80 leading-relaxed">
            Para usar o sistema, você cria uma conta com nome, usuário e senha. Você é responsável pela veracidade dos dados informados e por manter a senha em segurança. Não compartilhe sua conta — cada professor deve ter a sua.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Teste grátis e assinatura</h2>
          <p className="text-emerald-100/80 leading-relaxed">
            Todo professor começa com <strong>7 dias grátis</strong>, sem cartão de crédito. Após esse período, para continuar usando é preciso assinar o plano mensal de <strong>R$ 3,49 por mês</strong>, pago no Mercado Pago. O acesso é liberado manualmente em até 24 horas após o envio do comprovante no WhatsApp (11 96616-1611).
          </p>
          <p className="text-emerald-100/80 leading-relaxed">
            Não há fidelidade: você pode cancelar quando quiser, sem multa. O acesso continua até o fim do mês já pago.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Uso aceitável</h2>
          <p className="text-emerald-100/80 leading-relaxed">
            Você se compromete a usar o serviço para fins legítimos de gestão das próprias aulas. É proibido tentar acessar dados de outros professores, alterar o funcionamento do sistema, sobrecarregar a infraestrutura ou usar a plataforma para qualquer atividade ilegal.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Seus dados</h2>
          <p className="text-emerald-100/80 leading-relaxed">
            Você é o dono dos dados que cadastra. Pode exportar tudo em arquivo <strong>.txt</strong> a qualquer momento pela página de Configurações. Os detalhes de como tratamos seus dados estão na <a href="/Controle-de-Horas/privacidade/" className="text-emerald-300 hover:underline">Política de Privacidade</a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Disponibilidade</h2>
          <p className="text-emerald-100/80 leading-relaxed">
            O serviço é oferecido &ldquo;como está&rdquo;. Fazemos o possível para manter no ar, mas não garantimos disponibilidade contínua. Manutenções, atualizações e falhas de provedores externos (Cloudflare, GitHub Pages, Mercado Pago) podem afetar o acesso. Em caso de indisponibilidade, seus dados locais continuam acessíveis no aparelho onde você já estava logado.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Direitos autorais</h2>
          <p className="text-emerald-100/80 leading-relaxed">
            O código do Controle de Aulas é protegido pela <strong>Lei n&ordm; 9.610/98</strong>. É proibido copiar, clonar ou redistribuir o sistema sem autorização expressa do desenvolvedor. Para licenciamento comercial ou parcerias, entre em contato pelo WhatsApp 11 96616-1611.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Alterações destes termos</h2>
          <p className="text-emerald-100/80 leading-relaxed">
            Podemos atualizar estes termos a qualquer momento. Quando houver mudança material, avisaremos pelo painel do sistema. O uso continuado após a atualização configura aceitação dos novos termos.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Contato</h2>
          <p className="text-emerald-100/80 leading-relaxed">
            Para dúvidas sobre estes termos, escreva no WhatsApp <a href="https://wa.me/5511966161611" className="text-emerald-300 hover:underline" target="_blank" rel="noopener noreferrer">11 96616-1611</a>.
          </p>
        </section>

        <footer className="pt-8 border-t border-emerald-900/40 text-xs text-emerald-100/40">
          <p>Controle de Aulas — professor apoiando professor.</p>
        </footer>
      </article>
    </main>
  );
}
