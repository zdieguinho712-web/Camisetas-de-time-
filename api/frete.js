// api/frete.js
// Calcula o frete real (Correios/transportadoras) via Melhor Envio.
// ATENÇÃO: token fixo aqui no código porque o repositório é público —
// qualquer pessoa que abrir este arquivo no GitHub pode ver e usar esse token.
// Se decidir deixar o repositório privado depois, é mais seguro mover
// esses valores de volta pra variáveis de ambiente.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  const TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiYTg0MjI0NWE4MGYyYzliYjk0ODc2M2Y0YWMyNjUwMjFjMmI4OTNmNDc1MWJiYWI1OWU1ZTVkZjEwOTE4Nzk0NTIzMjEwZmQzNTc0MWY0NDMiLCJpYXQiOjE3ODYwNDUwOTkuMTc2NzM5LCJuYmYiOjE3ODYwNDUwOTkuMTc2NzQxLCJleHAiOjE4MTc1ODEwOTkuMTYzNDEsInN1YiI6ImEyNmVkZDcxLTZjMmItNGY0Ny04MjBhLTA3M2FlMjY4NzNkMyIsInNjb3BlcyI6WyJzaGlwcGluZy1jYWxjdWxhdGUiXX0.hulp8rpphZByj9DDE1jWJChApRAyR6_cp8gh_xx8VgVQDOxMl3DCmmoBbfZ1UoY9Uzf4_PmQNik9TevU5zcYAvBRomSxL6yq79jR2-MEneNiuwUHzWCdVvE4EVlkmRNRkILGBTCDz8cSMZxV3SgPmnT5jBqAW-qkw50fVrtIxisha5nLE8UHSS2BZCxGr3Y6vw4C-CFjcmOKfpeUsH5JZeOaBSffUPiO5nTh1GOgFnEx6a1VqK-SIMTDMGSr_ONtiGpa2Ii8fbxf7NDEJXSppPesn90Jrkt5LIuNPIABU1bLK1sg3BNP6OZhHCqSJ8XTs-ADPSytnASJE1L73KJ20bn-Z25Li2fKJBrH9hsAz8Z22uUan7JR96CBs7ox3I-tchAqF7vQKBQ9tKQdw5TBeiYSxhFbPxDNKl8aDnta8npFeUdhhsUDgYEoPf92HvsH2DNCTuW0YXaPhk7DwyoWPDMn--d8rca3_aFo8p1f6Yc3wXiAZfOobE7m-F0TORuCujs2gMxjL8ktnx5xVrIrCoprLMqV66ibojrfh0A48rTRuHOrIfLfPNF6UQaGTHFdVy0pglb9fwKr0GwyX3kBk_UnaxM_ZX4RKkGIReMamik7R8ZweATOGhgkzNCd8qApEQ1PRMZaDLx4i5JBCptFOHUo3jmEIOMvOKSRMm3cyWM";
  const CEP_ORIGEM = "13054971";
  const CONTACT_EMAIL = "Victorhugo05315@gmail.com";
  const SANDBOX = false;

  try {
    const { cepDestino, itens } = req.body;

    if (!cepDestino || !/^\d{8}$/.test(cepDestino) || !Array.isArray(itens) || itens.length === 0) {
      res.status(400).json({ error: 'Dados inválidos (CEP ou itens do carrinho).' });
      return;
    }

    // Endereço de destino (pra mostrar cidade/UF pro cliente)
    const viaCepRes = await fetch(`https://viacep.com.br/ws/${cepDestino}/json/`);
    const endereco = await viaCepRes.json();
    if (endereco.erro) {
      res.status(404).json({ error: 'CEP não encontrado.' });
      return;
    }

    // Dimensões padrão de uma camiseta dobrada (ajuste se suas embalagens forem diferentes)
    const products = itens.map((item, idx) => ({
      id: `item-${idx}`,
      width: 30,   // cm
      height: 3,   // cm
      length: 24,  // cm
      weight: 0.3, // kg
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
