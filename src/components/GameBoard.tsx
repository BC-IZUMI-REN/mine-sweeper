/**
 * @author bc0109695
 */

import { GameState } from '../types';
import { Cell } from './Cell';
import './GameBoard.css';

interface GameBoardProps {
  gameState: GameState;
  onCellClick: (row: number, col: number) => void;
  onCellRightClick: (row: number, col: number, e: React.MouseEvent) => void;
}

export function GameBoard({ gameState, onCellClick, onCellRightClick }: GameBoardProps) {
  const { board, rows, cols } = gameState;

  return (
    <div className="game-board" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <Cell
            key={`${rowIndex}-${colIndex}`}
            cell={cell}
            onClick={() => onCellClick(rowIndex, colIndex)}
            onRightClick={(e) => onCellRightClick(rowIndex, colIndex, e)}
          />
        ))
      )}
    </div>
  );
}

