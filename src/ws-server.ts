/**
 * @author bc0109695
 * WebSocketサーバー - MCPサーバーとUIを連携させる
 */

import { WebSocketServer, WebSocket } from 'ws';
import { GameState } from './types.js';

const PORT = 8080;

// 接続中のクライアント
const clients = new Set<WebSocket>();

// 現在のゲーム状態
let currentGameState: GameState | null = null;

// WebSocketサーバーを起動
const wss = new WebSocketServer({ 
  port: PORT,
  perMessageDeflate: false,
  clientTracking: true
});

wss.on('connection', (ws: WebSocket, req) => {
  const clientType = req.url?.includes('mcp') ? 'MCP' : 'UI';
  console.log(`[${clientType}] クライアントが接続しました`);
  clients.add(ws);

  // 既存のゲーム状態があれば送信
  if (currentGameState) {
    try {
      ws.send(JSON.stringify({
        type: 'game_state',
        data: currentGameState
      }));
    } catch (error) {
      console.error('初期状態の送信エラー:', error);
    }
  }

  // Ping/Pongでコネクションを維持
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }, 30000);

  ws.on('pong', () => {
    // 接続が生きていることを確認
  });

  ws.on('close', () => {
    console.log(`[${clientType}] クライアントが切断しました`);
    clearInterval(pingInterval);
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error(`[${clientType}] WebSocketエラー:`, error.message);
    clearInterval(pingInterval);
    clients.delete(ws);
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`[${clientType}] メッセージ受信:`, message.type);
      
      // MCPサーバーからのメッセージを全クライアントにブロードキャスト
      if (message.type === 'game_state' || message.type === 'action') {
        broadcastToOthers(ws, message);
      }
    } catch (error) {
      console.error('メッセージ解析エラー:', error);
    }
  });
});

// 他のクライアントにブロードキャスト
function broadcastToOthers(sender: WebSocket, message: any) {
  clients.forEach((client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(message));
      } catch (error) {
        console.error('ブロードキャストエラー:', error);
      }
    }
  });
}

// ゲーム状態を更新してブロードキャスト
export function broadcastGameState(gameState: GameState) {
  currentGameState = gameState;
  const message = JSON.stringify({
    type: 'game_state',
    data: gameState
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// アクションをブロードキャスト
export function broadcastAction(action: { type: string; data: any }) {
  const message = JSON.stringify(action);

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

console.log(`WebSocketサーバーが起動しました (ポート: ${PORT})`);
console.log('UIからの接続を待っています...');

// サーバーを起動し続ける
process.on('SIGINT', () => {
  console.log('WebSocketサーバーを終了します...');
  wss.close();
  process.exit(0);
});

