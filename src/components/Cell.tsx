/**
 * @author bc0109695
 */

import { Cell as CellType } from '../types';
import './Cell.css';

interface CellProps {
  cell: CellType;
  onClick: () => void;
  onRightClick: (e: React.MouseEvent) => void;
}

export function Cell({ cell, onClick, onRightClick }: CellProps) {
  const getCellContent = () => {
    if (cell.state === 'flagged') {
      return '🚩';
    }
    if (cell.state === 'revealed') {
      if (cell.isMine) {
        return '💣';
      }
      if (cell.adjacentMines > 0) {
        return cell.adjacentMines.toString();
      }
      return '';
    }
    return '';
  };

  const getCellClassName = () => {
    const classes = ['cell'];
    classes.push(`cell-${cell.state}`);
    if (cell.state === 'revealed' && cell.adjacentMines > 0) {
      classes.push(`cell-number-${cell.adjacentMines}`);
    }
    if (cell.state === 'revealed' && cell.isMine) {
      classes.push('cell-mine');
    }
    return classes.join(' ');
  };

  return (
    <button
      className={getCellClassName()}
      onClick={onClick}
      onContextMenu={onRightClick}
      disabled={cell.state === 'revealed'}
    >
      {getCellContent()}
    </button>
  );
}

