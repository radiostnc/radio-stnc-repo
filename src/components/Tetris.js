import React, { useState, useEffect, useCallback } from 'react';
import './Tetris.css';

// Game constants
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 20;

// Tetromino shapes with monochrome colors
const TETROMINOS = {
  I: { shape: [[1, 1, 1, 1]], color: 'white' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'white' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'white' },
  O: { shape: [[1, 1], [1, 1]], color: 'white' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'white' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'white' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'white' }
};

function Tetris() {
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState(null);
  const [nextPiece, setNextPiece] = useState(null);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  
  // Create empty board
  function createEmptyBoard() {
    return Array.from({ length: BOARD_HEIGHT }, () => 
      Array(BOARD_WIDTH).fill(0)
    );
  }
  
  // Generate random tetromino
  const getRandomTetromino = useCallback(() => {
    const keys = Object.keys(TETROMINOS);
    const key = keys[Math.floor(Math.random() * keys.length)];
    
    // Create a deep copy to prevent mutation
    return {
      shape: JSON.parse(JSON.stringify(TETROMINOS[key].shape)),
      color: TETROMINOS[key].color,
      position: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 }
    };
  }, []);
  
  // Initialize game
  useEffect(() => {
    resetGame();
  }, []);
  
  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setCurrentPiece(getRandomTetromino());
    setNextPiece(getRandomTetromino());
    setScore(0);
    setLevel(1);
    setGameOver(false);
    setPaused(false);
  }, [getRandomTetromino]);
  
  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver || paused) return;
      
      // Prevent default behavior for arrow keys
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space'].includes(e.key)) {
        e.preventDefault();
      }
      
      switch (e.key) {
        case 'ArrowLeft':
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
          movePiece(1, 0);
          break;
        case 'ArrowDown':
          movePiece(0, 1);
          break;
        case 'ArrowUp':
          rotatePiece();
          break;
        case ' ':
          dropPiece();
          break;
        case 'p':
        case 'P':
          setPaused(prev => !prev);
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPiece, gameOver, paused]);
  
  // Game loop
  useEffect(() => {
    if (gameOver || paused) return;
    
    const speed = Math.max(100, 800 - (level * 50)); // Speed increases with level
    
    const gameLoop = setInterval(() => {
      movePiece(0, 1);
    }, speed);
    
    return () => clearInterval(gameLoop);
  }, [currentPiece, gameOver, level, paused]);
  
  // Move piece
  const movePiece = (deltaX, deltaY) => {
    if (!currentPiece || gameOver || paused) return;
    
    const newPosition = {
      x: currentPiece.position.x + deltaX,
      y: currentPiece.position.y + deltaY
    };
    
    if (isValidMove(currentPiece.shape, newPosition)) {
      setCurrentPiece({
        ...currentPiece,
        position: newPosition
      });
    } else if (deltaY > 0) {
      // Piece has landed
      placePiece();
    }
  };
  
  // Drop piece to bottom
  const dropPiece = () => {
    if (!currentPiece || gameOver || paused) return;
    
    let dropDistance = 0;
    let isValid = true;
    
    while (isValid) {
      dropDistance++;
      const newPosition = {
        x: currentPiece.position.x,
        y: currentPiece.position.y + dropDistance
      };
      
      if (!isValidMove(currentPiece.shape, newPosition)) {
        dropDistance--;
        isValid = false;
      }
    }
    
    if (dropDistance > 0) {
      setCurrentPiece({
        ...currentPiece,
        position: {
          ...currentPiece.position,
          y: currentPiece.position.y + dropDistance
        }
      });
      
      // Add a small delay before placing the piece
      setTimeout(() => placePiece(), 10);
    }
  };
  
  // Rotate piece
  const rotatePiece = () => {
    if (!currentPiece || gameOver || paused) return;
    
    // Create a properly rotated shape
    const rotated = [];
    for (let i = 0; i < currentPiece.shape[0].length; i++) {
      const row = [];
      for (let j = currentPiece.shape.length - 1; j >= 0; j--) {
        row.push(currentPiece.shape[j][i]);
      }
      rotated.push(row);
    }
    
    // Check if rotation is valid, try wall kicks if not
    const kicks = [
      {x: 0, y: 0},  // Original position
      {x: -1, y: 0}, // Try left
      {x: 1, y: 0},  // Try right
      {x: 0, y: -1}, // Try up
      {x: -1, y: -1}, // Try up-left
      {x: 1, y: -1}  // Try up-right
    ];
    
    for (const kick of kicks) {
      const newPosition = {
        x: currentPiece.position.x + kick.x,
        y: currentPiece.position.y + kick.y
      };
      
      if (isValidMove(rotated, newPosition)) {
        setCurrentPiece({
          ...currentPiece,
          shape: rotated,
          position: newPosition
        });
        return;
      }
    }
  };
  
  // Check if move is valid
  const isValidMove = (shape, position) => {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardX = position.x + x;
          const boardY = position.y + y;
          
          if (
            boardX < 0 || 
            boardX >= BOARD_WIDTH || 
            boardY >= BOARD_HEIGHT ||
            (boardY >= 0 && board[boardY] && board[boardY][boardX])
          ) {
            return false;
          }
        }
      }
    }
    return true;
  };
  
  // Place piece on board
  const placePiece = () => {
    if (!currentPiece) return;
    
    // Create a deep copy of the board
    const newBoard = JSON.parse(JSON.stringify(board));
    let rowsCleared = 0;
    
    // Add piece to board
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          const boardY = currentPiece.position.y + y;
          const boardX = currentPiece.position.x + x;
          
          // Game over if piece is placed above the board
          if (boardY < 0) {
            setGameOver(true);
            return;
          }
          
          newBoard[boardY][boardX] = currentPiece.color;
        }
      }
    }
    
    // Check for completed rows
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell !== 0)) {
        // Remove completed row
        newBoard.splice(y, 1);
        // Add new empty row at top
        newBoard.unshift(Array(BOARD_WIDTH).fill(0));
        rowsCleared++;
        y++; // Check the same row again
      }
    }
    
    // Update score and level
    if (rowsCleared > 0) {
      const points = [0, 40, 100, 300, 1200][rowsCleared] * level;
      const newScore = score + points;
      setScore(newScore);
      
      // Level up every 10 rows
      if (Math.floor(newScore / 1000) > level - 1) {
        setLevel(Math.floor(newScore / 1000) + 1);
      }
    }
    
    setBoard(newBoard);
    setCurrentPiece(nextPiece);
    setNextPiece(getRandomTetromino());
  };
  
  // Render game board
  const renderBoard = () => {
    // Create a deep copy of the board
    const displayBoard = JSON.parse(JSON.stringify(board));
    
    // Add current piece to display board
    if (currentPiece && !gameOver && !paused) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.position.y + y;
            const boardX = currentPiece.position.x + x;
            
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentPiece.color;
            }
          }
        }
      }
      
      // Show ghost piece (where the piece will land)
      let ghostY = currentPiece.position.y;
      while (isValidMove(currentPiece.shape, { x: currentPiece.position.x, y: ghostY + 1 })) {
        ghostY++;
      }
      
      if (ghostY !== currentPiece.position.y) {
        for (let y = 0; y < currentPiece.shape.length; y++) {
          for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x]) {
              const boardY = ghostY + y;
              const boardX = currentPiece.position.x + x;
              
              if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH && !displayBoard[boardY][boardX]) {
                displayBoard[boardY][boardX] = 'rgba(255, 255, 255, 0.2)';
              }
            }
          }
        }
      }
    }
    
    return (
      <div className="tetris-board">
        {displayBoard.map((row, y) => (
          <div key={y} className="tetris-row">
            {row.map((cell, x) => (
              <div 
                key={x} 
                className="tetris-cell" 
                style={{ 
                  backgroundColor: cell || 'transparent',
                  width: BLOCK_SIZE,
                  height: BLOCK_SIZE
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };
  
  // Render next piece preview
  const renderNextPiece = () => {
    if (!nextPiece) return null;
    
    return (
      <div className="next-piece">
        {nextPiece.shape.map((row, y) => (
          <div key={y} className="tetris-row">
            {row.map((cell, x) => (
              <div 
                key={x} 
                className="tetris-cell" 
                style={{ 
                  backgroundColor: cell ? nextPiece.color : 'transparent',
                  width: BLOCK_SIZE - 2,
                  height: BLOCK_SIZE - 2
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="tetris-game">
      <div className="tetris-header">
        <div className="tetris-info">
          <div className="tetris-score">score: {score}</div>
          <div className="tetris-level">level: {level}</div>
        </div>
        <div className="tetris-next">
          <div className="next-label">next:</div>
          {renderNextPiece()}
        </div>
      </div>
      
      {renderBoard()}
      
      <div className="tetris-controls">
        <button className="control-btn" onClick={() => movePiece(-1, 0)}>←</button>
        <button className="control-btn" onClick={() => movePiece(0, 1)}>↓</button>
        <button className="control-btn" onClick={() => movePiece(1, 0)}>→</button>
        <button className="control-btn" onClick={rotatePiece}>↻</button>
        <button className="control-btn" onClick={dropPiece}>⤓</button>
        <button className="control-btn" onClick={() => setPaused(p => !p)}>
          {paused ? '▶' : '❚❚'}
        </button>
      </div>
      
      <div className="tetris-instructions">
        arrows: move • up: rotate • space: drop • p: pause
      </div>
      
      {(gameOver || paused) && (
        <div className="game-overlay">
          <div className="game-message">
            <h2>{gameOver ? 'game over' : 'paused'}</h2>
            {gameOver && <p>final score: {score}</p>}
            <button onClick={gameOver ? resetGame : () => setPaused(false)}>
              {gameOver ? 'play again' : 'resume'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tetris; 