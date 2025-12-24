/**
 * @author bc0109695
 */

import { GameStatus } from '../types';
import './GameInfo.css';

interface GameInfoProps {
  mines: number;
  status: GameStatus;
  onNewGame: () => void;
}

export function GameInfo({ mines, status, onNewGame }: GameInfoProps) {
  const getStatusMessage = () => {
    switch (status) {
      case 'won':
        return '🎉 勝利！';
      case 'lost':
        return '💥 ゲームオーバー';
      default:
        return 'プレイ中';
    }
  };

  return (
    <div className="game-info">
      <div className="info-item">
        <span className="label">残り地雷:</span>
        <span className="value">{mines}</span>
      </div>
      <div className="info-item">
        <span className="label">状態:</span>
        <span className={`value status-${status}`}>{getStatusMessage()}</span>
      </div>
      <button className="new-game-button" onClick={onNewGame}>
        新しいゲーム
      </button>
    </div>
  );
}

