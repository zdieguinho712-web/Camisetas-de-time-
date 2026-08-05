# Loja de Camisetas — como publicar

Este projeto tem 3 partes:

- `index.html` — o site (catálogo, carrinho, frete, Pix e cartão)
- `api/frete.js` — backend que consulta o frete real na Melhor Envio
- `api/pagamento.js` — backend que gera o link de pagamento por cartão (Mercado Pago)

O Pix já funciona sozinho, sem backend (o QR Code é gerado no navegador). Frete real e cartão
precisam do backend publicado e configurado — sem isso, o frete cai automaticamente numa tabela
estimada, e o botão de cartão avisa que ainda não está disponível.

## Passo 1 — Publicar na Vercel (grátis)

1. Instale o [Node.js](https://nodejs.org) no seu computador, se ainda não tiver.
2. Abra o terminal (Prompt de Comando / Terminal) **dentro desta pasta**.
3. Rode:
   ```
   npx vercel
   ```
4. Vai abrir o navegador pra você criar uma conta grátis na Vercel (ou fazer login). Depois é só
   aceitar as perguntas padrão apertando Enter.
5. Ao final, a Vercel te dá uma URL tipo `https://loja-camisetas-xxxx.vercel.app` — o site já está
   no ar (mas o frete real e o cartão só funcionam depois do Passo 2).

## Passo 2 — Configurar as variáveis de ambiente

No site [vercel.com](https://vercel.com), abra o projeto → **Settings** → **Environment Variables**
e adicione uma por uma:

| Nome | O que colocar |
|---|---|
| `MELHORENVIO_TOKEN` | Token gerado em melhorenvio.com.br/painel/gerenciar/tokens (marque a permissão "Cotação de Fretes") |
| `CEP_ORIGEM` | O CEP de onde as camisetas são enviadas (só números, ex: `01310000`) |
| `CONTACT_EMAIL` | Um e-mail de contato (a Melhor Envio exige isso na integração) |
| `MP_ACCESS_TOKEN` | Access Token de **produção** do Mercado Pago (veja Passo 3) |
| `SITE_URL` | A URL do seu site na Vercel, ex: `https://loja-camisetas-xxxx.vercel.app` |

Depois de adicionar todas, rode de novo `npx vercel --prod` (ou clique em **Redeploy** no painel)
pra elas passarem a valer.

## Passo 3 — Pegar o Access Token do Mercado Pago

1. Acesse [mercadopago.com.br/developers/panel](https://www.mercadopago.com.br/developers/panel)
   com a conta `Victorhugo05315@gmail.com`.
2. Crie uma aplicação (qualquer nome, ex: "Loja de Camisetas").
3. Vá em **Credenciais de produção** e copie o **Access Token**.
4. Cole esse valor na variável `MP_ACCESS_TOKEN` da Vercel (Passo 2) — **nunca** em e-mail, chat
   ou print de tela.

## ⚠️ Segurança

- Os tokens (`MELHORENVIO_TOKEN` e `MP_ACCESS_TOKEN`) são as chaves de acesso às contas de verdade.
  Quem tiver esses valores pode gastar saldo ou mexer nos pedidos.
- Cole eles **só** no campo de variável de ambiente da Vercel — nunca dentro do `index.html`, nunca
  em conversas, e-mails ou capturas de tela.

## Ajustando o frete

As dimensões usadas pra calcular o frete (30×24×3 cm, 0,3 kg por camiseta) estão no arquivo
`api/frete.js`. Se a embalagem real for diferente, é só editar esses números.
