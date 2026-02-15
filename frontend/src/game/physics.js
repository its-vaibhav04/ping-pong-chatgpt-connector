import { CANVAS } from "./constants";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const randomDirection = () => (Math.random() > 0.5 ? 1 : -1);

export const createInitialGameState = (maxScore) => ({
  running: true,
  winner: null,
  maxScore,
  playerScore: 0,
  aiScore: 0,
  rallyLength: 0,
  playerHitPattern: "mixed",
  playerPaddleY: CANVAS.height / 2 - CANVAS.paddleHeight / 2,
  aiPaddleY: CANVAS.height / 2 - CANVAS.paddleHeight / 2,
  ball: {
    x: CANVAS.width / 2,
    y: CANVAS.height / 2,
    vx: CANVAS.baseBallSpeed * randomDirection(),
    vy: CANVAS.baseBallSpeed * (Math.random() * 0.5 - 0.25)
  }
});

const resetBall = (state, direction) => {
  state.ball.x = CANVAS.width / 2;
  state.ball.y = CANVAS.height / 2;
  state.ball.vx = CANVAS.baseBallSpeed * direction;
  state.ball.vy = CANVAS.baseBallSpeed * (Math.random() * 0.5 - 0.25);
  state.rallyLength = 0;
};

export const movePlayer = (state, movement, deltaSeconds) => {
  state.playerPaddleY = clamp(
    state.playerPaddleY + movement * CANVAS.playerSpeed * deltaSeconds,
    0,
    CANVAS.height - CANVAS.paddleHeight
  );
};

export const moveAi = (state, aiMultiplier, strategy, deltaSeconds) => {
  const paddleCenter = state.aiPaddleY + CANVAS.paddleHeight / 2;
  const target = state.ball.y;
  const direction = target > paddleCenter ? 1 : -1;

  let strategyBias = 1;
  if (strategy === "aggressive") strategyBias = 1.12;
  if (strategy === "defensive") strategyBias = 0.9;

  const step = CANVAS.aiBaseSpeed * strategyBias * aiMultiplier * deltaSeconds;
  state.aiPaddleY = clamp(
    state.aiPaddleY + direction * Math.min(Math.abs(target - paddleCenter), step),
    0,
    CANVAS.height - CANVAS.paddleHeight
  );
};

export const tickBall = (state, deltaSeconds) => {
  const ball = state.ball;

  ball.x += ball.vx * deltaSeconds;
  ball.y += ball.vy * deltaSeconds;

  if (ball.y <= 0 || ball.y >= CANVAS.height) {
    ball.y = clamp(ball.y, 0, CANVAS.height);
    ball.vy *= -1;
  }

  const playerX = CANVAS.paddleMargin;
  const aiX = CANVAS.width - CANVAS.paddleMargin - CANVAS.paddleWidth;

  const playerHit =
    ball.x <= playerX + CANVAS.paddleWidth &&
    ball.x >= playerX &&
    ball.y >= state.playerPaddleY &&
    ball.y <= state.playerPaddleY + CANVAS.paddleHeight;

  const aiHit =
    ball.x >= aiX &&
    ball.x <= aiX + CANVAS.paddleWidth &&
    ball.y >= state.aiPaddleY &&
    ball.y <= state.aiPaddleY + CANVAS.paddleHeight;

  if (playerHit && ball.vx < 0) {
    ball.vx *= -1.03;
    const offset = (ball.y - (state.playerPaddleY + CANVAS.paddleHeight / 2)) / (CANVAS.paddleHeight / 2);
    ball.vy += offset * 120;
    state.rallyLength += 1;
    state.playerHitPattern = offset > 0.2 ? "downward" : offset < -0.2 ? "upward" : "flat";
  }

  if (aiHit && ball.vx > 0) {
    ball.vx *= -1.03;
    const offset = (ball.y - (state.aiPaddleY + CANVAS.paddleHeight / 2)) / (CANVAS.paddleHeight / 2);
    ball.vy += offset * 110;
    state.rallyLength += 1;
  }

  ball.vx = clamp(ball.vx, -CANVAS.maxBallSpeed, CANVAS.maxBallSpeed);
  ball.vy = clamp(ball.vy, -CANVAS.maxBallSpeed, CANVAS.maxBallSpeed);

  if (ball.x < 0) {
    state.aiScore += 1;
    resetBall(state, 1);
  }

  if (ball.x > CANVAS.width) {
    state.playerScore += 1;
    resetBall(state, -1);
  }

  if (state.playerScore >= state.maxScore) {
    state.running = false;
    state.winner = "player";
  }

  if (state.aiScore >= state.maxScore) {
    state.running = false;
    state.winner = "ai";
  }
};
