const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startButton = document.getElementById('start-button');

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 24;

context.scale(BLOCK_SIZE, BLOCK_SIZE);
nextContext.scale(BLOCK_SIZE, BLOCK_SIZE);

let board = createBoard();
let score = 0;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

const COLORS = [
    null,
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF',
];

const SHAPES = [
    [],
    [[1, 1, 1, 1]], // I
    [[2, 2], [2, 2]],   // O
    [[0, 3, 0], [3, 3, 3]], // T
    [[4, 4, 0], [0, 4, 4]], // S
    [[0, 5, 5], [5, 5, 0]], // Z
    [[6, 0, 0], [6, 6, 6]], // L
    [[0, 0, 7], [7, 7, 7]], // J
];

let player = {
    pos: {x: 0, y: 0},
    matrix: null,
    next: null,
};

function createBoard() {
    return Array.from({length: ROWS}, () => Array(COLS).fill(0));
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(board, {x: 0, y: 0});
    drawMatrix(player.matrix, player.pos);
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = COLORS[value];
                context.fillRect(x + offset.x,
                                 y + offset.y,
                                 1, 1);
            }
        });
    });
}

function drawNext() {
    nextContext.fillStyle = '#000';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    const matrix = player.next;
    const x = (nextCanvas.width / BLOCK_SIZE - matrix[0].length) / 2;
    const y = (nextCanvas.height / BLOCK_SIZE - matrix.length) / 2;
    drawMatrixOnNext(matrix, {x, y});
}

function drawMatrixOnNext(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                nextContext.fillStyle = COLORS[value];
                nextContext.fillRect(x + offset.x,
                                 y + offset.y,
                                 1, 1);
            }
        });
    });
}

function merge(board, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerDrop() {
    player.pos.y++;
    if (collide(board, player)) {
        player.pos.y--;
        merge(board, player);
        playerReset();
        boardSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(offset) {
    player.pos.x += offset;
    if (collide(board, player)) {
        player.pos.x -= offset;
    }
}

function playerReset() {
    const shapes = 'TJLOSZI';
    if (!player.next) {
        player.matrix = createPiece(shapes[shapes.length * Math.random() | 0]);
    } else {
        player.matrix = player.next;
    }
    player.next = createPiece(shapes[shapes.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (board[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);
    if (collide(board, player)) {
        board.forEach(row => row.fill(0));
        score = 0;
        updateScore();
    }
    drawNext();
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(board, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function boardSweep() {
    let rowCount = 1;
    outer: for (let y = board.length - 1; y > 0; --y) {
        for (let x = 0; x < board[y].length; ++x) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }

        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        ++y;

        score += rowCount * 10;
        rowCount *= 2;
    }
}

function collide(board, player) {
    const matrix = player.matrix;
    const pos = player.pos;

    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            if (matrix[y][x] === 0) {
                continue;
            }

            const newX = pos.x + x;
            const newY = pos.y + y;

            if (newX < 0 || newX >= COLS || newY >= ROWS) {
                return true;
            }

            if (newY < 0) {
                continue;
            }

            if (board[newY][newX] !== 0) {
                return true;
            }
        }
    }

    return false;
}

function createPiece(type) {
    if (type === 'T') return [[0, 3, 0], [3, 3, 3]];
    if (type === 'O') return [[2, 2], [2, 2]];
    if (type === 'L') return [[6, 0, 0], [6, 6, 6]];
    if (type === 'J') return [[0, 0, 7], [7, 7, 7]];
    if (type === 'I') return [[1, 1, 1, 1]];
    if (type === 'S') return [[0, 4, 4], [4, 4, 0]];
    if (type === 'Z') return [[5, 5, 0], [0, 5, 5]];
}

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

function updateScore() {
    scoreElement.innerText = score;
}

document.addEventListener('keydown', event => {
    if (event.keyCode === 37) {
        playerMove(-1);
    } else if (event.keyCode === 39) {
        playerMove(1);
    } else if (event.keyCode === 40) {
        playerDrop();
    } else if (event.keyCode === 81) {
        playerRotate(-1);
    } else if (event.keyCode === 87) {
        playerRotate(1);
    }
});

startButton.addEventListener('click', () => {
    playerReset();
    updateScore();
    update();
});

playerReset();
updateScore();
