# 📋 Como integrar Mercado Pago (passo a passo)

Para o sistema liberar o painel só depois do pagamento, você precisa fazer o seguinte:

---

## 🎯 Visão geral do fluxo

```
Usuário clica em "Assinar R$ 3,49/mês"
       ↓
App redireciona pro Mercado Pago (com email do usuário)
       ↓
Usuário paga no cartão de crédito (recorrente)
       ↓
Mercado Pago chama um webhook seu → libera acesso
       ↓
Usuário faz login normalmente (painel liberado)
```

---

## 📌 O que você precisa fazer (5 passos)

### Passo 1: Criar conta Mercado Pago Vendedor
🔗 https://www.mercadopago.com.br/hub/registration/checkout

- Use seu CPF/CNPJ
- Faça a verificação de identidade (grátis, leva 1 dia útil)

### Passo 2: Criar uma Assinatura Automática
🔗 https://www.mercadopago.com.br/developers/panel/app

1. Acesse "Suas integrações" → "Criar aplicação"
2. Nome: `Controle de Aulas`
3. Tipo: `Pagamentos online`
4. Em **"Assinaturas"**, clique em "Criar plano"
5. Configure:
   - **Título:** Plano Café - Controle de Aulas
   - **Valor:** R$ 3,49
   - **Frequência:** Mensal
   - **Descrição:** Acesso ao Controle de Aulas - 1 café por mês
6. Salve o **`preapproval_plan_id`** que aparecer (vai começar com `2c938084...`)

### Passo 3: Criar credenciais de API
No mesmo painel:

1. Vá em "Credenciais"
2. Anote o **`ACCESS_TOKEN`** (começa com `APP_USR-...`)
3. Anote o **`PUBLIC_KEY`** (começa com `APP_USR-...`)

⚠️ **Mantenha o ACCESS_TOKEN em segredo!** Não coloque no código do navegador. Use o Cloudflare Worker que já temos.

### Passo 4: Configurar webhook
1. No painel do Mercado Pago → "Webhooks" → "Criar"
2. URL: `https://controle-aulas-sync.controler-2a4.workers.dev/webhook`
3. Eventos: `subscription_authorized_payment`, `subscription_cancelled`
4. Salve

### Passo 5: Me passar 3 dados
Depois de fazer os passos acima, me passe:

1. ✅ `preapproval_plan_id` (do plano de assinatura)
2. ✅ `ACCESS_TOKEN` (vai ficar no Worker, seguro)
3. ✅ `PUBLIC_KEY` (vai no código do navegador, sem problema)

Aí eu:
- Atualizo o Worker pra lidar com webhooks do Mercado Pago
- Crio a tela de checkout
- Adiciono o controle de "usuário pagou ou não" (só libera dashboard se a assinatura estiver ativa)
- Adiciono botão "Assinar" funcional na landing

---

## 💡 Como funciona o controle de acesso

### Banco de dados (no GitHub data/backup.txt)
Cada professor vai ter um campo novo:
```json
{
  "id": "...",
  "username": "joao",
  "assinatura": {
    "status": "active" | "pending" | "cancelled",
    "plano_id": "2c938084...",
    "preapproval_id": "...",
    "proxima_cobranca": "2026-11-01"
  }
}
```

### Fluxo no app
1. Usuário cadastra → `assinatura.status = "pending"`
2. Clica em "Assinar R$ 3,49/mês" → redireciona pro Mercado Pago
3. Mercado Pago confirma → webhook notifica o Worker → atualiza `status = "active"`
4. App verifica no login: se `status != "active"`, mostra tela "Assine pra continuar"
5. Se cancelar → webhook notifica → `status = "cancelled"` → bloqueia acesso

---

## 💰 Custos do Mercado Pago

- **Taxa por transação:** ~4,99% + R$ 0,39 por venda
- Em R$ 3,49 → taxa de R$ 0,56
- Você recebe líquido: **R$ 2,93 por usuário/mês**
- Sem mensalidade fixa, sem setup

---

## 🚀 Pronto pra fazer?

Quando você tiver os 3 dados (plan_id, access_token, public_key), me passa que eu implemento tudo de uma vez:

- ✅ Worker atualizado com webhook
- ✅ Tela de checkout (redireciona pro Mercado Pago)
- ✅ Controle de acesso (bloqueia se não pagou)
- ✅ Tela "Assinatura pendente/atual" no perfil
- ✅ Botão "Assinar" funcional na landing
- ✅ Status da assinatura visível no dashboard

**Tempo estimado pra eu implementar:** 30 minutos após você me passar os dados.

---

## ❓ Dúvidas?

Me chama no WhatsApp: +55 11 96616-1611
