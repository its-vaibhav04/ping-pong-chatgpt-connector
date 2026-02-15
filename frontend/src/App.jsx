import { useMemo, useState } from "react";
import ControlsModal from "./components/ControlsModal";
import GameCanvas from "./components/GameCanvas";
import Menu from "./components/Menu";

const DEFAULT_SETTINGS = {
  maxScore: 7,
  tableTheme: "Soft Forest",
  ballStyle: "Circle",
  difficulty: "medium"
};

const Celebration = () => {
  const poppers = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 0.7}s`,
        duration: `${1.8 + Math.random() * 1.2}s`,
        hue: 130 + Math.random() * 120
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
      {poppers.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            backgroundColor: `hsl(${p.hue} 90% 58%)`
          }}
        />
      ))}
    </div>
  );
};

const WinnerScreen = ({ result, onReplay, onBack }) => {
  const playerWon = result.winner === "player";
  return (
    <div className="relative mx-auto w-full max-w-xl rounded-xl border border-slate-700 bg-slate-900/95 p-8 text-center shadow-2xl">
      {playerWon && <Celebration />}
      <h2 className="text-3xl font-semibold text-slate-100">{playerWon ? "You Win" : "AI Wins"}</h2>
      <p className="mt-2 text-slate-300">
        {playerWon ? "Congratulations, champion. Clean reads and sharp returns." : "Good game. The AI took this one."}
      </p>
      <p className="mt-1 text-slate-400">
        Final score: {result.playerScore} : {result.aiScore}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950" onClick={onReplay}>
          Replay
        </button>
        <button
          className="rounded-lg border border-slate-700 bg-slate-950 px-5 py-2 text-sm font-semibold text-slate-100"
          onClick={onBack}
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
};

const App = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [screen, setScreen] = useState("menu");
  const [showControls, setShowControls] = useState(false);
  const [result, setResult] = useState(null);

  const surfaceStyle = useMemo(
    () => ({
      background: "linear-gradient(150deg, #1f2937 0%, #0f172a 46%, #0b1020 100%)"
    }),
    []
  );

  return (
    <main className="min-h-screen p-4 sm:p-8" style={surfaceStyle}>
      {screen === "menu" && (
        <Menu
          settings={settings}
          setSettings={setSettings}
          onStart={() => setScreen("game")}
          onOpenControls={() => setShowControls(true)}
        />
      )}

      {screen === "game" && (
        <GameCanvas
          settings={settings}
          onBackToMenu={() => setScreen("menu")}
          onFinish={(gameResult) => {
            setResult(gameResult);
            setScreen("winner");
          }}
        />
      )}

      {screen === "winner" && result && (
        <WinnerScreen
          result={result}
          onReplay={() => setScreen("game")}
          onBack={() => setScreen("menu")}
        />
      )}

      <ControlsModal open={showControls} onClose={() => setShowControls(false)} />
    </main>
  );
};

export default App;
