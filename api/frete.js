// api/frete.js
// Calcula o frete real (Correios/transportadoras) via Melhor Envio.
// O token fica só aqui no servidor (variável de ambiente), nunca no site.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  const TOKEN = process.env.MELHORENVIO_TOKEN;
  const CEP_ORIGEM = process.env.CEP_ORIGEM;
  const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'contato@example.com';
  const SANDBOX = process.env.MELHORENVIO_SANDBOX === 'true';

  if (!TOKEN || !CEP_ORIGEM) {
    res.status(500).json({
      error: 'Backend de frete não configurado. Faltam MELHORENVIO_TOKEN e/ou CEP_ORIGEM nas variáveis de ambiente.'
    });
    return;
  }

  try {
    const { cepDestino, itens } = req.body;

    if (!cepDestino || !/^\d{8}$/.test(cepDestino) || !Array.isArray(itens) || itens.length === 0) {
      res.status(400).json({ error: 'Dados inválidos (CEP ou itens do carrinho).' });
      return;
    }

    const viaCepRes = await fetch(`https://viacep.com.br/ws/${cepDestino}/json/`);
    const endereco = await viaCepRes.json();
    if (endereco.erro) {
      res.status(404).json({ error: 'CEP não encontrado.' });
      return;
    }

    const products = itens.map((item, idx) => ({
      id: `item-${idx}`,
      width: 30,
      height: 3,
      length: 24,
      weight: 0.3,
      insurance_value: Number(item.price) || 0,
      quantity: Number(item.qty) || 1
    }));

    const baseUrl = SANDBOX
      ? 'https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate'
      : 'https://www.melhorenvio.com.br/api/v2/me/shipment/calculate';

    const meRes = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
        'User-Agent': `Loja de Camisetas (${CONTACT_EMAIL})`
      },
      body: JSON.stringify({
        from: { postal_code: CEP_ORIGEM },
        to: { postal_code: cepDestino },
        products,
        options: { receipt: false, own_hand: false }
      })
    });

    const data = await meRes.json();

    if (!meRes.ok) {
      res.status(meRes.status).json({ error: data.message || 'Erro ao consultar a Melhor Envio.' });
      return;
    }

    const opcoes = (Array.isArray(data) ? data : [])
      .filter((o) => !o.error)
      .map((o) => ({
        transportadora: o.company?.name || '',
        servico: o.name,
        preco: Number(o.custom_price ?? o.price),
        prazo: `${o.custom_delivery_time ?? o.delivery_time} dias úteis`
      }));

    res.status(200).json({
      endereco: { cidade: endereco.localidade, uf: endereco.uf },
      opcoes
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno ao calcular o frete.' });
  }
}
