import { createValidSudoku, copyBoard, isPossible } from "./sudoku.js";

const EASY_LEVEL = 25;
const MEDIUM_LEVEL = 35;
const HARD_LEVEL = 45;
const CELL_ANIMATION_TIME = 30;

const board = document.getElementById("board");
const timerContainer = document.getElementById("timer");
const counterContainer = document.getElementById("counter");
const endGameModal = document.getElementById("end-game-modal");
const endGameTimer = document.getElementById("modal-timer");
const endGameCounter = document.getElementById("modal-counter");
const btnEndGameModalClose = document.getElementById("end-game-modal-close");
const levelSelect = document.getElementById("select-level");
const btnNewBoard = document.querySelector(`[data-button="new-board"]`);
const btnSolve = document.querySelector(`[data-button="solve"]`);
const btnCheck = document.querySelector(`[data-button="check"]`);
const btnReset = document.querySelector(`[data-button="reset"]`);
const btnPrompt = document.querySelector(`[data-button="prompt"]`);

let timerHandler = null;
let startTime = 0;
let promptCounter = 0;
let emptyBoard = [];
let solvedBoard = [];
let userBoard = [];

function sleep(ms = CELL_ANIMATION_TIME) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const fillLevelSelect = () => {
  const levels = {
    Easy: EASY_LEVEL,
    Medium: MEDIUM_LEVEL,
    Hard: HARD_LEVEL,
  };

  for (const [level, value] of Object.entries(levels)) {
    const option = document.createElement("option");
    option.innerText = level;
    option.value = value;
    levelSelect.appendChild(option);
  }
};

const startUpApp = () => {
  hideEndGameModalEvent();
  fillLevelSelect();
  startGame();
};

const startGame = () => {
  const hiddenCells = levelSelect.value || EASY_LEVEL;
  [emptyBoard, solvedBoard] = createValidSudoku(hiddenCells);
  userBoard = copyBoard(emptyBoard);

  resetPromptCounter();
  renderBoard();
  addActiveClass();
  startInteraction();
};

const renderBoard = () => {
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.cell = `${y}${x}`;

      const cellValue = userBoard[y][x];
      if (cellValue !== 0) {
        cell.innerText = cellValue;
        cell.classList.add("computed");
      }

      board.appendChild(cell);
    }
  }
};

const addActiveClass = () => {
  const cellsToFill = [...board.querySelectorAll(".cell:not(.computed)")];
  cellsToFill.forEach((cell) => {
    cell.addEventListener("click", () => {
      const activeCell = board.querySelector(".active");
      if (activeCell) {
        activeCell.classList.remove("active");
        if (cell === activeCell) return;
      }

      if (cell.classList.contains("correct")) return;

      cell.classList.add("active");
    });
  });
};

const startInteraction = () => {
  document.addEventListener("keydown", handleKeyPress);
  document.addEventListener("click", handleMouseClick);

  btnSolve.addEventListener("click", handleSolve);
  btnCheck.addEventListener("click", checkBoard);
  btnReset.addEventListener("click", resetBoard);
  btnPrompt.addEventListener("click", getPrompt);
  btnNewBoard.addEventListener("click", () => handleNewBoard(), { once: true });

  enableButtons();
  startTimer();
};

const enableButtons = () => {
  btnSolve.classList.remove("disabled");
  btnCheck.classList.remove("disabled");
  btnReset.classList.remove("disabled");
  btnPrompt.classList.remove("disabled");
};

const disableButtons = () => {
  btnSolve.classList.add("disabled");
  btnCheck.classList.add("disabled");
  btnReset.classList.add("disabled");
  btnPrompt.classList.add("disabled");
};

const startTimer = () => {
  clearTimerContainer();
  timerHandler = setInterval(showTimer, 1000);
};

const showTimer = () => {
  const gameTime = getGameTime();
  timerContainer.innerText = gameTime;
};

const getGameTime = () => {
  const currTime = new Date();
  if (startTime === 0) startTime = currTime;

  const miliSeconds = currTime - startTime;
  return new Date(miliSeconds).toISOString().substr(11, 8);
};

const clearTimerContainer = () => (timerContainer.innerText = "00:00:00");

const stopTimer = () => {
  startTime = 0;
  clearInterval(timerHandler);
};

const stopInteraction = () => {
  document.removeEventListener("keydown", handleKeyPress);
  document.removeEventListener("click", handleMouseClick);

  btnSolve.removeEventListener("click", handleSolve);
  btnCheck.removeEventListener("click", checkBoard);
  btnReset.removeEventListener("click", resetBoard);

  disableButtons();
  stopTimer();
};

const handleNewBoard = () => {
  removeBoard();
  stopInteraction();
  startGame();
};

const removeBoard = () => {
  board.innerHTML = "";
};

const handleKeyPress = (e) => {
  if (e.key.match(/^[1-9]$/)) {
    pressKey(e.key);
    return;
  }

  if (e.key === "Backspace" || e.key === "Delete") {
    pressDeleteKey();
    return;
  }

  if (e.key === "Tab") {
    pressTabKey(e);
    return;
  }
};

const handleMouseClick = (e) => {
  if (e.target.matches("[data-cell]")) return;

  const activeCell = board.querySelector(".active");
  if (!activeCell) return;

  activeCell.classList.remove("active");
};

