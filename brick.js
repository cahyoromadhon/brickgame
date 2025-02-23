const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startMenu = document.getElementById("startMenu");
const gameOverMenu = document.getElementById("gameOverMenu");
const levelCompleteMenu = document.getElementById("levelCompleteMenu");
const creditsMenu = document.getElementById("creditsMenu");
const pauseMenu = document.getElementById("pauseMenu");
const pauseOverlay = document.getElementById("pauseOverlay");
const easyButton = document.getElementById("easyButton");
const replayButton = document.getElementById("replayButton");
const mainMenuButton = document.getElementById("mainMenuButton");
const nextLevelButton = document.getElementById("nextLevelButton");
const replayLevelButton = document.getElementById("replayLevelButton");
const creditsMainMenuButton = document.getElementById("creditsMainMenuButton");
const continueButton = document.getElementById("continueButton");
const restartLevelButton = document.getElementById("restartLevelButton");
const pauseMainMenuButton = document.getElementById("pauseMainMenuButton");

function setCanvasSize() {
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    canvas.width = Math.min(480, window.innerWidth - 20);
    canvas.height = canvas.width * 1.5;
  } else {
    canvas.width = 600;
    canvas.height = 800;
  }
  canvas.style.maxWidth = '100%';
  canvas.style.height = 'auto';
}

setCanvasSize();
window.addEventListener('resize', () => {
  setCanvasSize();
  resetGame(currentLevel);
});

const BALL_SPEED = 12;
let currentLevel = 1;

let balls = [{
  x: canvas.width / 2,
  y: canvas.height / 2 + 100,
  dx: BALL_SPEED,
  dy: -BALL_SPEED,
  radius: 10
}];

const paddle = {
  height: 10,
  width: 120,
  x: (canvas.width - 120) / 2,
  y: canvas.height - 150
};

const brick = {
  width: 50,
  height: 15,
  padding: 15,
  offsetTop: 100,
  offsetLeft: 30
};

const obstacle = {
  width: 100,
  height: 10,
  x: (canvas.width - 100) / 2,
  y: 300,
  dx: 3,
};

let rightPressed = false;
let leftPressed = false;
let score = 0;
let lives = 3;
let gameRunning = false;
let gamePaused = false;
let bricks = [];
let touchX = null;
let totalBricks = 0;

let powerUp = {
  x: canvas.width / 2,
  y: 400,
  radius: 15,
  active: false
};

function initializeGameElements(level) {
  balls = [{
    x: canvas.width / 2,
    y: canvas.height / 2 + 100,
    dx: BALL_SPEED,
    dy: -BALL_SPEED,
    radius: 10
  }];
  paddle.x = (canvas.width - paddle.width) / 2;
  paddle.y = canvas.height - 150;
  if (level === 1) {
    obstacle.y = 300;
  } else if (level === 2) {
    obstacle.y = 500;
  }
  obstacle.x = canvas.width / 2 - obstacle.width / 2;
  resetBricks(level);
  powerUp.active = false;
}

function activatePowerUp() {
  if (currentLevel === 2) {
    powerUp.x = canvas.width / 2;
    powerUp.y = 400;
    powerUp.active = true;
  }
}

function createBricks(level) {
  bricks = [];
  if (level === 1) {
    const pyramidHeight = 4;
    for (let level = 0; level < pyramidHeight; level++) {
      bricks[level] = [];
      const bricksInRow = pyramidHeight - level;
      const totalWidth = bricksInRow * (brick.width + brick.padding) - brick.padding;
      const startX = (canvas.width - totalWidth) / 2;
      for (let i = 0; i < bricksInRow; i++) {
        bricks[level][i] = { x: 0, y: 0, status: 1 };
        bricks[level][i].x = startX + (i * (brick.width + brick.padding));
        bricks[level][i].y = brick.offsetTop + (level * (brick.height + brick.padding));
      }
    }
    totalBricks = 10;
  } else if (level === 2) {
    const rows = 6;
    const cols = Math.floor(canvas.width / (brick.width + brick.padding));
    for (let r = 0; r < rows; r++) {
      bricks[r] = [];
      for (let c = 0; c < cols; c++) {
        bricks[r][c] = { x: 0, y: 0, status: 1 };
        bricks[r][c].x = brick.offsetLeft + c * (brick.width + brick.padding);
        bricks[r][c].y = 50 + r * (brick.height + brick.padding);
      }
    }
    totalBricks = rows * cols;
    activatePowerUp();
  }
}

