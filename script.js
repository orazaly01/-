(function(){
    // -------- НАСТРОЙКИ --------
    const COLS = 10;
    const ROWS = 20;
    const CELL_SIZE = 30;
    
    const canvas = document.getElementById('boardCanvas');
    const ctx = canvas.getContext('2d');
    const nextCanvas = document.getElementById('nextCanvas');
    const nextCtx = nextCanvas.getContext('2d');
    
    // Фигуры
    const SHAPES = [
        { shape: [[1,1,1,1]], color: '#00e5f0' },
        { shape: [[1,1],[1,1]], color: '#f9e45b' },
        { shape: [[0,1,0],[1,1,1]], color: '#c569de' },
        { shape: [[0,1,1],[1,1,0]], color: '#5fdc7a' },
        { shape: [[1,1,0],[0,1,1]], color: '#e34d4d' },
        { shape: [[1,0,0],[1,1,1]], color: '#f0a35e' },
        { shape: [[0,0,1],[1,1,1]], color: '#5b8cff' }
    ];
    
    let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    let currentPiece = null;
    let nextPiece = null;
    let score = 0;
    let level = 1;
    let gameLoop = null;
    let gameActive = true;
    
    // DOM элементы
    const scoreSpan = document.getElementById('score');
    const levelSpan = document.getElementById('level');
    const resetBtn = document.getElementById('resetButton');
    const gameStatusDiv = document.getElementById('gameStatus');
    
    // ---- ФУНКЦИИ ----
    function randomPiece() {
        const idx = Math.floor(Math.random() * SHAPES.length);
        const original = SHAPES[idx];
        return {
            shape: original.shape.map(row => [...row]),
            color: original.color
        };
    }
    
    function collision(shape, offsetX, offsetY) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[0].length; col++) {
                if (shape[row][col] !== 0) {
                    const boardX = offsetX + col;
                    const boardY = offsetY + row;
                    if (boardX < 0 || boardX >= COLS || boardY >= ROWS || boardY < 0) return true;
                    if (boardY >= 0 && board[boardY][boardX] !== 0) return true;
                }
            }
        }
        return false;
    }
    
    function spawnNewPiece() {
        if (!nextPiece) nextPiece = randomPiece();
        currentPiece = {
            shape: nextPiece.shape.map(row => [...row]),
            color: nextPiece.color,
            x: Math.floor((COLS - nextPiece.shape[0].length) / 2),
            y: 0
        };
        nextPiece = randomPiece();
        
        if (collision(currentPiece.shape, currentPiece.x, currentPiece.y)) {
            gameActive = false;
            if (gameLoop) clearInterval(gameLoop);
            gameStatusDiv.innerText = '💀 ИГРА ОКОНЧЕНА 💀';
            gameStatusDiv.style.color = "#e74c3c";
            drawBoard();
            return false;
        }
        gameActive = true;
        gameStatusDiv.innerText = '🎮 В ИГРЕ';
        gameStatusDiv.style.color = "#2ecc71";
        drawBoard();
        return true;
    }
    
    function mergePiece() {
        if (!currentPiece) return;
        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[0].length; col++) {
                if (currentPiece.shape[row][col] !== 0) {
                    const boardX = currentPiece.x + col;
                    const boardY = currentPiece.y + row;
                    if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                        board[boardY][boardX] = currentPiece.color;
                    }
                }
            }
        }
        clearLines();
        const success = spawnNewPiece();
        if (!success && gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
        }
        updateScoreAndLevel();
        drawBoard();
        adjustIntervalByLevel();
    }
    
    function clearLines() {
        let linesCleared = 0;
        for (let row = ROWS-1; row >= 0; ) {
            let full = true;
            for (let col = 0; col < COLS; col++) {
                if (board[row][col] === 0) { full = false; break; }
            }
            if (full) {
                for (let r = row; r > 0; r--) board[r] = [...board[r-1]];
                board[0] = Array(COLS).fill(0);
                linesCleared++;
            } else { row--; }
        }
        
        if (linesCleared > 0) {
            const points = [0, 100, 300, 700, 1500];
            score += points[Math.min(linesCleared,4)];
            const newLevel = Math.floor(score / 500) + 1;
            if (newLevel > level) level = newLevel;
            updateScoreAndLevel();
        }
    }
    
    function updateScoreAndLevel() {
        scoreSpan.innerText = score;
        levelSpan.innerText = level;
    }
    
    function adjustIntervalByLevel() {
        if (!gameActive) return;
        let newInterval = Math.max(100, 500 - (level-1) * 35);
        newInterval = Math.min(450, newInterval);
        if (gameLoop) {
            clearInterval(gameLoop);
            gameLoop = setInterval(gameTick, newInterval);
        }
    }
    
    function gameTick() {
        if (!gameActive || !currentPiece) return;
        currentPiece.y++;
        if (collision(currentPiece.shape, currentPiece.x, currentPiece.y)) {
            currentPiece.y--;
            mergePiece();
        }
        drawBoard();
    }
    
    function movePiece(dx, dy) {
        if (!gameActive || !currentPiece) return false;
        currentPiece.x += dx;
        if (collision(currentPiece.shape, currentPiece.x, currentPiece.y)) {
            currentPiece.x -= dx;
            return false;
        }
        if (dy !== 0) {
            currentPiece.y += dy;
            if (collision(currentPiece.shape, currentPiece.x, currentPiece.y)) {
                currentPiece.y -= dy;
                if (dy === 1) mergePiece();
                return false;
            }
        }
        drawBoard();
        return true;
    }
    
    function rotatePiece() {
        if (!gameActive || !currentPiece) return;
        const rotated = currentPiece.shape[0].map((_, idx) => currentPiece.shape.map(row => row[idx]).reverse());
        const savedShape = currentPiece.shape;
        currentPiece.shape = rotated;
        if (collision(currentPiece.shape, currentPiece.x, currentPiece.y)) {
            currentPiece.shape = savedShape;
        }
        drawBoard();
    }
    
    function hardDrop() {
        if (!gameActive || !currentPiece) return;
        while (!collision(currentPiece.shape, currentPiece.x, currentPiece.y+1)) currentPiece.y++;
        mergePiece();
        drawBoard();
    }
    
    function drawBoard() {
        canvas.width = 300;
        canvas.height = 600;
        nextCanvas.width = 120;
        nextCanvas.height = 120;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const color = board[row][col];
                const x = col * CELL_SIZE;
                const y = row * CELL_SIZE;
                if (color !== 0) {
                    ctx.fillStyle = color;
                    ctx.fillRect(x, y, CELL_SIZE-0.5, CELL_SIZE-0.5);
                    ctx.fillStyle = 'rgba(255,255,240,0.3)';
                    ctx.fillRect(x+2, y+2, CELL_SIZE-4, CELL_SIZE-4);
                } else {
                    ctx.strokeStyle = '#1e3a4d';
                    ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
                }
            }
        }
        
        if (currentPiece && gameActive) {
            for (let row = 0; row < currentPiece.shape.length; row++) {
                for (let col = 0; col < currentPiece.shape[0].length; col++) {
                    if (currentPiece.shape[row][col]) {
                        const x = (currentPiece.x + col) * CELL_SIZE;
                        const y = (currentPiece.y + row) * CELL_SIZE;
                        ctx.fillStyle = currentPiece.color;
                        ctx.fillRect(x, y, CELL_SIZE-0.5, CELL_SIZE-0.5);
                        ctx.fillStyle = 'rgba(255,255,200,0.5)';
                        ctx.fillRect(x+2, y+2, CELL_SIZE-4, CELL_SIZE-4);
                    }
                }
            }
        }
        
        nextCtx.clearRect(0, 0, 120, 120);
        if (nextPiece) {
            const shape = nextPiece.shape;
            const blockW = 30;
            const shapeCols = shape[0].length;
            const shapeRows = shape.length;
            const offsetX = (120 - (shapeCols * blockW)) / 2;
            const offsetY = (120 - (shapeRows * blockW)) / 2;
            for (let row = 0; row < shapeRows; row++) {
                for (let col = 0; col < shapeCols; col++) {
                    if (shape[row][col]) {
                        nextCtx.fillStyle = nextPiece.color;
                        nextCtx.fillRect(offsetX + col*blockW, offsetY + row*blockW, blockW-1, blockW-1);
                        nextCtx.fillStyle = '#ffffff66';
                        nextCtx.fillRect(offsetX + col*blockW+2, offsetY + row*blockW+2, blockW-5, blockW-5);
                    }
                }
            }
        }
    }
    
    function resetGame() {
        if (gameLoop) clearInterval(gameLoop);
        board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        score = 0;
        level = 1;
        gameActive = true;
        updateScoreAndLevel();
        nextPiece = randomPiece();
        spawnNewPiece();
        if (gameLoop) clearInterval(gameLoop);
        gameLoop = setInterval(gameTick, 500);
        drawBoard();
        gameStatusDiv.innerText = '🎮 В ИГРЕ';
        gameStatusDiv.style.color = "#2ecc71";
    }
    
    function handleKey(e) {
        if (!gameActive && e.code !== 'KeyR') return;
        const key = e.code;
        e.preventDefault();
        switch(key) {
            case 'ArrowLeft': movePiece(-1, 0); break;
            case 'ArrowRight': movePiece(1, 0); break;
            case 'ArrowDown': movePiece(0, 1); break;
            case 'ArrowUp': rotatePiece(); break;
            case 'Space': hardDrop(); break;
            case 'KeyR': resetGame(); break;
        }
    }
    
    // Привязка телефонных кнопок
    function bindTouchButtons() {
        const btnLeft = document.getElementById('btnLeft');
        const btnRight = document.getElementById('btnRight');
        const btnDown = document.getElementById('btnDown');
        const btnRotate = document.getElementById('btnRotate');
        const btnDrop = document.getElementById('btnDrop');
        
        if (btnLeft) btnLeft.addEventListener('click', (e) => { e.preventDefault(); movePiece(-1, 0); });
        if (btnRight) btnRight.addEventListener('click', (e) => { e.preventDefault(); movePiece(1, 0); });
        if (btnDown) btnDown.addEventListener('click', (e) => { e.preventDefault(); movePiece(0, 1); });
        if (btnRotate) btnRotate.addEventListener('click', (e) => { e.preventDefault(); rotatePiece(); });
        if (btnDrop) btnDrop.addEventListener('click', (e) => { e.preventDefault(); hardDrop(); });
    }
    
    function init() {
        resetGame();
        window.addEventListener('keydown', handleKey);
        resetBtn.addEventListener('click', () => resetGame());
        bindTouchButtons();
        
        // Для телефона: предотвращаем масштабирование при двойном тапе
        document.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                btn.click();
            }, { passive: false });
        });
    }
    
    init();
})();
