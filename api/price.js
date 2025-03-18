const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { market_hash_name } = req.query;

  if (!market_hash_name) {
    return res.status(400).json({ error: "Название предмета не указано" });
  }

  try {
    const apiUrl = `https://steamcommunity.com/market/priceoverview/?currency=1&appid=730&market_hash_name=${encodeURIComponent(market_hash_name)}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Ошибка Steam API: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error("Ошибка получения цены: " + (data.message || "Неизвестная ошибка"));
    }

    res.json(data);
  } catch (error) {
    console.error('Ошибка при запросе к Steam API:', error.message);
    res.status(500).json({ error: error.message });
  }
};
