const getRandomArray = (min, max) => {
  const arr = Array.from({ length: max - min + 1 }, (v, k) => k + min);

  const size = arr.length;
  for (let i = 0; i < size - 1; i++) {
    const j = Math.floor(Math.random() * (size - i) + i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
};

const fillDiagonalMatrices = (board) => {
  for (let i = 0; i < 3; i++) {
    const randomArray = getRandomArray(1, 9);

    const offset = i * 3;
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        board[y + offset][x + offset] = randomArray[y * 3 + x];
      }
    }
  }
};

const isPossible = (board, x, y, n) => {
  for (let i = 0; i < 9; i++) {
    if (board[i][x] === n || board[y][i] === n) return false;
  }

  const x0 = Math.floor(x / 3) * 3;
  const y0 = Math.floor(y / 3) * 3;

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i + y0][j + x0] === n) return false;
    }
  }

  return true;
};

const hideCells = (board, hiddenCells) => {
  while (hiddenCells > 0) {
    const x = Math.floor(Math.random() * 9);
    const y = Math.floor(Math.random() * 9);

    if (board[y][x] === 0) continue;

    board[y][x] = 0;
    hiddenCells--;
  }
};

const copyBoard = (boardToCopy) => {
  const board = Array(9);
  for (let i = 0; i < 9; i++) {
    board[i] = [...boardToCopy[i]];
  }

  return board;
};

const solveSudoku = (board) => {
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      if (board[y][x] !== 0) continue;

      for (let n = 1; n <= 9; n++) {
        if (isPossible(board, x, y, n)) {
          board[y][x] = n;
          if (solveSudoku(board) === false) {
            board[y][x] = 0;
          }
        }
      }
      return board[y][x] !== 0;
    }
  }
  return true;
};

const checkUniqueSolution = (board, resBoards) => {
  if (resBoards.length > 1) return false;

  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      if (board[y][x] !== 0) continue;

      for (let n = 1; n <= 9; n++) {
        if (isPossible(board, x, y, n)) {
          board[y][x] = n;
          checkUniqueSolution(board, resBoards);
          board[y][x] = 0;
        }
      }
      return resBoards.length <= 1;
    }
  }
  resBoards.push(board);
  return resBoards.length <= 1;
};

const createValidSudoku = (hiddenCells) => {
  let board = Array(9)
    .fill()
    .map(() => Array(9).fill(0));

  fillDiagonalMatrices(board);
  solveSudoku(board);
  const solved = copyBoard(board);

  hideCells(board, hiddenCells);
  const empty = copyBoard(board);

  if (checkUniqueSolution(board, [])) {
    return [empty, solved];
  }

  return createValidSudoku(hiddenCells);
};

export { createValidSudoku, copyBoard, isPossible };
