const ScoreBoard = ({ playerScore, aiScore, maxScore, commentary }) => {
  return (
    <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/90 px-4 py-3 shadow-lg">
      <div className="text-slate-100">
        <p className="text-sm text-slate-400">First to {maxScore}</p>
        <p className="text-2xl font-semibold tracking-tight">
          {playerScore} : {aiScore}
        </p>
      </div>
      <div className="max-w-sm text-right text-sm text-slate-300">{commentary}</div>
    </div>
  );
};

export default ScoreBoard;
