const axios = require('axios');
const SteamID = require('steamid');

module.exports = async (req, res) => {
  const { tradeLink } = req.body;

  if (!tradeLink) {
    console.error('Трейд-ссылка не предоставлена');
    return res.status(400).json({ error: 'Трейд-ссылка не предоставлена' });
  }

  const getSteamId64FromTradeLink = (tradeLink) => {
    try {
      const url = new URL(tradeLink);
      const params = new URLSearchParams(url.search);
      const partnerId = params.get('partner');
      if (!partnerId) {
        throw new Error('Не удалось извлечь partnerId из трейд-ссылки');
      }

      const steamId = new SteamID(`STEAM_0:${partnerId % 2}:${Math.floor(partnerId / 2)}`);
      return steamId.getSteamID64();
    } catch (error) {
      console.error('Ошибка при обработке трейд-ссылки:', error.message);
      return null;
    }
  };

  const steamId64 = getSteamId64FromTradeLink(tradeLink);
  if (!steamId64) {
    console.error('Не удалось извлечь SteamID64 из трейд-ссылки');
    return res.status(400).json({ error: 'Неверная трейд-ссылка' });
  }

  try {
    const apiUrl = `https://steamcommunity.com/inventory/${steamId64}/730/2?l=russian&count=5000`;
    const response = await axios.get(apiUrl);
    
    if (!response.data || !response.data.assets || !response.data.descriptions) {
      console.error('Инвентарь пуст или данные некорректны');
      return res.status(404).json({ error: 'Инвентарь пуст или данные некорректны' });
    }

    res.json(response.data);
  } catch (error) {
    console.error('Ошибка при запросе к Steam API:', error.message);
    res.status(500).json({ error: 'Ошибка при получении инвентаря' });
  }
};
