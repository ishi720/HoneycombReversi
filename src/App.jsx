import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// Cube座標系のヘルパー関数
const cubeAdd = (a, b) => ({ q: a.q + b.q, r: a.r + b.r, s: a.s + b.s });

// 座標の距離（中心からの距離）
const cubeDistance = (coord) => {
  return Math.max(Math.abs(coord.q), Math.abs(coord.r), Math.abs(coord.s));
};

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

// CPU難易度設定
const CPU_DIFFICULTY = {
  EASY: 'easy',
  NORMAL: 'normal',
  HARD: 'hard'
};

// 位置の価値を評価（端や外周は価値が高い）
const evaluatePosition = (q, r, s) => {
  const distance = cubeDistance({ q, r, s });
  // 外周に近いほど価値が高い
  if (distance === BOARD_RADIUS) return 10; // 最外周
  if (distance === BOARD_RADIUS - 1) return 5; // 外周の内側
  if (distance === 0) return 3; // 中心
  return 1;
};

// CPUの手を評価
const evaluateMove = (coord, player, currentBoard, difficulty) => {
  const flips = getFlips(coord, player, currentBoard);
  if (flips.length === 0) return -Infinity;

  const positionValue = evaluatePosition(coord.q, coord.r, coord.s);
  const flipCount = flips.length;

  switch (difficulty) {
    case CPU_DIFFICULTY.EASY:
      // ランダム要素を強く
      return flipCount + Math.random() * 10;
    case CPU_DIFFICULTY.NORMAL:
      // バランス型
      return flipCount * 2 + positionValue + Math.random() * 3;
    case CPU_DIFFICULTY.HARD:
      // 戦略的
      return flipCount * 3 + positionValue * 2 + evaluateFutureState(coord, player, currentBoard);
    default:
      return flipCount;
  }
};

// 将来の状態を評価（相手の手を制限できるか）
const evaluateFutureState = (coord, player, currentBoard) => {
  const key = `${coord.q},${coord.r},${coord.s}`;
  const flips = getFlips(coord, player, currentBoard);

  // 仮の盤面を作成
  const newBoard = new Map(currentBoard);
  newBoard.set(key, player);
  flips.forEach(flipKey => newBoard.set(flipKey, player));

  // 相手の有効な手の数を計算
  const opponent = player === 'black' ? 'white' : 'black';
  const opponentMoves = calculateValidMoves(opponent, newBoard);

  // 相手の手が少ないほど良い
  return -opponentMoves.size * 0.5;
};

// CPUの最善手を選択
const selectCPUMove = (validMoves, player, currentBoard, difficulty) => {
  const movesArray = Array.from(validMoves);
  if (movesArray.length === 0) return null;

  let bestMove = null;
  let bestScore = -Infinity;

  for (const moveKey of movesArray) {
    const [q, r, s] = moveKey.split(',').map(Number);
    const coord = { q, r, s };
    const score = evaluateMove(coord, player, currentBoard, difficulty);

    if (score > bestScore) {
      bestScore = score;
      bestMove = moveKey;
    }
  }

  return bestMove;
};

