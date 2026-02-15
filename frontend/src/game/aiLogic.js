export const defaultAiState = {
  strategy: "balanced",
  reactionBoost: 1,
  commentary: "Match loaded."
};

export const fetchAiMove = async (snapshot, signal) => {
  const response = await fetch("/ai-move", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(snapshot),
    signal
  });

  if (!response.ok) {
    throw new Error(`AI move failed with ${response.status}`);
  }

  const body = await response.json();
  return {
    strategy: body.strategy,
    reactionBoost: body.reaction_boost,
    commentary: body.commentary
  };
};
