import React, { useState, useEffect } from 'react';

// Cube座標系のヘルパー関数
const cubeAdd = (a, b) => ({ q: a.q + b.q, r: a.r + b.r, s: a.s + b.s });

// 6方向の隣接セル
const directions = [
  { q: 1, r: -1, s: 0 },  // 右上
  { q: 1, r: 0, s: -1 },  // 右
  { q: 0, r: 1, s: -1 },  // 右下
  { q: -1, r: 1, s: 0 },  // 左下
  { q: -1, r: 0, s: 1 },  // 左
  { q: 0, r: -1, s: 1 },  // 左上
];

// Cube座標から画面座標への変換
const cubeToPixel = (q, r, size) => {
  const x = size * (3/2 * q);
  const y = size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
  return { x, y };
};

// ボードの範囲を定義
const BOARD_RADIUS = 4;

// 座標がボード内かチェック
const isInBounds = (coord) => {
  return Math.abs(coord.q) <= BOARD_RADIUS && 
         Math.abs(coord.r) <= BOARD_RADIUS && 
         Math.abs(coord.s) <= BOARD_RADIUS;
};

// 初期配置を生成
const createInitialBoard = () => {
  const board = new Map();
  board.set('0,0,0', 'white');
  board.set('1,-1,0', 'black');
  board.set('0,1,-1', 'black');
  board.set('-1,0,1', 'black');
  board.set('-1,1,0', 'white');
  board.set('1,0,-1', 'white');
  board.set('0,-1,1', 'white');
  return board;
};

