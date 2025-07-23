import React, { useState } from 'react';

const BOARD_SIZE = 15;

const GomokuGame = () => {
  const [board, setBoard] = useState(() => 
    Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
  );
  const [currentPlayer, setCurrentPlayer] = useState('black');
  const [winner, setWinner] = useState(null);
  const [gameOver, setGameOver] = useState(false);

  const checkWinner = (newBoard, row, col, player) => {
    const directions = [
      [0, 1],   // 水平
      [1, 0],   // 垂直
      [1, 1],   // 对角线 \
      [1, -1]   // 对角线 /
    ];

    for (const [dx, dy] of directions) {
      let count = 1;
      
      // 正向检查
      for (let i = 1; i < 5; i++) {
        const newRow = row + dx * i;
        const newCol = col + dy * i;
        if (
          newRow >= 0 && newRow < BOARD_SIZE &&
          newCol >= 0 && newCol < BOARD_SIZE &&
          newBoard[newRow][newCol] === player
        ) {
          count++;
        } else {
          break;
        }
      }

      // 反向检查
      for (let i = 1; i < 5; i++) {
        const newRow = row - dx * i;
        const newCol = col - dy * i;
        if (
          newRow >= 0 && newRow < BOARD_SIZE &&
          newCol >= 0 && newCol < BOARD_SIZE &&
          newBoard[newRow][newCol] === player
        ) {
          count++;
        } else {
          break;
        }
      }

      if (count >= 5) return true;
    }

    return false;
  };

  const handleCellClick = (row, col) => {
    if (gameOver || board[row][col] !== null) return;

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);

    if (checkWinner(newBoard, row, col, currentPlayer)) {
      setWinner(currentPlayer);
      setGameOver(true);
    } else {
      setCurrentPlayer(currentPlayer === 'black' ? 'white' : 'black');
    }
  };

  const resetGame = () => {
    setBoard(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)));
    setCurrentPlayer('black');
    setWinner(null);
    setGameOver(false);
  };

  const getCellClassName = (row, col) => {
    let baseClass = "w-6 h-6 border border-gray-400 flex items-center justify-center cursor-pointer relative";
    
    if (board[row][col] === 'black') {
      baseClass += " bg-black rounded-full";
    } else if (board[row][col] === 'white') {
      baseClass += " bg-white border-2 border-black rounded-full";
    }
    
    return baseClass;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-xl font-semibold">
        当前玩家: 
        <span className={currentPlayer === 'black' ? 'text-black' : 'text-gray-600'}>
          {currentPlayer === 'black' ? '黑棋' : '白棋'}
        </span>
      </div>

      {winner && (
        <div className="mb-4 text-2xl font-bold text-green-600">
          {winner === 'black' ? '黑棋' : '白棋'} 获胜！
        </div>
      )}

      <div className="bg-amber-100 p-4 rounded-lg shadow-lg">
        <div className="grid grid-cols-15 gap-0">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="w-8 h-8 border border-gray-600 flex items-center justify-center cursor-pointer hover:bg-amber-200"
                onClick={() => handleCellClick(rowIndex, colIndex)}
              >
                {cell && (
                  <div
                    className={`w-6 h-6 rounded-full ${
                      cell === 'black' ? 'bg-black' : 'bg-white border-2 border-black'
                    }`}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <button
        onClick={resetGame}
        className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        重新开始
      </button>
    </div>
  );
};

export default GomokuGame;