const WebSocket = require('ws');
const clients = new Set();

function initWebSocket(server) {
    const wss = new WebSocket.Server({ server });
    wss.on('connection', (ws) => {
        clients.add(ws);
        ws.on('error', (error) => {
            console.warn('WebSocket client error:', error.message);
        });
        ws.on('close', () => {
            clients.delete(ws);
        });
    });
    return wss;
}

function broadcastUpdate(data) {
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

module.exports = {
    initWebSocket,
    broadcastUpdate
};