const HoneycombReversi = () => {
  const [board, setBoard] = useState(createInitialBoard());
  const [currentPlayer, setCurrentPlayer] = useState('black');
  const [validMoves, setValidMoves] = useState(new Set());
  const [gameOver, setGameOver] = useState(false);
  const [scores, setScores] = useState({ black: 3, white: 4 });

  const hexSize = 25;

  // 指定方向に裏返せる石を探す
  const findFlipsInDirection = (coord, direction, player, currentBoard) => {
    const flips = [];
    let current = cubeAdd(coord, direction);

    while (isInBounds(current)) {
      const key = `${current.q},${current.r},${current.s}`;
      const piece = currentBoard.get(key);
      if (!piece) break;
      if (piece === player) return flips;
      flips.push(key);
      current = cubeAdd(current, direction);
    }
    return [];
  };

  // 指定位置に置いた時に裏返せる石をすべて取得
  const getFlips = (coord, player, currentBoard) => {
    const key = `${coord.q},${coord.r},${coord.s}`;
    if (currentBoard.has(key)) return [];

    let allFlips = [];
    for (const dir of directions) {
      const flips = findFlipsInDirection(coord, dir, player, currentBoard);
      if (flips.length > 0) {
        allFlips = [...allFlips, ...flips];
      }
    }
    return allFlips;
  };

  // 有効な手を計算
  const calculateValidMoves = (player, currentBoard) => {
    const moves = new Set();
    for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) {
      for (let r = -BOARD_RADIUS; r <= BOARD_RADIUS; r++) {
        const s = -q - r;
        if (!isInBounds({ q, r, s })) continue;
        const coord = { q, r, s };
        const flips = getFlips(coord, player, currentBoard);
        if (flips.length > 0) {
          moves.add(`${q},${r},${s}`);
        }
      }
    }
    return moves;
  };

  // スコアを計算
  const calculateScores = (currentBoard) => {
    let black = 0, white = 0;
    currentBoard.forEach(piece => {
      if (piece === 'black') black++;
      else white++;
    });
    return { black, white };
  };

  // 有効な手を更新
  useEffect(() => {
    const moves = calculateValidMoves(currentPlayer, board);
    setValidMoves(moves);
    
    if (moves.size === 0) {
      const opponent = currentPlayer === 'black' ? 'white' : 'black';
      const opponentMoves = calculateValidMoves(opponent, board);
      if (opponentMoves.size === 0) {
        setGameOver(true);
      } else {
        setCurrentPlayer(opponent);
      }
    }
  }, [currentPlayer, board]);

  // セルをクリック
  const handleCellClick = (q, r, s) => {
    if (gameOver) return;
    const key = `${q},${r},${s}`;
    if (!validMoves.has(key)) return;

    const coord = { q, r, s };
    const flips = getFlips(coord, currentPlayer, board);
    
    const newBoard = new Map(board);
    newBoard.set(key, currentPlayer);
    flips.forEach(flipKey => {
      newBoard.set(flipKey, currentPlayer);
    });

    setBoard(newBoard);
    setScores(calculateScores(newBoard));
    setCurrentPlayer(currentPlayer === 'black' ? 'white' : 'black');
  };

  // ゲームをリセット
  const resetGame = () => {
    setBoard(createInitialBoard());
    setCurrentPlayer('black');
    setGameOver(false);
    setScores({ black: 3, white: 4 });
  };

  // すべてのセルを描画
  const renderCells = () => {
    const cells = [];
    for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) {
      for (let r = -BOARD_RADIUS; r <= BOARD_RADIUS; r++) {
        const s = -q - r;
        if (!isInBounds({ q, r, s })) continue;
        
        const { x, y } = cubeToPixel(q, r, hexSize);
        const key = `${q},${r},${s}`;
        const piece = board.get(key);
        const isValid = validMoves.has(key);

        cells.push(
          <g key={key} onClick={() => handleCellClick(q, r, s)} style={{ cursor: isValid ? 'pointer' : 'default' }}>
            <Honeycomb cx={x} cy={y} size={hexSize} isValid={isValid} color={piece} />
            {piece && <Piece cx={x} cy={y} size={hexSize * 0.6} color={piece} />}
          </g>
        );
      }
    }
    return cells;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #0f766e, #1e293b)',
      padding: '32px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        padding: '32px',
        maxWidth: '600px'
      }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '24px',
          color: '#5eead4'
        }}>
          ハニカムリバーシ
        </h1>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          marginBottom: '24px',
          fontSize: '20px',
          gap: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 24px',
            borderRadius: '8px',
            background: currentPlayer === 'black' && !gameOver ? '#1e8d84ff' : '#334155',
            transition: 'background 0.3s'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#1f2937',
              border: '2px solid #4b5563'
            }}></div>
            <span style={{ color: 'white', fontWeight: '600' }}>{scores.black}</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 24px',
            borderRadius: '8px',
            background: currentPlayer === 'white' && !gameOver ? '#1ab8aaff' : '#334155',
            transition: 'background 0.3s'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#f3f4f6',
              border: '2px solid #d1d5db'
            }}></div>
            <span style={{ color: 'white', fontWeight: '600' }}>{scores.white}</span>
          </div>
        </div>

        {gameOver && (
          <div style={{
            textAlign: 'center',
            marginBottom: '16px',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#5eead4'
          }}>
            ゲーム終了！ {scores.black > scores.white ? '黒' : scores.white > scores.black ? '白' : '引き分け'}の勝ち
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <svg width="500" height="500" viewBox="-200 -200 400 400">
            {renderCells()}
          </svg>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={resetGame}
            style={{
              padding: '12px 32px',
              background: '#0d9488',
              color: 'white',
              fontWeight: 'bold',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'background 0.3s'
            }}
            onMouseOver={(e) => e.target.style.background = '#0f766e'}
            onMouseOut={(e) => e.target.style.background = '#0d9488'}
          >
            新しいゲーム
          </button>
        </div>
      </div>
    </div>
  );
};

// 六角形コンポーネント
const Honeycomb = ({ cx, cy, size, isValid, color }) => {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = cx + size * Math.cos(angle);
    const y = cy + size * Math.sin(angle);
    points.push(`${x},${y}`);
  }

  return (
    <polygon
      points={points.join(' ')}
      fill={color ? '#14b8a6' : '#14b8a6'}
      stroke="#0f766e"
      strokeWidth="2"
      style={{ 
        opacity: isValid || color ? 1 : 0.6,
        transition: 'all 0.3s'
      }}
    />
  );
};

// 石コンポーネント
const Piece = ({ cx, cy, size, color }) => {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={size}
      fill={color === 'black' ? '#1f2937' : '#f3f4f6'}
      stroke={color === 'black' ? '#4b5563' : '#d1d5db'}
      strokeWidth="2"
      style={{ pointerEvents: 'none' }}
    />
  );
};

export default HoneycombReversi;