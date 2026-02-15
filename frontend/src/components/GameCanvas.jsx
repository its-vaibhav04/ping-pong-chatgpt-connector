import { useEffect, useMemo, useRef, useState } from "react";
import { defaultAiState, fetchAiMove } from "../game/aiLogic";
import { CANVAS, DIFFICULTIES, TABLE_THEMES } from "../game/constants";
import { createInitialGameState, moveAi, movePlayer, tickBall } from "../game/physics";
import ScoreBoard from "./ScoreBoard";

const drawBall = (ctx, x, y, style, color) => {
  ctx.fillStyle = color;

  if (style === "Minimal square") {
    ctx.fillRect(x - 6, y - 6, 12, 12);
    return;
  }

  if (style === "Dot style") {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (style === "Soft glow circle") {
    const gradient = ctx.createRadialGradient(x, y, 1, x, y, 11);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();
};

const GameCanvas = ({ settings, onBackToMenu, onFinish }) => {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const gameRef = useRef(createInitialGameState(settings.maxScore));
  const keysRef = useRef({ up: false, down: false });
  const [paused, setPaused] = useState(false);
  const [aiState, setAiState] = useState(defaultAiState);

  const theme = useMemo(() => TABLE_THEMES[settings.tableTheme], [settings.tableTheme]);
  const difficultyConfig = useMemo(
    () => DIFFICULTIES[settings.difficulty] ?? DIFFICULTIES.medium,
    [settings.difficulty]
  );

  useEffect(() => {
    gameRef.current = createInitialGameState(settings.maxScore);
  }, [settings.maxScore]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") keysRef.current.up = true;
      if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") keysRef.current.down = true;
      if (e.key.toLowerCase() === "p") setPaused((prev) => !prev);
    };

    const onKeyUp = (e) => {
      if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") keysRef.current.up = false;
      if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") keysRef.current.down = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      while (!cancelled) {
        const state = gameRef.current;
        const snapshot = {
          player_score: state.playerScore,
          ai_score: state.aiScore,
          rally_length: state.rallyLength,
          player_hit_pattern: state.playerHitPattern,
          ball_speed: Math.abs(state.ball.vx),
          difficulty: settings.difficulty
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2600);
        try {
          const move = await fetchAiMove(snapshot, controller.signal);
          if (!cancelled) setAiState(move);
        } catch {
          if (!cancelled) {
            setAiState((prev) => ({ ...prev, commentary: "AI sync delayed. Playing steady." }));
          }
        } finally {
          clearTimeout(timeout);
        }

        await new Promise((resolve) => setTimeout(resolve, 4000));
      }
    };

    tick();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let last = performance.now();

    const loop = (now) => {
      const delta = Math.min((now - last) / 1000, 0.032);
      last = now;

      const state = gameRef.current;
      if (!paused && state.running) {
        const move = (keysRef.current.down ? 1 : 0) - (keysRef.current.up ? 1 : 0);
        movePlayer(state, move, delta);
        const tunedBoost = Math.max(0.4, Math.min(1.6, aiState.reactionBoost * difficultyConfig.aiMultiplier));
        moveAi(state, tunedBoost, aiState.strategy, delta);
        tickBall(state, delta);
      }

      ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);
      ctx.fillStyle = theme.table;
      ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

      ctx.strokeStyle = theme.line;
      ctx.setLineDash([8, 10]);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(CANVAS.width / 2, 0);
      ctx.lineTo(CANVAS.width / 2, CANVAS.height);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = theme.text;
      ctx.fillRect(CANVAS.paddleMargin, state.playerPaddleY, CANVAS.paddleWidth, CANVAS.paddleHeight);
      ctx.fillRect(
        CANVAS.width - CANVAS.paddleMargin - CANVAS.paddleWidth,
        state.aiPaddleY,
        CANVAS.paddleWidth,
        CANVAS.paddleHeight
      );

      drawBall(ctx, state.ball.x, state.ball.y, settings.ballStyle, theme.text);

      if (!state.running) {
        onFinish({ winner: state.winner, playerScore: state.playerScore, aiScore: state.aiScore });
        return;
      }

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [aiState.reactionBoost, aiState.strategy, difficultyConfig.aiMultiplier, onFinish, paused, settings.ballStyle, theme]);

  const score = gameRef.current;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <ScoreBoard
        playerScore={score.playerScore}
        aiScore={score.aiScore}
        maxScore={settings.maxScore}
        commentary={aiState.commentary}
      />
      <div className="rounded-lg border border-slate-700 p-3 shadow-2xl" style={{ background: theme.background }}>
        <canvas
          ref={canvasRef}
          width={CANVAS.width}
          height={CANVAS.height}
          className="h-auto w-full rounded-xl"
          aria-label="AI Pong Arena canvas"
        />
      </div>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => setPaused((prev) => !prev)}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          {paused ? "Resume" : "Pause"}
        </button>
        <button
          type="button"
          onClick={onBackToMenu}
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
};

export default GameCanvas;
