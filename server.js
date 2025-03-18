const express = require('express');
const axios = require('axios');
const PORT = 3000;
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config()


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Папка для статических файлов (HTML, CSS, JS)
app.use(express.json());

// Ключ Steam API
const STEAM_API_KEY = process.env.STEAM_API_KEY;




// Функция для получения SteamID из трейд-ссылки
const SteamID = require('steamid');

function getSteamId64FromTradeLink(tradeLink) {
  try {
    const url = new URL(tradeLink);
    const params = new URLSearchParams(url.search);
    const partnerId = params.get('partner');
    if (!partnerId) {
      throw new Error('Не удалось извлечь partnerId из трейд-ссылки');
    }

    // Конвертация partnerId в SteamID64
    const steamId = new SteamID(`STEAM_0:${partnerId % 2}:${Math.floor(partnerId / 2)}`);
    return steamId.getSteamID64();
  } catch (error) {
    console.error('Ошибка при обработке трейд-ссылки:', error.message);
    return null;
  }
}



// Получение инвентаря
app.post('/api/get-inventory', async (req, res) => {
    const { tradeLink } = req.body;
  
    // Проверка наличия трейд-ссылки
    if (!tradeLink) {
      console.error('Трейд-ссылка не предоставлена');
      return res.status(400).json({ error: 'Трейд-ссылка не предоставлена' });
    }
  
    
    // Извлечение SteamID64 из трейд-ссылки
    const steamId64 = getSteamId64FromTradeLink(tradeLink);
    if (!steamId64) {
      console.error('Не удалось извлечь SteamID64 из трейд-ссылки');
      return res.status(400).json({ error: 'Неверная трейд-ссылка' });
    }
  
    console.log('SteamID64:', steamId64);
  
    try {
      // Запрос к Steam API
      const apiUrl = `https://steamcommunity.com/inventory/${steamId64}/730/2?l=russian&count=5000`;
      console.log('Запрос к Steam API:', apiUrl);
  
      const response = await axios.get(apiUrl);
      console.log('Ответ от Steam API:', response.data);
  
      // Проверка наличия данных
      if (!response.data || !response.data.assets || !response.data.descriptions) {
        console.error('Инвентарь пуст или данные некорректны');
        return res.status(404).json({ error: 'Инвентарь пуст или данные некорректны' });
      }
  
      // Отправка данных на фронтенд
      res.json(response.data);
    } catch (error) {
      console.error('Ошибка при запросе к Steam API:', error.message);
  
      // Обработка ошибок Steam API
      if (error.response && error.response.data) {
        return res.status(500).json({ error: error.response.data.error || 'Ошибка Steam API' });
      }
  
      res.status(500).json({ error: 'Ошибка при получении инвентаря' });
    }
  });

  app.get('/api/get-price', async (req, res) => {
    const { market_hash_name } = req.query;
  
    // Проверка наличия названия предмета
    if (!market_hash_name) {
      return res.status(400).json({ error: "Название предмета не указано" });
    }
  
    try {
      // Запрос к Steam API
      const apiUrl = `https://steamcommunity.com/market/priceoverview/?currency=1&appid=730&market_hash_name=${encodeURIComponent(market_hash_name)}`;
      console.log('Запрос к Steam API:', apiUrl);
  
      const response = await fetch(apiUrl);
  
      // Проверка статуса ответа
      if (!response.ok) {
        throw new Error(`Ошибка Steam API: ${response.statusText}`);
      }
  
      const data = await response.json();
  
      // Проверка успешности ответа
      if (!data.success) {
        throw new Error("Ошибка получения цены: " + (data.message || "Неизвестная ошибка"));
      }
  
      console.log('Цена предмета:', data.lowest_price);
      res.json(data);
    } catch (error) {
      console.error('Ошибка при запросе к Steam API:', error.message);
      res.status(500).json({ error: error.message });
    }
  });
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});