const pressKey = (key) => {
  const activeCell = board.querySelector(".active");
  if (!activeCell) return;

  const [row, col] = getActiveCellCoordinates(activeCell);

  userBoard[row][col] = parseInt(key);
  activeCell.classList.remove("wrong");
  activeCell.innerText = key;

  if (isBoardCompleted()) endGame();
};

const getActiveCellCoordinates = (activeCell) => {
  return [...activeCell.dataset.cell].map((cord) => parseInt(cord));
};

const pressDeleteKey = () => {
  const activeCell = board.querySelector(".active");
  if (!activeCell) return;

  const [row, col] = getActiveCellCoordinates(activeCell);

  userBoard[row][col] = 0;
  activeCell.innerText = null;
};

const pressTabKey = (e) => {
  e.preventDefault();

  const activeCell = board.querySelector(".active");
  const nextEmptyCell = getNextEmptyCell(activeCell);

  if (activeCell === nextEmptyCell) return;
  if (activeCell) activeCell.classList.remove("active");
  nextEmptyCell.classList.add("active");
};

const getNextEmptyCell = (activeCell) => {
  if (!activeCell) return getFirstEmptyCell();

  const idx = getNextCellIdx(activeCell);
  const nextEmptyCell = board.querySelector(
    `.cell:nth-child(n + ${idx}):not(.computed):not(.correct)`
  );

  return nextEmptyCell || getFirstEmptyCell();
};

const getNextCellIdx = (activeCell) => {
  const [row, col] = getActiveCellCoordinates(activeCell);
  return row * 9 + col + 2;
};

const getFirstEmptyCell = () => {
  return board.querySelector(".cell:not(.computed):not(.correct)");
};

const handleSolve = () => {
  solveBoard();
  stopInteraction();
};

const solveBoard = async () => {
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      if (emptyBoard[y][x] !== 0) continue;

      for (let n = 1; n <= 9; n++) {
        if (isPossible(emptyBoard, x, y, n)) {
          emptyBoard[y][x] = n;
          await addValueToBoard(x, y, n);
          if ((await solveBoard(emptyBoard)) === false) {
            emptyBoard[y][x] = 0;
            await removeValueFromBoard(x, y);
          }
        }
      }
      return emptyBoard[y][x] !== 0;
    }
  }
  return true;

  async function addValueToBoard(x, y, value) {
    await sleep();

    const cell = board.querySelector(`[data-cell="${y}${x}"]`);
    cell.classList.remove("wrong", "active");
    cell.classList.add("correct");
    cell.innerText = value;
  }

  async function removeValueFromBoard(x, y) {
    await sleep();

    const cell = board.querySelector(`[data-cell="${y}${x}"]`);
    cell.classList.remove("correct", "active");
    cell.classList.add("wrong");
  }
};

const checkBoard = () => {
  let counter = 0;
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      if (userBoard[y][x] === 0) continue;

      const cell = board.querySelector(`[data-cell="${y}${x}"]`);

      const classNames = ["computed", "correct", "wrong"];
      if (classNames.some((className) => cell.classList.contains(className))) {
        continue;
      }

      if (userBoard[y][x] === solvedBoard[y][x]) {
        cell.classList.remove("wrong");
        cell.classList.add("correct");
      } else {
        cell.classList.remove("correct");
        cell.classList.add("wrong");
      }

      counter++;
    }
  }

  increasePromptCounter(counter);
};

const resetPromptCounter = () => {
  promptCounter = 0;
  counterContainer.innerText = 0;
};

const increasePromptCounter = (prompts) => {
  promptCounter += prompts;
  counterContainer.innerText = promptCounter;
};

const resetBoard = () => {
  clearBoard();
  resetCounters();
};

const clearBoard = () => {
  const filledCells = [...board.querySelectorAll(".cell:not(.computed)")];
  filledCells.forEach((cell) => {
    cell.classList.remove("wrong", "correct");
    cell.innerText = null;
  });

  userBoard = copyBoard(emptyBoard);
};

const resetCounters = () => {
  stopTimer();
  startTimer();
  resetPromptCounter();
};

const getPrompt = () => {
  const activeCell = board.querySelector(".active");
  if (!activeCell) return;

  const [row, col] = getActiveCellCoordinates(activeCell);

  const correctValue = solvedBoard[row][col];

  userBoard[row][col] = correctValue;
  activeCell.innerText = correctValue;
  activeCell.classList.remove("wrong", "active");
  activeCell.classList.add("correct");

  increasePromptCounter(1);

  if (isBoardCompleted()) endGame();
};

const isBoardCompleted = () => {
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      if (userBoard[y][x] !== solvedBoard[y][x]) return false;
    }
  }

  return true;
};

const showEndGameResults = () => {
  endGameCounter.innerText = promptCounter;
  endGameTimer.innerText = getGameTime();
};

const endGame = async () => {
  await endGameBoardAnimation();
  showEndGameResults();
  showEndGameModal();
  stopInteraction();
};

const endGameBoardAnimation = async () => {
  const filledCells = [
    ...board.querySelectorAll(".cell:not(.computed):not(.correct)"),
  ];
  for (let cell of filledCells) {
    await sleep(20 * CELL_ANIMATION_TIME);
    cell.classList.remove("active", "wrong");
    cell.classList.add("correct");
  }
};

const showEndGameModal = () => {
  endGameModal.style.display = "block";
};

const hideEndGameModal = () => {
  endGameModal.style.display = "none";
};

const hideEndGameModalEvent = () => {
  btnEndGameModalClose.addEventListener("click", hideEndGameModal);
};

startUpApp();
