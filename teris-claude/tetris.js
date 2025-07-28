class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('gameBoard');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.BLOCK_SIZE = 30;
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.isPaused = false;
        this.dropInterval = null;
        this.lastDropTime = 0;
        this.dropSpeed = 1000;
        
        this.colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
            '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'
        ];
        
        this.shapes = [
            [[1, 1, 1, 1]], // I
            [[1, 1], [1, 1]], // O
            [[0, 1, 0], [1, 1, 1]], // T
            [[1, 0, 0], [1, 1, 1]], // L
            [[0, 0, 1], [1, 1, 1]], // J
            [[0, 1, 1], [1, 1, 0]], // S
            [[1, 1, 0], [0, 1, 1]]  // Z
        ];
        
        this.init();
    }
    
    init() {
        this.initializeBoard();
        this.generateNextPiece();
        this.generateNewPiece();
        this.setupEventListeners();
        this.startGame();
        this.updateDisplay();
        this.gameLoop();
    }
    
    initializeBoard() {
        this.board = [];
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            this.board[y] = new Array(this.BOARD_WIDTH).fill(0);
        }
    }
    
    generateNextPiece() {
        const shapeIndex = Math.floor(Math.random() * this.shapes.length);
        const colorIndex = Math.floor(Math.random() * this.colors.length);
        
        this.nextPiece = {
            shape: this.shapes[shapeIndex],
            color: this.colors[colorIndex],
            x: 0,
            y: 0,
            type: shapeIndex
        };
    }
    
    generateNewPiece() {
        if (!this.nextPiece) {
            this.generateNextPiece();
        }
        
        this.currentPiece = {
            shape: this.nextPiece.shape,
            color: this.nextPiece.color,
            x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(this.nextPiece.shape[0].length / 2),
            y: 0,
            type: this.nextPiece.type
        };
        
        this.generateNextPiece();
        
        // 检查新方块是否与已有方块重叠
        if (this.isCollision(this.currentPiece, this.currentPiece.x, this.currentPiece.y)) {
            this.gameOver();
        }
    }
    
    drawBlock(ctx, x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * this.BLOCK_SIZE, y * this.BLOCK_SIZE, this.BLOCK_SIZE, this.BLOCK_SIZE);
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x * this.BLOCK_SIZE, y * this.BLOCK_SIZE, this.BLOCK_SIZE, this.BLOCK_SIZE);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x * this.BLOCK_SIZE + 2, y * this.BLOCK_SIZE + 2, this.BLOCK_SIZE - 4, this.BLOCK_SIZE - 4);
    }
    
    drawBoard() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格背景
        this.ctx.strokeStyle = '#e9ecef';
        this.ctx.lineWidth = 1;
        for (let x = 0; x <= this.BOARD_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(x * this.BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.BOARD_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, y * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
        
        // 绘制已固定的方块
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(this.ctx, x, y, this.colors[this.board[y][x] - 1]);
                }
            }
        }
        
        // 绘制当前方块
        if (this.currentPiece) {
            this.drawPiece(this.currentPiece);
        }
    }
    
    drawPiece(piece) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    this.drawBlock(this.ctx, piece.x + x, piece.y + y, piece.color);
                }
            }
        }
    }
    
    drawNextPiece() {
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (!this.nextPiece) return;
        
        const offsetX = Math.floor((4 - this.nextPiece.shape[0].length) / 2);
        const offsetY = Math.floor((4 - this.nextPiece.shape.length) / 2);
        
        for (let y = 0; y < this.nextPiece.shape.length; y++) {
            for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                if (this.nextPiece.shape[y][x]) {
                    this.nextCtx.fillStyle = this.nextPiece.color;
                    this.nextCtx.fillRect(
                        (offsetX + x) * 25, 
                        (offsetY + y) * 25, 
                        25, 
                        25
                    );
                    
                    this.nextCtx.strokeStyle = '#fff';
                    this.nextCtx.lineWidth = 1;
                    this.nextCtx.strokeRect(
                        (offsetX + x) * 25, 
                        (offsetY + y) * 25, 
                        25, 
                        25
                    );
                }
            }
        }
    }
    
    rotatePiece() {
        if (!this.currentPiece) return;
        
        const rotated = [];
        const original = this.currentPiece.shape;
        
        for (let i = 0; i < original[0].length; i++) {
            rotated[i] = [];
            for (let j = original.length - 1; j >= 0; j--) {
                rotated[i][original.length - 1 - j] = original[j][i];
            }
        }
        
        const oldShape = this.currentPiece.shape;
        this.currentPiece.shape = rotated;
        
        if (this.isCollision(this.currentPiece, this.currentPiece.x, this.currentPiece.y)) {
            this.currentPiece.shape = oldShape;
        }
    }
    
    movePiece(dx, dy) {
        if (!this.currentPiece || this.isPaused) return;
        
        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;
        
        if (!this.isCollision(this.currentPiece, newX, newY)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            return true;
        }
        
        if (dy > 0) {
            // 只有当方块不能向下移动时才锁定
            this.lockPiece();
            return false;
        }
        
        return false;
    }
    
    isCollision(piece, x, y) {
        for (let py = 0; py < piece.shape.length; py++) {
            for (let px = 0; px < piece.shape[py].length; px++) {
                if (piece.shape[py][px]) {
                    const newX = x + px;
                    const newY = y + py;
                    
                    // 检查边界
                    if (newX < 0 || newX >= this.BOARD_WIDTH || newY >= this.BOARD_HEIGHT) {
                        return true;
                    }
                    
                    // 只检查已经存在的方块（避免负索引）
                    if (newY >= 0 && newY < this.BOARD_HEIGHT && this.board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    lockPiece() {
        if (!this.currentPiece) return;
        
        // 将当前方块固定到游戏板上
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    if (boardY >= 0 && boardY < this.BOARD_HEIGHT && boardX >= 0 && boardX < this.BOARD_WIDTH) {
                        this.board[boardY][boardX] = this.currentPiece.type + 1;
                    }
                }
            }
        }
        
        this.clearLines();
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(new Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += this.calculateScore(linesCleared);
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropSpeed = Math.max(100, 1000 - (this.level - 1) * 100);
            this.updateDisplay();
        }
    }
    
    calculateScore(lines) {
        const baseScores = [0, 100, 300, 500, 800];
        return baseScores[lines] * this.level;
    }
    
    dropPiece() {
        if (!this.movePiece(0, 1)) {
            this.lockPiece();
            this.generateNewPiece();
        }
    }
    
    hardDrop() {
        while (this.movePiece(0, 1)) {
            this.score += 2;
        }
        this.updateDisplay();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning) return;
            
            switch (e.code) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.dropPiece();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.rotatePiece();
                    break;
                case 'Space':
                    e.preventDefault();
                    this.togglePause();
                    break;
            }
        });
    }
    
    startGame() {
        this.gameRunning = true;
        this.isPaused = false;
        this.updateDisplay();
    }
    
    stopGame() {
        this.gameRunning = false;
        this.isPaused = true;
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.isPaused = !this.isPaused;
        const overlay = document.getElementById('gameOverlay');
        const title = document.getElementById('overlayTitle');
        const message = document.getElementById('overlayMessage');
        
        if (this.isPaused) {
            overlay.classList.add('active');
            title.textContent = '游戏暂停';
            message.textContent = '按空格键继续游戏';
        } else {
            overlay.classList.remove('active');
        }
    }
    
    gameOver() {
        this.stopGame();
        const overlay = document.getElementById('gameOverlay');
        const title = document.getElementById('overlayTitle');
        const message = document.getElementById('overlayMessage');
        
        overlay.classList.add('active');
        title.textContent = '游戏结束';
        message.textContent = `最终得分: ${this.score}`;
    }
    
    restart() {
        this.initializeBoard();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropSpeed = 1000;
        this.generateNextPiece();
        this.generateNewPiece();
        this.startGame();
        this.updateDisplay();
        
        const overlay = document.getElementById('gameOverlay');
        overlay.classList.remove('active');
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
    
    gameLoop() {
        const now = Date.now();
        
        if (this.gameRunning && !this.isPaused) {
            if (now - this.lastDropTime > this.dropSpeed) {
                this.dropPiece();
                this.lastDropTime = now;
            }
            
            this.drawBoard();
            this.drawNextPiece();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

let game;

window.addEventListener('load', () => {
    game = new TetrisGame();
});

function togglePause() {
    if (game) {
        game.togglePause();
    }
}

function restartGame() {
    if (game) {
        game.restart();
    }
}