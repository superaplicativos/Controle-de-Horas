import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade | Controle de Aulas',
  description: 'Quais dados coletamos, onde ficam guardados e como você pode cancelar ou exportar tudo.',
};

const SITE_URL = 'https://superaplicativos.github.io/Controle-de-Horas';

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-[#0a1410] text-emerald-50">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-emerald-400">Política de Privacidade</p>
          <h1 className="text-3xl sm:text-4xl font-bold">Como tratamos seus dados</h1>
          <p className="text-sm text-emerald-100/60">Última atualização: outubro de 2026.</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Quais dados coletamos</h2>
          <p className="text-emerald-100/80 leading-relaxed">
            Para criar e manter sua conta, coletamos: <strong>nome</strong>, <strong>usuário</strong> e <strong>senha</strong> (a senha é armazenada apenas como hash SHA-256 com salt, nunca em texto puro). Para o funcionamento do sistema, você também informa <strong>nomes de alunos</strong>, <strong>nomes de turmas</strong>, <strong>aulas dadas</strong> (com data, horário, duração, status e conteúdo), <strong>itens do cronograma</strong> e <strong>fechamentos mensais</strong>. Não pedimos e não armazenamos documentos, endereços, telefones de alunos ou qualquer dado sensível.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Onde os dados ficam</h2>
          <p className="text-emerald-100/80 leading-relaxed">
            Seus dados ficam em dois lugares: no <strong>navegador do seu aparelho</strong> (IndexedDB, usado para abrir o app rápido) e no <strong>banco de dados Cloudflare D1</strong> (usado para sincronizar entre dispositivos). A comunicação entre o navegador e a Cloudflare é feita por HTTPS. A senha nunca vai para o navegador em texto puro — só o hash fica no banco.
          </p>
          <p className="text-emerald-100/80 leading-relaxed">
            Não compartilhamos seus dados com terceiros. Não vendemos dados. Não fazemos publicidade com base no que você cadastra.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Pagamento</h2>
          <p className="text-emerald-100/80 leading-relaxed">
            O pagamento da assinatura é processado pelo <strong>Mercado Pago</strong>. O Controle de Aulas não vê nem armazena dados do seu cartão. A liberação do acesso, no modelo atual, é <strong>manual</strong>: você paga no Mercado Pago e envia o comprovante no WhatsApp (11 96616-1611); liberamos em até 24 horas.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Como cancelar</h2>
          <p className="text-emerald-100/80 leading-relaxed">
            Para cancelar a assinatura, pare o pagamento no próprio Mercado Pago ou avise no WhatsApp. Não há multa nem fidelidade. Você pode continuar usando o sistema até o fim do mês já pago. Depois disso, o acesso fica bloqueado, mas seus dados continuam disponíveis para exportação.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Como exportar ou apagar seus dados</h2>
          <p className="text-emerald-100/80 leading-relaxed">
            A qualquer momento, dentro do sistema, vá em <strong>Configurações → Exportar .txt</strong> e baixe um arquivo legível com todos os seus dados. Para apagar tudo, use <strong>Apagar todos os dados locais</strong> (remove do aparelho) e solicite a exclusão dos dados do servidor pelo WhatsApp.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Contato</h2>
          <p className="text-emerald-100/80 leading-relaxed">
            Para dúvidas, solicitações de acesso, correção ou exclusão de dados, escreva no WhatsApp <a href="https://wa.me/5511966161611" className="text-emerald-300 hover:underline" target="_blank" rel="noopener noreferrer">11 96616-1611</a> ou abra uma issue no repositório <a href={`${SITE_URL}`} className="text-emerald-300 hover:underline" target="_blank" rel="noopener noreferrer">GitHub</a>.
          </p>
        </section>

        <footer className="pt-8 border-t border-emerald-900/40 text-xs text-emerald-100/40">
          <p>Controle de Aulas — professor apoiando professor.</p>
        </footer>
      </article>
    </main>
  );
}
