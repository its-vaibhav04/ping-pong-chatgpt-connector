import { BALL_STYLES, DIFFICULTIES, TABLE_THEMES } from "../game/constants";

const Menu = ({ settings, setSettings, onStart, onOpenControls }) => {
  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl border border-slate-700/80 bg-slate-900/90 p-6 shadow-2xl sm:p-8">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-100">
        AI Pong Arena
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        Minimal Pong inside your ChatGPT connector.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-slate-200">
          Table theme
          <select
            className="mt-1 w-full rounded-lg text-gray-700 border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            value={settings.tableTheme}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, tableTheme: e.target.value }))
            }>
            {Object.keys(TABLE_THEMES).map((theme) => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-200">
          Ball style
          <select
            className="mt-1 w-full rounded-lg text-gray-700 border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            value={settings.ballStyle}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, ballStyle: e.target.value }))
            }>
            {BALL_STYLES.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-200 sm:col-span-2">
          Max score
          <input
            type="number"
            min={1}
            max={21}
            className="mt-1 w-full text-gray-700 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            value={settings.maxScore}
            onChange={(e) => {
              const value = Number(e.target.value || 1);
              setSettings((prev) => ({
                ...prev,
                maxScore: Math.max(1, Math.min(21, value)),
              }));
            }}
          />
        </label>

        <label className="text-sm text-slate-200 sm:col-span-2">
          Difficulty
          <select
            className="mt-1 w-full text-gray-700 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            value={settings.difficulty}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, difficulty: e.target.value }))
            }>
            {Object.entries(DIFFICULTIES).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onStart}
          className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400">
          Start Game
        </button>
        <button
          type="button"
          onClick={onOpenControls}
          className="rounded-lg border border-slate-700 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-slate-100">
          Controls Help
        </button>
      </div>
    </div>
  );
};

export default Menu;