document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);
document.addEventListener("mousemove", mouseMoveHandler);
canvas.addEventListener("click", canvasClickHandler); // For burger menu click
canvas.addEventListener("touchstart", touchStartHandler);
canvas.addEventListener("touchmove", touchMoveHandler);
canvas.addEventListener("touchend", touchEndHandler);
easyButton.addEventListener("click", startGame);
replayButton.addEventListener("click", restartGame);
mainMenuButton.addEventListener("click", returnToMainMenu);
nextLevelButton.addEventListener("click", startNextLevel);
replayLevelButton.addEventListener("click", replayCurrentLevel);
creditsMainMenuButton.addEventListener("click", returnToMainMenu);
continueButton.addEventListener("click", continueGame);
restartLevelButton.addEventListener("click", restartCurrentLevel);
pauseMainMenuButton.addEventListener("click", returnToMainMenuFromPause);

function keyDownHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
  else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
  else if (e.key === "Escape") togglePause(); // Use Esc key to toggle pause (burger menu)
  else if (e.key === "p" || e.key === "P") togglePause(); // Optional: Keep 'P' key for toggle pause
}

function keyUpHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
  else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
}

function mouseMoveHandler(e) {
  if (!gamePaused) {
    const relativeX = e.clientX - canvas.offsetLeft;
    if (relativeX > 0 && relativeX < canvas.width) paddle.x = relativeX - paddle.width / 2;
  }
}

function touchStartHandler(e) {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const x = e.touches[0].clientX - rect.left;
  const y = e.touches[0].clientY - rect.top;

  // Check if touch is on the burger menu area
  if (x > canvas.width - 30 && x < canvas.width && y > 10 && y < 40) {
    togglePause();
  } else {
    touchX = x; // Proceed with paddle movement
  }
}

function touchMoveHandler(e) {
  e.preventDefault();
  if (!gamePaused && touchX !== null) {
    const newTouchX = e.touches[0].clientX - canvas.offsetLeft;
    const deltaX = newTouchX - touchX;
    paddle.x += deltaX * 1.5;
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
    touchX = newTouchX;
  }
}

function touchEndHandler(e) {
  e.preventDefault();
  touchX = null;
}

function canvasClickHandler(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Check if click is on the burger menu area (top-right corner, e.g., 30x30 pixel area)
  if (x > canvas.width - 30 && x < canvas.width && y > 10 && y < 40) {
    togglePause();
  }
}

