class Tetris {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        // 游戏配置
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 30;
        
        // 游戏状态
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.dropTime = 0;
        this.dropInterval = 1000; // 毫秒
        
        // 方块定义
        this.pieces = {
            'I': {
                shape: [
                    [1, 1, 1, 1]
                ],
                color: '#00f5ff'
            },
            'O': {
                shape: [
                    [1, 1],
                    [1, 1]
                ],
                color: '#ffff00'
            },
            'T': {
                shape: [
                    [0, 1, 0],
                    [1, 1, 1]
                ],
                color: '#a000ff'
            },
            'S': {
                shape: [
                    [0, 1, 1],
                    [1, 1, 0]
                ],
                color: '#00ff00'
            },
            'Z': {
                shape: [
                    [1, 1, 0],
                    [0, 1, 1]
                ],
                color: '#ff0000'
            },
            'J': {
                shape: [
                    [1, 0, 0],
                    [1, 1, 1]
                ],
                color: '#0000ff'
            },
            'L': {
                shape: [
                    [0, 0, 1],
                    [1, 1, 1]
                ],
                color: '#ff8c00'
            }
        };
        
        this.init();
    }
    
    init() {
        this.initBoard();
        this.bindEvents();
        this.generatePiece();
        this.generatePiece();
        this.updateDisplay();
        this.startGame();
    }
    
    initBoard() {
        this.board = [];
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            this.board[y] = [];
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                this.board[y][x] = 0;
            }
        }
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.newGame());
    }
    
    handleKeyPress(e) {
        if (!this.gameRunning || this.gamePaused) return;
        
        switch(e.keyCode) {
            case 37: // Left
                this.movePiece(-1, 0);
                break;
            case 39: // Right
                this.movePiece(1, 0);
                break;
            case 40: // Down
                this.movePiece(0, 1);
                break;
            case 38: // Up (Rotate)
                this.rotatePiece();
                break;
            case 32: // Space (Pause)
                e.preventDefault();
                this.togglePause();
                break;
        }
    }
    
    generatePiece() {
        const pieceTypes = Object.keys(this.pieces);
        const randomType = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
        const piece = {
            type: randomType,
            shape: this.pieces[randomType].shape,
            color: this.pieces[randomType].color,
            x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(this.pieces[randomType].shape[0].length / 2),
            y: 0
        };
        
        if (this.currentPiece === null) {
            this.currentPiece = piece;
        } else {
            this.nextPiece = piece;
        }
    }
    
    movePiece(dx, dy) {
        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;
        
        if (this.isValidPosition(this.currentPiece.shape, newX, newY)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            return true;
        }
        return false;
    }
    
    rotatePiece() {
        const rotated = this.rotateMatrix(this.currentPiece.shape);
        if (this.isValidPosition(rotated, this.currentPiece.x, this.currentPiece.y)) {
            this.currentPiece.shape = rotated;
        }
    }
    
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = [];
        
        for (let i = 0; i < cols; i++) {
            rotated[i] = [];
            for (let j = 0; j < rows; j++) {
                rotated[i][j] = matrix[rows - 1 - j][i];
            }
        }
        return rotated;
    }
    
    isValidPosition(shape, x, y) {
        for (let py = 0; py < shape.length; py++) {
            for (let px = 0; px < shape[py].length; px++) {
                if (shape[py][px]) {
                    const newX = x + px;
                    const newY = y + py;
                    
                    if (newX < 0 || newX >= this.BOARD_WIDTH || 
                        newY >= this.BOARD_HEIGHT || 
                        (newY >= 0 && this.board[newY][newX])) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    placePiece() {
        for (let py = 0; py < this.currentPiece.shape.length; py++) {
            for (let px = 0; px < this.currentPiece.shape[py].length; px++) {
                if (this.currentPiece.shape[py][px]) {
                    const boardX = this.currentPiece.x + px;
                    const boardY = this.currentPiece.y + py;
                    
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        // 检查游戏结束
        if (this.currentPiece.y <= 0) {
            this.gameOver();
            return;
        }
        
        // 检查消除行
        this.clearLines();
        
        // 生成新方块
        this.currentPiece = this.nextPiece;
        this.generatePiece();
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(new Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                y++; // 重新检查同一行
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += this.calculateScore(linesCleared);
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            this.updateDisplay();
        }
    }
    
    calculateScore(lines) {
        const baseScore = [0, 100, 300, 500, 800];
        return baseScore[lines] * this.level;
    }
    
    update(deltaTime) {
        if (!this.gameRunning || this.gamePaused) return;
        
        this.dropTime += deltaTime;
        
        if (this.dropTime >= this.dropInterval) {
            if (!this.movePiece(0, 1)) {
                this.placePiece();
            }
            this.dropTime = 0;
        }
    }
    
    render() {
        // 清空画布
        this.ctx.fillStyle = '#1a202c';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格
        this.drawGrid();
        
        // 绘制已放置的方块
        this.drawBoard();
        
        // 绘制当前方块
        if (this.currentPiece) {
            this.drawPiece(this.currentPiece, this.ctx);
        }
        
        // 绘制下一个方块
        this.drawNextPiece();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#2d3748';
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
    }
    
    drawBoard() {
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, this.board[y][x], this.ctx);
                }
            }
        }
    }
    
    drawPiece(piece, context) {
        for (let py = 0; py < piece.shape.length; py++) {
            for (let px = 0; px < piece.shape[py].length; px++) {
                if (piece.shape[py][px]) {
                    this.drawBlock(piece.x + px, piece.y + py, piece.color, context);
                }
            }
        }
    }
    
    drawBlock(x, y, color, context) {
        const pixelX = x * this.BLOCK_SIZE;
        const pixelY = y * this.BLOCK_SIZE;
        
        // 主色块
        context.fillStyle = color;
        context.fillRect(pixelX, pixelY, this.BLOCK_SIZE, this.BLOCK_SIZE);
        
        // 高光效果
        context.fillStyle = this.lightenColor(color, 0.3);
        context.fillRect(pixelX, pixelY, this.BLOCK_SIZE - 2, 4);
        context.fillRect(pixelX, pixelY, 4, this.BLOCK_SIZE - 2);
        
        // 阴影效果
        context.fillStyle = this.darkenColor(color, 0.3);
        context.fillRect(pixelX + this.BLOCK_SIZE - 4, pixelY + 4, 4, this.BLOCK_SIZE - 4);
        context.fillRect(pixelX + 4, pixelY + this.BLOCK_SIZE - 4, this.BLOCK_SIZE - 4, 4);
        
        // 边框
        context.strokeStyle = '#000';
        context.lineWidth = 1;
        context.strokeRect(pixelX, pixelY, this.BLOCK_SIZE, this.BLOCK_SIZE);
    }
    
    drawNextPiece() {
        this.nextCtx.fillStyle = '#1a202c';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (this.nextPiece) {
            const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * this.BLOCK_SIZE) / 2;
            const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * this.BLOCK_SIZE) / 2;
            
            for (let py = 0; py < this.nextPiece.shape.length; py++) {
                for (let px = 0; px < this.nextPiece.shape[py].length; px++) {
                    if (this.nextPiece.shape[py][px]) {
                        const pixelX = offsetX + px * this.BLOCK_SIZE;
                        const pixelY = offsetY + py * this.BLOCK_SIZE;
                        
                        this.nextCtx.fillStyle = this.nextPiece.color;
                        this.nextCtx.fillRect(pixelX, pixelY, this.BLOCK_SIZE, this.BLOCK_SIZE);
                        
                        this.nextCtx.strokeStyle = '#000';
                        this.nextCtx.lineWidth = 1;
                        this.nextCtx.strokeRect(pixelX, pixelY, this.BLOCK_SIZE, this.BLOCK_SIZE);
                    }
                }
            }
        }
    }
    
    lightenColor(color, amount) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * amount * 100);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    darkenColor(color, amount) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * amount * 100);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
            (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
            (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
    
    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        document.getElementById('pauseBtn').textContent = '暂停';
        this.gameLoop();
    }
    
    gameLoop() {
        let lastTime = 0;
        
        const loop = (currentTime) => {
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;
            
            this.update(deltaTime);
            this.render();
            
            if (this.gameRunning) {
                requestAnimationFrame(loop);
            }
        };
        
        requestAnimationFrame(loop);
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        document.getElementById('pauseBtn').textContent = this.gamePaused ? '继续' : '暂停';
        
        if (!this.gamePaused) {
            this.gameLoop();
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').classList.remove('hidden');
    }
    
    newGame() {
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropTime = 0;
        this.dropInterval = 1000;
        this.currentPiece = null;
        this.nextPiece = null;
        
        document.getElementById('gameOver').classList.add('hidden');
        
        this.initBoard();
        this.generatePiece();
        this.generatePiece();
        this.updateDisplay();
        this.startGame();
    }
}

// 游戏启动
document.addEventListener('DOMContentLoaded', () => {
    new Tetris();
});