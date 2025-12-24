/**
 * @author bc0109695
 */

export type CellState = 'hidden' | 'revealed' | 'flagged';

export interface Cell {
  isMine: boolean;
  state: CellState;
  adjacentMines: number;
}

export type GameStatus = 'playing' | 'won' | 'lost';

export interface GameState {
  board: Cell[][];
  rows: number;
  cols: number;
  mines: number;
  status: GameStatus;
  flagsPlaced: number;
}

export interface Position {
  row: number;
  col: number;
}

