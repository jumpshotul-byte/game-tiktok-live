const express = require('express');
const { WebcastPushConnection } = require('tiktok-live-connector');
const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
});

let currentConnection = null;
let liveData = { chat: [], gifts: [] };

app.post('/connect', async (req, res) => {
  const { username } = req.body;
  if (currentConnection) { try { currentConnection.disconnect(); } catch(e){} }
  
  currentConnection = new WebcastPushConnection(username, {
    sessionId: process.env.SESSION_ID
  });
  
  try {
    await currentConnection.connect();
    currentConnection.on('chat', (data) => {
      liveData.chat.push({ user: data.uniqueId, text: data.comment });
      if (liveData.chat.length > 50) liveData.chat.shift();
    });
    currentConnection.on('gift', (data) => {
      liveData.gifts.push({ user: data.uniqueId, giftName: data.giftName });
      if (liveData.gifts.length > 50) liveData.gifts.shift();
    });
    res.json({ success: true, message: 'Terhubung!' });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

app.get('/events', (req, res) => {
  res.json({ chat: liveData.chat, gifts: liveData.gifts });
  liveData.chat = [];
  liveData.gifts = [];
});

app.get('/', (req, res) => res.send('Server TikTok Jalan!'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('✅ Jalan di port ' + port));
