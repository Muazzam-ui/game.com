const boardEl = document.querySelector('#board');
const overlayEl = document.querySelector('#overlay');
const startBtn = document.querySelector('#start-btn');
const scoreEl = document.querySelector('#score');
const highScoreEl = document.querySelector('#high-score');
const timeEl = document.querySelector('#time');

const BLOCK_SIZE = 25; // px, matches grid cell size

let cols = 0;
let rows = 0;
let blocks = {}; // key: "x-y" -> DOM element

let snake = [];
let direction = 'right';
let nextDirection = 'right';
let food = null;
let score = 0;
let highScore = 0;
let elapsedSeconds = 0;

let moveIntervalId = null;
let timerIntervalId = null;
let gameRunning = false;

const MOVE_SPEED_MS = 150;

function buildBoard(){
    // Size the board to fit the available space, in whole blocks
    const wrapper = boardEl.parentElement;
    const maxWidth = wrapper.clientWidth;
    const maxHeight = wrapper.clientHeight;

    cols = Math.max(10, Math.floor(maxWidth / BLOCK_SIZE));
    rows = Math.max(10, Math.floor(maxHeight / BLOCK_SIZE));

    boardEl.style.width = `${cols * BLOCK_SIZE}px`;
    boardEl.style.height = `${rows * BLOCK_SIZE}px`;
    boardEl.style.gridTemplateColumns = `repeat(${cols}, ${BLOCK_SIZE}px)`;
    boardEl.style.gridTemplateRows = `repeat(${rows}, ${BLOCK_SIZE}px)`;

    boardEl.innerHTML = '';
    blocks = {};

    for(let row = 0; row < rows; row++){
        for(let col = 0; col < cols; col++){
            const block = document.createElement('div');
            block.classList.add('block');
            boardEl.appendChild(block);
            blocks[`${col}-${row}`] = block;
        }
    }
}

function clearBoardStyles(){
    Object.values(blocks).forEach(block => {
        block.classList.remove('fill', 'head', 'food');
    });
}

function initSnake(){
    const startX = Math.floor(cols / 2);
    const startY = Math.floor(rows / 2);
    snake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY }
    ];
    direction = 'right';
    nextDirection = 'right';
}

function placeFood(){
    let position;
    do {
        position = {
            x: Math.floor(Math.random() * cols),
            y: Math.floor(Math.random() * rows)
        };
    } while (snake.some(segment => segment.x === position.x && segment.y === position.y));
    food = position;
}

function render(){
    clearBoardStyles();

    snake.forEach((segment, index) => {
        const key = `${segment.x}-${segment.y}`;
        const block = blocks[key];
        if(block){
            block.classList.add(index === 0 ? 'head' : 'fill');
        }
    });

    if(food){
        const foodBlock = blocks[`${food.x}-${food.y}`];
        if(foodBlock){
            foodBlock.classList.add('food');
        }
    }
}

function updateScoreDisplay(){
    scoreEl.textContent = score;
    highScoreEl.textContent = highScore;
}

function tick(){
    direction = nextDirection;

    const head = { ...snake[0] };

    if(direction === 'left') head.x -= 1;
    else if(direction === 'right') head.x += 1;
    else if(direction === 'up') head.y -= 1;
    else if(direction === 'down') head.y += 1;

    // Wall collision
    if(head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows){
        return gameOver();
    }

    // Self collision
    if(snake.some(segment => segment.x === head.x && segment.y === head.y)){
        return gameOver();
    }

    snake.unshift(head);

    if(food && head.x === food.x && head.y === food.y){
        score += 1;
        if(score > highScore){
            highScore = score;
        }
        updateScoreDisplay();
        placeFood();
    } else {
        snake.pop();
    }

    render();
}

function startTimer(){
    elapsedSeconds = 0;
    timeEl.textContent = elapsedSeconds;
    timerIntervalId = setInterval(() => {
        elapsedSeconds += 1;
        timeEl.textContent = elapsedSeconds;
    }, 1000);
}

function stopTimer(){
    clearInterval(timerIntervalId);
}

function startGame(){
    buildBoard();
    initSnake();
    placeFood();
    score = 0;
    updateScoreDisplay();
    render();

    overlayEl.classList.add('hidden');
    gameRunning = true;

    clearInterval(moveIntervalId);
    moveIntervalId = setInterval(tick, MOVE_SPEED_MS);
    startTimer();
}

function gameOver(){
    gameRunning = false;
    clearInterval(moveIntervalId);
    stopTimer();

    overlayEl.querySelector('h1').textContent = 'Game Over';
    overlayEl.querySelector('p').textContent = `You scored ${score}. Press below to play again.`;
    startBtn.textContent = 'Play Again';
    overlayEl.classList.remove('hidden');
}

startBtn.addEventListener('click', startGame);

document.addEventListener('keydown', (event) => {
    if(!gameRunning) return;

    const key = event.key.toLowerCase();
    let requested = null;

    if(key === 'arrowleft' || key === 'a') requested = 'left';
    else if(key === 'arrowright' || key === 'd') requested = 'right';
    else if(key === 'arrowup' || key === 'w') requested = 'up';
    else if(key === 'arrowdown' || key === 's') requested = 'down';

    if(!requested) return;

    // Prevent the snake from reversing directly into itself
    const opposites = { left: 'right', right: 'left', up: 'down', down: 'up' };
    if(opposites[requested] === direction) return;

    nextDirection = requested;
    event.preventDefault();
});

// Build an initial (idle) board behind the start overlay
buildBoard();