function collisionDetection() {
  if (!gamePaused) {
    let brickHit = false;

    balls.forEach((ball, index) => {
      // Bricks
      for (let level = 0; level < bricks.length; level++) {
        for (let i = 0; i < bricks[level].length; i++) {
          const b = bricks[level][i];
          if (b.status === 1) {
            const nextX = ball.x + ball.dx;
            const nextY = ball.y + ball.dy;
            const brickLeft = b.x;
            const brickRight = b.x + brick.width;
            const brickTop = b.y;
            const brickBottom = b.y + brick.height;

            const closestX = Math.max(brickLeft, Math.min(nextX, brickRight));
            const closestY = Math.max(brickTop, Math.min(nextY, brickBottom));

            const distX = nextX - closestX;
            const distY = nextY - closestY;
            const distance = Math.sqrt(distX * distX + distY * distY);

            if (distance <= ball.radius) {
              const prevX = ball.x;
              const prevY = ball.y;
              if (prevY + ball.radius <= brickTop && nextY + ball.radius >= brickTop) {
                ball.dy = -ball.dy; // Hit top
              } else if (prevY - ball.radius >= brickBottom && nextY - ball.radius <= brickBottom) {
                ball.dy = -ball.dy; // Hit bottom
              } else if (prevX + ball.radius <= brickLeft && nextX + ball.radius >= brickLeft) {
                ball.dx = -ball.dx; // Hit left
              } else if (prevX - ball.radius >= brickRight && nextX - ball.radius <= brickRight) {
                ball.dx = -ball.dx; // Hit right
              } else {
                ball.dy = -ball.dy; // Default vertical bounce
              }

              b.status = 0;
              score++;
              brickHit = true;
              if (score === totalBricks) handleLevelComplete();
            }
          }
        }
      }

      // Paddle collision for all balls
      if (ball.y + ball.dy > paddle.y - ball.radius && ball.y + ball.dy < paddle.y + paddle.height + ball.radius &&
        ball.x > paddle.x - ball.radius && ball.x < paddle.x + paddle.width + ball.radius) {
        ball.dy = -ball.dy;
      }

      // Wall collisions
      if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
        ball.dx = -ball.dx;
      }
      if (ball.y + ball.dy < ball.radius) {
        ball.dy = -ball.dy;
      }

      // Ball out of bounds (lose life) only if no balls remain
      if (ball.y + ball.dy > canvas.height - ball.radius) {
        balls = balls.filter(b => b !== ball); // Remove the fallen ball
        if (balls.length === 0) { // Only lose a life if no balls remain
          lives--;
          if (lives > 0) {
            resetBall();
          } else {
            endGame(false);
          }
        }
      }

      // Obstacle collision (Level 2 only) for all balls
      if (currentLevel === 2) {
        const nextX = ball.x + ball.dx;
        const nextY = ball.y + ball.dy;
        const obsLeft = obstacle.x;
        const obsRight = obstacle.x + obstacle.width;
        const obsTop = obstacle.y;
        const obsBottom = obstacle.y + obstacle.height;

        const closestX = Math.max(obsLeft, Math.min(nextX, obsRight));
        const closestY = Math.max(obsTop, Math.min(nextY, obsBottom));

        const distX = nextX - closestX;
        const distY = nextY - closestY;
        const distance = Math.sqrt(distX * distX + distY * distY);

        if (distance <= ball.radius) {
          const prevX = ball.x;
          const prevY = ball.y;
          if (prevY + ball.radius <= obsTop && nextY + ball.radius >= obsTop) {
            ball.dy = -ball.dy; // Hit top
          } else if (prevY - ball.radius >= obsBottom && nextY - ball.radius <= obsBottom) {
            ball.dy = -ball.dy; // Hit bottom
          } else if (prevX + ball.radius <= obsLeft && nextX + ball.radius >= obsLeft) {
            ball.dx = -ball.dx; // Hit left
          } else if (prevX - ball.radius >= obsRight && nextX - ball.radius <= obsRight) {
            ball.dx = -ball.dx; // Hit right
          } else {
            ball.dy = -ball.dy; // Default vertical bounce
          }
        }
      }

      // Power-up collision (Level 2 only)
      if (currentLevel === 2 && powerUp.active) {
        const nextX = ball.x + ball.dx;
        const nextY = ball.y + ball.dy;
        const distX = nextX - powerUp.x;
        const distY = nextY - powerUp.y;
        const distance = Math.sqrt(distX * distX + distY * distY);

        if (distance <= ball.radius + powerUp.radius) {
          duplicateBall(ball); // Duplicate the ball on collision
          powerUp.active = false; // Power-up disappears after use
        }
      }
    });
  }
}

