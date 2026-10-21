const { WebcastPushConnection } = require('tiktok-live-connector');
const { WebSocketServer } = require('ws');

const port = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: port, host: '0.0.0.0' });
console.log('✅ SERVER JALAN DI PORT ' + port);

wss.on('connection', (socket) => {
  let conn = null;
  socket.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type !== 'join') return;
      if (conn) { try { conn.disconnect(); } catch (e) {} }
      
      console.log('Mencoba konek ke: @' + msg.username);
      
      conn = new WebcastPushConnection(msg.username, {
        sessionId: process.env.SESSION_ID
      });
      
      try { 
        await conn.connect(); 
        console.log('✅ TIKTOK LIVE NYAMBUNG:', msg.username); 
        socket.send(JSON.stringify({ type: 'connected' })); 
      } catch (e) { 
        console.log('❌ Gagal:', e.message); 
        socket.send(JSON.stringify({ type: 'error', message: e.message })); 
        return; 
      }
      
      conn.on('chat', (data) => {
        const text = data.comment.trim().toUpperCase();
        if (text === 'B' || text === 'S' || text === '1') {
            socket.send(JSON.stringify({ type: 'chat', user: data.uniqueId, text: text }));
        }
      });
      
      conn.on('gift', (data) => {
        if (data.giftType === 1 && !data.repeatEnd) return; 
        socket.send(JSON.stringify({ type: 'gift', giftName: data.giftName, user: data.uniqueId }));
      });
    } catch (err) { console.log(err); }
  });
  socket.on('close', () => { if (conn) { try { conn.disconnect(); } catch (e) {} } });
});
