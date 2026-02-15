const ControlsModal = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-950 p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-slate-100">Controls</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          <li>`W` / `S` or Arrow keys to move your paddle</li>
          <li>`P` to pause and resume</li>
          <li>Score by sending the ball past the AI paddle</li>
        </ul>
        <button
          onClick={onClose}
          className="mt-5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
          type="button">
          Close
        </button>
      </div>
    </div>
  );
};

export default ControlsModal;
