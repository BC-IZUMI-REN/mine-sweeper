/**
 * @author bc0109695
 * ゲーム状態を管理し、WebSocketでブロードキャストする
 */

import { GameState } from './types.js';
import { WebSocket } from 'ws';

// WebSocketクライアント（MCPサーバーから接続）
let wsClient: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;

// WebSocketサーバーに接続
export function connectToWebSocketServer() {
  try {
    wsClient = new WebSocket('ws://localhost:8080/mcp');

    wsClient.on('open', () => {
      console.error('[MCP] WebSocketサーバーに接続しました');
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    });

    wsClient.on('close', () => {
      console.error('[MCP] WebSocketサーバーから切断されました。再接続を試みます...');
      wsClient = null;
      // 5秒後に再接続
      reconnectTimer = setTimeout(() => {
        connectToWebSocketServer();
      }, 5000);
    });

    wsClient.on('error', (error) => {
      console.error('[MCP] WebSocketエラー:', error.message);
      // エラー時は接続を閉じる
      if (wsClient) {
        wsClient.close();
      }
    });

    wsClient.on('ping', () => {
      if (wsClient) {
        wsClient.pong();
      }
    });
  } catch (error) {
    console.error('[MCP] WebSocket接続エラー:', error);
    // 5秒後に再接続
    reconnectTimer = setTimeout(() => {
      connectToWebSocketServer();
    }, 5000);
  }
}

// ゲーム状態をブロードキャスト
export function broadcastGameState(gameState: GameState) {
  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    wsClient.send(JSON.stringify({
      type: 'game_state',
      data: gameState
    }));
  }
}

// アクションをブロードキャスト
export function broadcastAction(action: string, data: any) {
  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    wsClient.send(JSON.stringify({
      type: 'action',
      action,
      data
    }));
  }
}