function duplicateBall(originalBall) {
  const angleOffset = Math.PI / 12; // 15 degrees offset for the second ball
  const newBall = {
    x: originalBall.x,
    y: originalBall.y,
    dx: originalBall.dx * Math.cos(angleOffset) - originalBall.dy * Math.sin(angleOffset),
    dy: originalBall.dx * Math.sin(angleOffset) + originalBall.dy * Math.cos(angleOffset),
    radius: originalBall.radius
  };
  balls.push(newBall);
}

function resetBall() {
  balls = [{
    x: canvas.width / 2,
    y: canvas.height / 2 + 100,
    dx: BALL_SPEED,
    dy: -BALL_SPEED,
    radius: 10
  }];
}

function drawBall() {
  balls.forEach(ball => {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
  });
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}

function drawBricks() {
  for (let level = 0; level < bricks.length; level++) {
    for (let i = 0; i < bricks[level].length; i++) {
      if (bricks[level][i].status === 1) {
        const brickX = bricks[level][i].x;
        const brickY = bricks[level][i].y;
        ctx.beginPath();
        ctx.rect(brickX, brickY, brick.width, brick.height);
        ctx.fillStyle = "#0095DD";
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}

function drawObstacle() {
  if (currentLevel === 2) {
    ctx.beginPath();
    ctx.rect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    ctx.fillStyle = "#333333";
    ctx.fill();
    ctx.closePath();
  }
}

function drawPowerUp() {
  if (currentLevel === 2 && powerUp.active) {
    ctx.beginPath();
    ctx.arc(powerUp.x, powerUp.y, powerUp.radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 149, 221, 0.2)"; // Very transparent light blue for bubble effect
    ctx.fill();
    ctx.strokeStyle = "#0095DD"; // Solid blue stroke for outline
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    // Draw "2x" text inside the bubble
    ctx.font = "12px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("2x", powerUp.x, powerUp.y);
  }
}

function moveObstacle() {
  if (currentLevel === 2 && !gamePaused) {
    obstacle.x += obstacle.dx;
    if (obstacle.x + obstacle.width > canvas.width || obstacle.x < 0) {
      obstacle.dx = -obstacle.dx;
    }
  }
}

function drawLives() {
  ctx.font = "30px Arial"; // Larger font for better visibility of heart icons
  ctx.fillStyle = "#0095DD";
  const heartSpacing = 40; // Spacing between hearts (adjust as needed)
  for (let i = 0; i < lives; i++) {
    ctx.fillText("♥", 20 + (i * heartSpacing), 40); // Top-left corner, adjusted for larger size and spacing
  }
}

function drawScore() {
  ctx.font = "20px Arial"; // Larger font for better visibility
  ctx.fillStyle = "#0095DD";
  ctx.textAlign = "center"; // Center-align the text
  ctx.fillText("Score: " + score, canvas.width / 2, canvas.height - 20); // Bottom-center of the canvas
}

function drawLevel() {
  ctx.font = "20px Arial"; // Increased font size for better visibility
  ctx.fillStyle = "#0095DD";
  ctx.textAlign = "center"; // Center-align the text
  ctx.fillText("Level: " + currentLevel, canvas.width / 2, 30); // Adjusted position for larger font
}

function drawBurgerMenu() {
  ctx.font = "24px Arial";
  ctx.fillStyle = "#333";
  ctx.fillText("☰", canvas.width - 30, 30); // Top-right corner on canvas
}

function draw() {
  if (!gameRunning || gamePaused) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawObstacle();
  drawBall();
  drawPaddle();
  drawPowerUp();
  drawLives();
  drawScore();
  drawLevel();
  drawBurgerMenu(); // Draw burger menu on canvas
  collisionDetection();
  moveObstacle();

  balls.forEach(ball => {
    ball.x += ball.dx;
    ball.y += ball.dy;
  });

  requestAnimationFrame(draw);
}

function startGame() {
  currentLevel = 1;
  balls = [{
    x: canvas.width / 2,
    y: canvas.height / 2 + 100,
    dx: BALL_SPEED,
    dy: -BALL_SPEED,
    radius: 10
  }];
  resetGame(currentLevel);
  startMenu.style.display = "none";
  canvas.style.display = "block";
  gameRunning = true;
  gamePaused = false;
  pauseMenu.style.display = "none";
  pauseOverlay.style.display = "none";
  draw();
}

function endGame(won) {
  gameRunning = false;
  canvas.style.display = "none";
  if (won) {
    if (currentLevel === 2) {
      creditsMenu.style.display = "block";
    } else {
      levelCompleteMenu.style.display = "block";
      document.getElementById("levelScore").textContent = "Score: " + score;
      nextLevelButton.style.display = "block";
    }
  } else {
    gameOverMenu.style.display = "block";
    document.getElementById("gameOverTitle").textContent = "GAME OVER";
    document.getElementById("finalScore").textContent = "Final Score: " + score;
  }
}

function handleLevelComplete() {
  endGame(true);
}

function startNextLevel() {
  currentLevel++;
  levelCompleteMenu.style.display = "none";
  canvas.style.display = "block";
  resetGame(currentLevel);
  gameRunning = true;
  gamePaused = false;
  pauseMenu.style.display = "none";
  pauseOverlay.style.display = "none";
  draw();
}

function replayCurrentLevel() {
  levelCompleteMenu.style.display = "none";
  canvas.style.display = "block";
  resetGame(currentLevel);
  gameRunning = true;
  gamePaused = false;
  pauseMenu.style.display = "none";
  pauseOverlay.style.display = "none";
  draw();
}

function restartGame() {
  gameOverMenu.style.display = "none";
  canvas.style.display = "block";
  currentLevel = 1;
  resetGame(currentLevel);
  gameRunning = true;
  gamePaused = false;
  pauseMenu.style.display = "none";
  pauseOverlay.style.display = "none";
  draw();
}

function returnToMainMenu() {
  gameOverMenu.style.display = "none";
  levelCompleteMenu.style.display = "none";
  creditsMenu.style.display = "none";
  pauseMenu.style.display = "none";
  pauseOverlay.style.display = "none";
  startMenu.style.display = "block";
  currentLevel = 1;
  score = 0; // Reset score to ensure a clean start
  lives = 3; // Reset lives
  gameRunning = false;
  gamePaused = false;
  resetGame(currentLevel); // Reset game state
  canvas.style.display = "none"; // Hide canvas to ensure main menu is visible
}

function returnToMainMenuFromPause() {
  pauseMenu.style.display = "none";
  pauseOverlay.style.display = "none";
  returnToMainMenu();
}

function resetGame(level) {
  score = 0;
  lives = 3;
  balls = [{
    x: canvas.width / 2,
    y: canvas.height / 2 + 100,
    dx: BALL_SPEED,
    dy: -BALL_SPEED,
    radius: 10
  }];
  paddle.x = (canvas.width - paddle.width) / 2;
  paddle.y = canvas.height - 150;
  obstacle.x = canvas.width / 2 - obstacle.width / 2;
  resetBricks(level);
  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
  if (paddle.y < 0) paddle.y = 0;
  if (paddle.y + paddle.height > canvas.height) paddle.y = canvas.height - paddle.height;
}

function resetBricks(level) {
  createBricks(level);
}

function togglePause() {
  if (!gameRunning) return;
  gamePaused = !gamePaused;
  if (gamePaused) {
    pauseOverlay.style.display = "block";
    pauseMenu.style.display = "block";
  } else {
    pauseOverlay.style.display = "none";
    pauseMenu.style.display = "none";
    draw();
  }
}

function continueGame() {
  gamePaused = false;
  pauseOverlay.style.display = "none";
  pauseMenu.style.display = "none";
  draw();
}

function restartCurrentLevel() {
  pauseMenu.style.display = "none";
  pauseOverlay.style.display = "none";
  resetGame(currentLevel);
  gamePaused = false;
  gameRunning = true;
  draw();
}

createBricks(1);
initializeGameElements(1);