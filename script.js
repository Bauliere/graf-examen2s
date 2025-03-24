window.onload = function () {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;

    // Game variables
    const playerImage = new Image();
    playerImage.src = 'assets/img/flutter.png';
    const playerWidth = 64;
    const playerHeight = 58;
    let playerX = canvas.width / 2 - playerWidth / 2;
    let playerY = canvas.height / 2 - playerHeight / 2;
    let lastDirection = 'right';
    let isFlipped = false;
    let killCount = 0;
    const killCounter = document.getElementById('kill-counter');
    let gameActive = true;
    const gameOverScreen = document.getElementById('gameOver');
    const gameOverImage = new Image();
    gameOverImage.src = 'assets/img/gameover.png';

    //music
    const bgMusic = document.getElementById('bgMusic');
    let musicPlaying = false;

    // Crosshair variables
    const crosshairImage = new Image();
    crosshairImage.src = 'assets/img/crosshair.png';
    const crosshairSize = 24;
    let mouseX = canvas.width / 2;
    let mouseY = canvas.height / 2;

    // Enemy variables
    const zombieImage = new Image();
    zombieImage.src = 'assets/img/zombi.png';
    const deadImage = new Image();
    deadImage.src = 'assets/img/dead.png';
    const enemySize = 64;
    let enemies = [];
    let deadEnemies = [];
    let spawnTimer = 0;

    // spaw rates
    const minSpawnInterval = 100; // Minimum 0.5 seconds between spawns
    const maxSpawnInterval = 2000; // Initial 2 seconds between spawns
    let spawnInterval = maxSpawnInterval;
    let difficultyTimer = 0;
    const difficultyInterval = 200; // Increase difficulty every 2 seconds

    // Background image
    const bgImage = new Image();
    bgImage.src = 'assets/img/bg.png';

    // Key states
    const keys = {
        w: false,
        a: false,
        s: false,
        d: false
    };

    function keyDownHandler(e) {
        if (keys.hasOwnProperty(e.key)) {
            keys[e.key] = true;
            // ... rest of your keydown logic
        }
    }

    function keyUpHandler(e) {
        if (keys.hasOwnProperty(e.key)) {
            keys[e.key] = false;
        }
    }

    // Update your event listeners to use these functions
    window.addEventListener('keydown', keyDownHandler);
    window.addEventListener('keyup', keyUpHandler);

    // Event listeners
    window.addEventListener('keydown', function (e) {
        if (keys.hasOwnProperty(e.key)) {
            keys[e.key] = true;

            if (e.key === 'a' || e.key === 'd') {
                if ((e.key === 'a' && lastDirection !== 'left') ||
                    (e.key === 'd' && lastDirection !== 'right')) {
                    isFlipped = !isFlipped;
                }
                lastDirection = e.key === 'a' ? 'left' : 'right';
            }
        }
    });

    window.addEventListener('keyup', function (e) {
        if (keys.hasOwnProperty(e.key)) {
            keys[e.key] = false;
        }
    });

    canvas.addEventListener('mousemove', function (e) {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });

    canvas.addEventListener('click', function (e) {
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Check if clicked on an enemy
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if (clickX > enemy.x && clickX < enemy.x + enemySize &&
                clickY > enemy.y && clickY < enemy.y + enemySize) {

                // Add to dead enemies (for death animation)
                deadEnemies.push({
                    x: enemy.x,
                    y: enemy.y,
                    timer: 30 // frames to show death animation
                });

                // Remove from active enemies
                enemies.splice(i, 1);
                killCount++;
                killCounter.textContent = `Kills: ${killCount}`;
                killCounter.classList.add('flash');
                setTimeout(() => killCounter.classList.remove('flash'), 300);
                break;
            }
        }
    });

    // play music
    function toggleMusic() {
        const musicToggle = document.getElementById('musicToggle');
        if (musicPlaying) {
            bgMusic.pause();
            musicToggle.textContent = '🔇';
        } else {
            bgMusic.play().catch(e => console.log("Audio play failed:", e));
            musicToggle.textContent = '🔊';
        }
        musicPlaying = !musicPlaying;
    }

    // Function to spawn enemies
    function spawnEnemy() {
        const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        let x, y;

        switch (side) {
            case 0: // top
                x = Math.random() * (canvas.width - enemySize);
                y = -enemySize;
                break;
            case 1: // right
                x = canvas.width;
                y = Math.random() * (canvas.height - enemySize);
                break;
            case 2: // bottom
                x = Math.random() * (canvas.width - enemySize);
                y = canvas.height;
                break;
            case 3: // left
                x = -enemySize;
                y = Math.random() * (canvas.height - enemySize);
                break;
        }

        enemies.push({
            x: x,
            y: y,
            speed: 1 + Math.random() * 2 // Random speed between 1-3
        });
    }

    // Function to draw flipped image
    function drawPlayerImage() {
        if (!playerImage.complete) return;

        ctx.save();
        if (isFlipped == 0) {
            ctx.translate(playerX + playerWidth, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(playerImage, 0, playerY, playerWidth, playerHeight);
        } else {
            ctx.drawImage(playerImage, playerX, playerY, playerWidth, playerHeight);
        }
        ctx.restore();
    }

    function checkCollisions() {
        if (!gameActive) return;

        const playerCenterX = playerX + playerWidth / 2;
        const playerCenterY = playerY + playerHeight / 2;
        const playerRadius = Math.min(playerWidth, playerHeight) / 2;

        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            const enemyCenterX = enemy.x + enemySize / 2;
            const enemyCenterY = enemy.y + enemySize / 2;
            const enemyRadius = enemySize / 2;

            // Simple circle collision detection
            const dx = playerCenterX - enemyCenterX;
            const dy = playerCenterY - enemyCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < playerRadius + enemyRadius) {
                endGame();
                break;
            }
        }
    }

    function endGame() {
        gameActive = false;
        gameOverScreen.style.display = 'flex';
        bgMusic.pause();

        // Disable all controls
        document.removeEventListener('keydown', keyDownHandler);
        document.removeEventListener('keyup', keyUpHandler);
        canvas.style.pointerEvents = 'none';

        // Optional: Add click to restart functionality
        gameOverScreen.addEventListener('click', function () {
            location.reload();
        });
    }

    // Game loop
    function gameLoop() {

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!gameActive) return;

        checkCollisions();

        difficultyTimer++;
        if (difficultyTimer >= difficultyInterval) {
            difficultyTimer = 0;
            // Gradually decrease spawn interval (increase spawn rate)
            spawnInterval = Math.max(minSpawnInterval, spawnInterval - 100);
            console.log("Increased difficulty! New spawn interval:", spawnInterval);
        }

        spawnTimer++;
        if (spawnTimer >= spawnInterval) {
            spawnEnemy();
            spawnTimer = 0;
        }

        // Draw background
        if (bgImage.complete) {
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        }

        // Move player
        const speed = 5;
        if (keys.w && playerY > 0) playerY -= speed;
        if (keys.s && playerY < canvas.height - playerHeight) playerY += speed;
        if (keys.a && playerX > 0) playerX -= speed;
        if (keys.d && playerX < canvas.width - playerWidth) playerX += speed;

        // Draw player
        drawPlayerImage();

        // Spawn enemies
        spawnTimer++;
        if (spawnTimer >= spawnInterval) {
            spawnEnemy();
            spawnTimer = 0;
        }

        // Move and draw enemies
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];

            // Move toward player
            const dx = (playerX + playerWidth / 2) - (enemy.x + enemySize / 2);
            const dy = (playerY + playerHeight / 2) - (enemy.y + enemySize / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;
            }

            // Draw enemy
            if (zombieImage.complete) {
                ctx.drawImage(zombieImage, enemy.x, enemy.y, enemySize, enemySize);
            }
        }

        // Draw dead enemies (death animation)
        for (let i = 0; i < deadEnemies.length; i++) {
            const dead = deadEnemies[i];

            if (deadImage.complete) {
                ctx.drawImage(deadImage, dead.x, dead.y, enemySize, 48);
            }

            dead.timer--;
            if (dead.timer <= 0) {
                deadEnemies.splice(i, 1);
                i--;
            }
        }

        // Draw connecting line (dotted red)
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.moveTo(playerX + playerWidth / 2, playerY + playerHeight / 2);
        ctx.lineTo(mouseX, mouseY);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw crosshair
        if (crosshairImage.complete) {
            ctx.drawImage(
                crosshairImage,
                mouseX - crosshairSize / 2,
                mouseY - crosshairSize / 2,
                crosshairSize,
                crosshairSize
            );
        }

        requestAnimationFrame(gameLoop);
    }

    // Handle window resize
    window.addEventListener('resize', function () {
        canvas.width = window.innerWidth * 0.8;
        canvas.height = window.innerHeight * 0.8;
        playerX = canvas.width / 2 - playerWidth / 2;
        playerY = canvas.height / 2 - playerHeight / 2;
    });

    // Create music toggle button
    const musicToggle = document.createElement('div');
    musicToggle.id = 'musicToggle';
    musicToggle.textContent = '🔊';
    musicToggle.addEventListener('click', toggleMusic);
    document.body.appendChild(musicToggle);

    // Enable music when user interacts (due to browser autoplay policies)
    document.addEventListener('click', function enableMusic() {
        if (!musicPlaying) {
            toggleMusic();
        }
        document.removeEventListener('click', enableMusic);
    }, { once: true });

    // Start with music off by default
    toggleMusic();
    // Start the game loop
    gameLoop();
};