// api/pagamento.js
// Cria uma cobrança (Checkout Pro) no Mercado Pago e devolve o link de pagamento.
// ATENÇÃO: token fixo aqui no código porque o repositório é público —
// qualquer pessoa que abrir este arquivo no GitHub pode ver e usar esse token.
// O dinheiro cai direto na conta Mercado Pago de quem gerou esse token.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  const MP_TOKEN = "APP_USR-6442749672429898-080616-3ce442df640adbc7ac0aaebd488f995b-623537374";
  const SITE_URL = "https://camisetas-de-time.vercel.app";

  try {
    const { itens, frete } = req.body;

    if (!Array.isArray(itens) || itens.length === 0) {
      res.status(400).json({ error: 'Carrinho vazio.' });
      return;
    }

    const items = itens.map((item) => ({
      title: `${item.nome} (Tam ${item.size})`.slice(0, 256),
      quantity: Number(item.qty) || 1,
      unit_price: Number(item.price) || 0,
      currency_id: 'BRL'
    }));

    if (frete && Number(frete.valor) > 0) {
      items.push({
        title: `Frete — ${frete.servico || 'Entrega'}`.slice(0, 256),
        quantity: 1,
        unit_price: Number(frete.valor),
        currency_id: 'BRL'
      });
    }

    const preference = {
      items,
      back_urls: {
        success: `${SITE_URL}?pagamento=sucesso`,
        failure: `${SITE_URL}?pagamento=falha`,
        pending: `${SITE_URL}?pagamento=pendente`
      },
      auto_return: 'approved'
    };

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_TOKEN}`
      },
      body: JSON.stringify(preference)
    });

    const data = await mpRes.json();

    if (!mpRes.ok) {
      res.status(mpRes.status).json({ error: data.message || 'Erro ao criar cobrança no Mercado Pago.' });
      return;
    }

    res.status(200).json({ init_point: data.init_point || data.sandbox_init_point });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno ao gerar o pagamento.' });
  }
}
