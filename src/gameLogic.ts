/**
 * @author bc0109695
 */

import { Cell, CellState, GameState, GameStatus, Position } from './types';

/**
 * 新しいゲームボードを生成
 */
export function createBoard(rows: number, cols: number, mines: number, firstClick?: Position): Cell[][] {
  const board: Cell[][] = [];
  
  // 空のボードを作成
  for (let i = 0; i < rows; i++) {
    board[i] = [];
    for (let j = 0; j < cols; j++) {
      board[i][j] = {
        isMine: false,
        state: 'hidden',
        adjacentMines: 0
      };
    }
  }
  
  // 地雷を配置（最初のクリック位置とその周囲には配置しない）
  const safeCells = new Set<string>();
  if (firstClick) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = firstClick.row + dr;
        const c = firstClick.col + dc;
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          safeCells.add(`${r},${c}`);
        }
      }
    }
  }
  
  let minesPlaced = 0;
  while (minesPlaced < mines) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    const key = `${row},${col}`;
    
    if (!board[row][col].isMine && !safeCells.has(key)) {
      board[row][col].isMine = true;
      minesPlaced++;
    }
  }
  
  // 各セルの周囲の地雷数を計算
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (!board[i][j].isMine) {
        board[i][j].adjacentMines = countAdjacentMines(board, i, j, rows, cols);
      }
    }
  }
  
  return board;
}

/**
 * 周囲の地雷数をカウント
 */
function countAdjacentMines(board: Cell[][], row: number, col: number, rows: number, cols: number): number {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols && board[r][c].isMine) {
        count++;
      }
    }
  }
  return count;
}

/**
 * セルを開く（再帰的に空のセルを開く）
 */
export function revealCell(gameState: GameState, row: number, col: number): GameState {
  const { board, rows, cols } = gameState;
  
  if (board[row][col].state !== 'hidden') {
    return gameState;
  }
  
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  newBoard[row][col].state = 'revealed';
  
  // 地雷を踏んだ場合
  if (board[row][col].isMine) {
    // すべての地雷を表示
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (newBoard[i][j].isMine) {
          newBoard[i][j].state = 'revealed';
        }
      }
    }
    return {
      ...gameState,
      board: newBoard,
      status: 'lost'
    };
  }
  
  // 空のセルの場合、周囲のセルも自動的に開く
  if (board[row][col].adjacentMines === 0) {
    revealAdjacentCells(newBoard, row, col, rows, cols);
  }
  
  // 勝利条件をチェック
  const revealedCount = newBoard.flat().filter(cell => cell.state === 'revealed' && !cell.isMine).length;
  const totalSafeCells = rows * cols - gameState.mines;
  const status: GameStatus = revealedCount === totalSafeCells ? 'won' : 'playing';
  
  return {
    ...gameState,
    board: newBoard,
    status
  };
}

/**
 * 周囲のセルを再帰的に開く
 */
function revealAdjacentCells(board: Cell[][], row: number, col: number, rows: number, cols: number): void {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      
      if (r >= 0 && r < rows && c >= 0 && c < cols && board[r][c].state === 'hidden') {
        board[r][c].state = 'revealed';
        
        // 空のセルの場合、さらに周囲を開く
        if (board[r][c].adjacentMines === 0 && !board[r][c].isMine) {
          revealAdjacentCells(board, r, c, rows, cols);
        }
      }
    }
  }
}

/**
 * フラグをトグル
 */
export function toggleFlag(gameState: GameState, row: number, col: number): GameState {
  const { board } = gameState;
  
  if (board[row][col].state === 'revealed') {
    return gameState;
  }
  
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  const cell = newBoard[row][col];
  
  if (cell.state === 'hidden') {
    cell.state = 'flagged';
  } else if (cell.state === 'flagged') {
    cell.state = 'hidden';
  }
  
  const flagsPlaced = newBoard.flat().filter(cell => cell.state === 'flagged').length;
  
  return {
    ...gameState,
    board: newBoard,
    flagsPlaced
  };
}

/**
 * 新しいゲームを開始
 */
export function createNewGame(rows: number = 9, cols: number = 9, mines: number = 10): GameState {
  const board = createBoard(rows, cols, mines);
  return {
    board,
    rows,
    cols,
    mines,
    status: 'playing',
    flagsPlaced: 0
  };
}