const HoneycombReversi = () => {
  const [board, setBoard] = useState(createInitialBoard());
  const [currentPlayer, setCurrentPlayer] = useState('black');
  const [validMoves, setValidMoves] = useState(new Set());
  const [gameOver, setGameOver] = useState(false);
  const [scores, setScores] = useState({ black: 3, white: 4 });
  const [gameMode, setGameMode] = useState(null); // 'pvp', 'cpu'
  const [cpuDifficulty, setCpuDifficulty] = useState(CPU_DIFFICULTY.HARD);
  const [cpuThinking, setCpuThinking] = useState(false);
  const [lastMove, setLastMove] = useState(null);

  const hexSize = 25;

  // セルをクリック（プレイヤーの手）
  const handleCellClick = useCallback((q, r, s) => {
    if (gameOver || cpuThinking) return;
    if (gameMode === 'cpu' && currentPlayer === 'white') return; // CPUのターン中は操作不可

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
    setLastMove(key);
    setCurrentPlayer(currentPlayer === 'black' ? 'white' : 'black');
  }, [gameOver, cpuThinking, gameMode, currentPlayer, validMoves, board]);

  // CPUの手を実行
  const executeCPUMove = useCallback(() => {
    if (gameMode !== 'cpu' || currentPlayer !== 'white' || gameOver) return;

    setCpuThinking(true);

    // 思考時間をシミュレート
    setTimeout(() => {
      const currentValidMoves = calculateValidMoves('white', board);

      if (currentValidMoves.size === 0) {
        setCpuThinking(false);
        return;
      }

      const moveKey = selectCPUMove(currentValidMoves, 'white', board, cpuDifficulty);

      if (moveKey) {
        const [q, r, s] = moveKey.split(',').map(Number);
        const coord = { q, r, s };
        const flips = getFlips(coord, 'white', board);

        const newBoard = new Map(board);
        newBoard.set(moveKey, 'white');
        flips.forEach(flipKey => {
          newBoard.set(flipKey, 'white');
        });

        setBoard(newBoard);
        setScores(calculateScores(newBoard));
        setLastMove(moveKey);
        setCurrentPlayer('black');
      }

      setCpuThinking(false);
    }, 1000 + Math.random() * 500); // 思考時間
  }, [gameMode, currentPlayer, gameOver, board, cpuDifficulty]);

  // 有効な手を更新
  useEffect(() => {
    if (!gameMode) return;

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
  }, [currentPlayer, board, gameMode]);

  // CPUのターン処理
  useEffect(() => {
    if (gameMode === 'cpu' && currentPlayer === 'white' && !gameOver && validMoves.size > 0) {
      executeCPUMove();
    }
  }, [gameMode, currentPlayer, gameOver, validMoves, executeCPUMove]);

  // ゲームをリセット
  const resetGame = () => {
    setBoard(createInitialBoard());
    setCurrentPlayer('black');
    setGameOver(false);
    setScores({ black: 3, white: 4 });
    setLastMove(null);
    setCpuThinking(false);
  };

  // メニューに戻る
  const backToMenu = () => {
    resetGame();
    setGameMode(null);
  };

  // ゲームモード選択画面
  if (!gameMode) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #0f766e, #1e293b)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '48px',
          color: '#fff'
        }}>
          Honeycomb Reversi
        </h1>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          width: '300px'
        }}>
          <button
            onClick={() => setGameMode('pvp')}
            style={{
              padding: '20px 32px',
              background: '#0d9488',
              color: 'white',
              fontWeight: 'bold',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              transition: 'all 0.3s',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#0f766e';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#0d9488';
              e.target.style.transform = 'scale(1)';
            }}
          >
            2人対戦
          </button>

          <button
            onClick={() => setGameMode('cpu')}
            style={{
              padding: '20px 32px',
              background: '#0d9488',
              color: 'white',
              fontWeight: 'bold',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              transition: 'all 0.3s',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#0f766e';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#0d9488';
              e.target.style.transform = 'scale(1)';
            }}
          >
            CPU対戦
          </button>
        </div>

        {/* CPU難易度選択 */}
        <div style={{
          marginTop: '32px',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          display: 'none'
        }}>
          <p style={{ color: '#94a3b8', marginBottom: '12px', textAlign: 'center' }}>
            CPU難易度
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            {Object.entries(CPU_DIFFICULTY).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setCpuDifficulty(value)}
                style={{
                  padding: '10px 20px',
                  background: cpuDifficulty === value ? '#14b8a6' : '#334155',
                  color: 'white',
                  fontWeight: cpuDifficulty === value ? 'bold' : 'normal',
                  borderRadius: '8px',
                  border: cpuDifficulty === value ? '2px solid #5eead4' : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.3s'
                }}
              >
                {key === 'EASY' ? '簡単' : key === 'NORMAL' ? '普通' : '難しい'}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
        const isValid = validMoves.has(key) && (gameMode === 'pvp' || currentPlayer === 'black');
        const isLastMove = key === lastMove;

        cells.push(
          <g key={key} onClick={() => handleCellClick(q, r, s)} style={{ cursor: isValid ? 'pointer' : 'default' }}>
            <Honeycomb cx={x} cy={y} size={hexSize} isValid={isValid} color={piece} isLastMove={isLastMove} />
            {piece && <Piece cx={x} cy={y} size={hexSize * 0.6} color={piece} isLastMove={isLastMove} />}
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
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%'
      }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '16px',
          color: '#fff'
        }}>
          Honeycomb Reversi
        </h1>

        <p style={{
          textAlign: 'center',
          color: '#94a3b8',
          marginBottom: '24px',
          fontSize: '14px'
        }}>
          {gameMode === 'pvp' ? '2人対戦モード' : `CPU対戦モード`}
        </p>

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
            transition: 'background 0.3s',
            position: 'relative'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#1f2937',
              border: '2px solid #4b5563'
            }}></div>
            <span style={{ color: 'white', fontWeight: '600' }}>{scores.black}</span>
            {gameMode === 'cpu' && (
              <span style={{ fontSize: '12px', color: '#ccc' }}>あなた</span>
            )}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 24px',
            borderRadius: '8px',
            background: currentPlayer === 'white' && !gameOver ? '#1ab8aaff' : '#334155',
            transition: 'background 0.3s',
            position: 'relative'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#f3f4f6',
              border: '2px solid #d1d5db'
            }}></div>
            <span style={{ color: 'white', fontWeight: '600' }}>{scores.white}</span>
            {gameMode === 'cpu' && (
              <span style={{ fontSize: '12px', color: '#ccc' }}>CPU</span>
            )}
          </div>
        </div>

        {cpuThinking && (
          <div style={{
            textAlign: 'center',
            marginBottom: '16px',
            fontSize: '16px',
            color: '#5eead4',
            animation: 'pulse 1s infinite',
            position: 'absolute',
            left: '60%',
          }}>
            考え中...
          </div>
        )}

        {gameOver && (
          <div style={{
            textAlign: 'center',
            marginBottom: '16px',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#5eead4'
          }}>
            ゲーム終了！ {scores.black > scores.white ? (gameMode === 'cpu' ? 'あなた' : '黒') : scores.white > scores.black ? (gameMode === 'cpu' ? 'CPU' : '白') : '引き分け'}の勝ち！
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <svg width="100%" height="100%" viewBox="-200 -200 400 400">
            <style>
              {`
                @keyframes pulse {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.5; }
                }
              `}
            </style>
            {renderCells()}
          </svg>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
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
            リセット
          </button>
          <button
            onClick={backToMenu}
            style={{
              padding: '12px 32px',
              background: '#475569',
              color: 'white',
              fontWeight: 'bold',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'background 0.3s'
            }}
            onMouseOver={(e) => e.target.style.background = '#334155'}
            onMouseOut={(e) => e.target.style.background = '#475569'}
          >
            戻る
          </button>
        </div>
      </div>
    </div>
  );
};

// マスコンポーネント
const Honeycomb = ({ cx, cy, size, isValid, color, isLastMove }) => {
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
      fill={isLastMove ? '#29bd62ff' : '#14b8a6'}
      stroke='#0f766e'
      strokeWidth='2'
      style={{
        opacity: isValid || color ? 1 : 0.6,

      }}
    />
  );
};

// 石コンポーネント
const Piece = ({ cx, cy, size, color, isLastMove }) => {
  return (
    <>
      <circle
        cx={cx}
        cy={cy}
        r={size}
        fill={color === 'black' ? '#1f2937' : '#f3f4f6'}
        strokeWidth='2'
        style={{ pointerEvents: 'none' }}
      />
    </>
  );
};

export default HoneycombReversi;