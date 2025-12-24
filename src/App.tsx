/**
 * @author bc0109695
 */

import { useState, useCallback } from 'react';
import { GameState, Position } from './types';
import { createNewGame, createBoard, revealCell, toggleFlag } from './gameLogic';
import { GameBoard } from './components/GameBoard';
import { GameInfo } from './components/GameInfo';
import { useWebSocket } from './hooks/useWebSocket';
import './App.css';

const DEFAULT_ROWS = 9;
const DEFAULT_COLS = 9;
const DEFAULT_MINES = 10;

function App() {
  const [gameState, setGameState] = useState<GameState>(() => createNewGame(DEFAULT_ROWS, DEFAULT_COLS, DEFAULT_MINES));
  const [isFirstClick, setIsFirstClick] = useState(true);
  const [isAIMode, setIsAIMode] = useState(false);

  // WebSocket接続（AIモード用）
  const { isConnected, lastAction } = useWebSocket((newGameState) => {
    setGameState(newGameState);
    setIsFirstClick(false);
    setIsAIMode(true);
  });

  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameState.status !== 'playing') return;
    
    if (isFirstClick) {
      // 最初のクリック時は地雷を配置してから開く
      const board = createBoard(DEFAULT_ROWS, DEFAULT_COLS, DEFAULT_MINES, { row, col });
      const newGameState: GameState = {
        board,
        rows: DEFAULT_ROWS,
        cols: DEFAULT_COLS,
        mines: DEFAULT_MINES,
        status: 'playing',
        flagsPlaced: 0
      };
      const updatedState = revealCell(newGameState, row, col);
      setGameState(updatedState);
      setIsFirstClick(false);
    } else {
      setGameState(prev => revealCell(prev, row, col));
    }
  }, [gameState.status, isFirstClick]);

  const handleCellRightClick = useCallback((row: number, col: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (gameState.status !== 'playing') return;
    setGameState(prev => toggleFlag(prev, row, col));
  }, [gameState.status]);

  const handleNewGame = useCallback(() => {
    setGameState(createNewGame(DEFAULT_ROWS, DEFAULT_COLS, DEFAULT_MINES));
    setIsFirstClick(true);
  }, []);

  return (
    <div className="app">
      <div className="game-container">
        <h1>マインスイーパー</h1>
        <div className="mode-indicator">
          {isAIMode ? (
            <div className="ai-mode">
              <span className="mode-badge ai">🤖 AIモード</span>
              {isConnected ? (
                <span className="connection-status connected">● 接続中</span>
              ) : (
                <span className="connection-status disconnected">● 切断</span>
              )}
            </div>
          ) : (
            <span className="mode-badge human">👤 人間モード</span>
          )}
        </div>
        <GameInfo 
          mines={gameState.mines - gameState.flagsPlaced}
          status={gameState.status}
          onNewGame={handleNewGame}
        />
        <GameBoard
          gameState={gameState}
          onCellClick={handleCellClick}
          onCellRightClick={handleCellRightClick}
        />
        {lastAction && (
          <div className="last-action">
            最後のアクション: {lastAction.action}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

