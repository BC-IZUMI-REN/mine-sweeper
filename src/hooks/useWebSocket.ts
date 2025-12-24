/**
 * @author bc0109695
 * WebSocket接続用のカスタムフック
 */

import { useEffect, useRef, useState } from 'react';
import { GameState } from '../types';

interface WebSocketMessage {
  type: 'game_state' | 'action';
  data?: GameState;
  action?: string;
}

export function useWebSocket(onGameStateUpdate: (gameState: GameState) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastAction, setLastAction] = useState<{ action: string; data: any } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = () => {
    // 既存の接続があれば閉じる
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      const ws = new WebSocket('ws://localhost:8080/ui');

      ws.onopen = () => {
        console.log('[UI] WebSocketサーバーに接続しました');
        setIsConnected(true);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          console.log('[UI] WebSocketメッセージ受信:', event.data);
          const message: WebSocketMessage = JSON.parse(event.data);
          
          if (message.type === 'game_state' && message.data) {
            console.log('[UI] ゲーム状態を更新:', message.data);
            onGameStateUpdate(message.data);
          } else if (message.type === 'action') {
            console.log('[UI] アクション受信:', message.action);
            setLastAction({ action: message.action || '', data: message });
          }
        } catch (error) {
          console.error('[UI] メッセージの解析エラー:', error);
        }
      };

      ws.onclose = () => {
        console.log('[UI] WebSocketサーバーから切断されました。再接続を試みます...');
        setIsConnected(false);
        wsRef.current = null;
        
        // 5秒後に再接続
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connect();
          }, 5000);
        }
      };

      ws.onerror = (error) => {
        console.error('[UI] WebSocketエラー:', error);
        // エラー時は接続を閉じる
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[UI] WebSocket接続エラー:', error);
      setIsConnected(false);
      // 5秒後に再接続
      if (!reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = window.setTimeout(() => {
          reconnectTimeoutRef.current = null;
          connect();
        }, 5000);
      }
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return { isConnected, lastAction };
}

