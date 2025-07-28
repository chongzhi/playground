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
        this.detectMobile();
        this.bindEvents();
        this.generatePiece();
        this.generatePiece();
        this.updateDisplay();
        this.startGame();
    }
    
    detectMobile() {
        // 检测是否为移动设备或小屏幕
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth <= 768 || window.innerHeight <= 600;
        
        const shouldShowControls = isMobile || hasTouch || isSmallScreen;
        
        const mobileControls = document.querySelector('.mobile-controls');
        const bottomControls = document.querySelector('.bottom-controls');
        
        if (mobileControls) {
            if (shouldShowControls) {
                mobileControls.classList.add('show');
                if (bottomControls) bottomControls.classList.add('has-mobile-controls');
                console.log('Mobile/touch device or small screen detected, showing touch controls');
            } else {
                if (bottomControls) bottomControls.classList.remove('has-mobile-controls');
                console.log('Desktop device detected, hiding touch controls (use toggle button to show)');
            }
        }
    }
    
    toggleMobileControls() {
        const mobileControls = document.querySelector('.mobile-controls');
        const bottomControls = document.querySelector('.bottom-controls');
        
        if (mobileControls) {
            mobileControls.classList.toggle('show');
            const isVisible = mobileControls.classList.contains('show');
            
            // 同步调整底部控制区域的布局
            if (bottomControls) {
                if (isVisible) {
                    bottomControls.classList.add('has-mobile-controls');
                } else {
                    bottomControls.classList.remove('has-mobile-controls');
                }
            }
            
            console.log(`Mobile controls ${isVisible ? 'shown' : 'hidden'}`);
        }
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
        document.getElementById('toggleMobileBtn').addEventListener('click', () => this.toggleMobileControls());
        
        // 移动端按钮事件
        this.bindMobileEvents();
    }
    
    bindMobileEvents() {
        // 长按和重复动作的状态
        this.isDownPressed = false;
        this.downInterval = null;
        
        // 获取移动端按钮元素
        const mobileLeftBtn = document.getElementById('mobileLeftBtn');
        const mobileRightBtn = document.getElementById('mobileRightBtn');
        const mobileDownBtn = document.getElementById('mobileDownBtn');
        const mobileRotateBtn = document.getElementById('mobileRotateBtn');
        const mobilePauseBtn = document.getElementById('mobilePauseBtn');
        
        // 检查元素是否存在
        if (!mobileLeftBtn || !mobileRightBtn || !mobileDownBtn || !mobileRotateBtn || !mobilePauseBtn) {
            console.warn('Mobile control buttons not found');
            return;
        }
        
        // 左移按钮
        mobileLeftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Mobile left button touched');
            this.addButtonFeedback(mobileLeftBtn);
            if (!this.gameRunning || this.gamePaused) return;
            this.movePiece(-1, 0);
        });
        
        mobileLeftBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Mobile left button clicked');
            this.addButtonFeedback(mobileLeftBtn);
            if (!this.gameRunning || this.gamePaused) return;
            this.movePiece(-1, 0);
        });
        
        // 右移按钮
        mobileRightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Mobile right button touched');
            this.addButtonFeedback(mobileRightBtn);
            if (!this.gameRunning || this.gamePaused) return;
            this.movePiece(1, 0);
        });
        
        mobileRightBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Mobile right button clicked');
            this.addButtonFeedback(mobileRightBtn);
            if (!this.gameRunning || this.gamePaused) return;
            this.movePiece(1, 0);
        });
        
        // 下降按钮（支持长按）
        mobileDownBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Mobile down button touched');
            this.addButtonFeedback(mobileDownBtn);
            if (!this.gameRunning || this.gamePaused) return;
            
            this.isDownPressed = true;
            this.movePiece(0, 1);
            
            // 开始长按重复下降
            this.downInterval = setInterval(() => {
                if (this.isDownPressed && this.gameRunning && !this.gamePaused) {
                    this.movePiece(0, 1);
                }
            }, 100);
        });
        
        mobileDownBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.isDownPressed = false;
            if (this.downInterval) {
                clearInterval(this.downInterval);
                this.downInterval = null;
            }
        });
        
        mobileDownBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Mobile down button clicked');
            this.addButtonFeedback(mobileDownBtn);
            if (!this.gameRunning || this.gamePaused) return;
            this.movePiece(0, 1);
        });
        
        // 旋转按钮
        mobileRotateBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Mobile rotate button touched');
            this.addButtonFeedback(mobileRotateBtn);
            if (!this.gameRunning || this.gamePaused) return;
            this.rotatePiece();
        });
        
        mobileRotateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Mobile rotate button clicked');
            this.addButtonFeedback(mobileRotateBtn);
            if (!this.gameRunning || this.gamePaused) return;
            this.rotatePiece();
        });
        
        // 移动端暂停按钮
        mobilePauseBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Mobile pause button touched');
            this.addButtonFeedback(mobilePauseBtn);
            this.togglePause();
        });
        
        mobilePauseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Mobile pause button clicked');
            this.addButtonFeedback(mobilePauseBtn);
            this.togglePause();
        });
        
        // 添加touchend事件防止意外行为
        [mobileLeftBtn, mobileRightBtn, mobileRotateBtn].forEach(btn => {
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });
        
        console.log('Mobile events bound successfully');
    }
    
    addButtonFeedback(button) {
        // 添加视觉反馈
        button.style.transform = 'scale(0.9)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
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
            // 为下一个方块预览使用适当的块大小
            const previewBlockSize = this.nextCanvas.width <= 100 ? 18 : this.nextCanvas.width <= 120 ? 22 : 25;
            const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * previewBlockSize) / 2;
            const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * previewBlockSize) / 2;
            
            for (let py = 0; py < this.nextPiece.shape.length; py++) {
                for (let px = 0; px < this.nextPiece.shape[py].length; px++) {
                    if (this.nextPiece.shape[py][px]) {
                        const pixelX = offsetX + px * previewBlockSize;
                        const pixelY = offsetY + py * previewBlockSize;
                        
                        this.nextCtx.fillStyle = this.nextPiece.color;
                        this.nextCtx.fillRect(pixelX, pixelY, previewBlockSize, previewBlockSize);
                        
                        this.nextCtx.strokeStyle = '#000';
                        this.nextCtx.lineWidth = 1;
                        this.nextCtx.strokeRect(pixelX, pixelY, previewBlockSize, previewBlockSize);
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
        
        const mobilePauseBtn = document.getElementById('mobilePauseBtn');
        if (mobilePauseBtn) {
            mobilePauseBtn.textContent = '⏸';
        }
        
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
        
        // 更新桌面端暂停按钮
        document.getElementById('pauseBtn').textContent = this.gamePaused ? '继续' : '暂停';
        
        // 更新移动端暂停按钮
        const mobilePauseBtn = document.getElementById('mobilePauseBtn');
        if (mobilePauseBtn) {
            mobilePauseBtn.textContent = this.gamePaused ? '▶' : '⏸';
        }
        
        if (!this.gamePaused) {
            this.gameLoop();
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        
        // 清除移动端长按状态
        this.isDownPressed = false;
        if (this.downInterval) {
            clearInterval(this.downInterval);
            this.downInterval = null;
        }
        
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