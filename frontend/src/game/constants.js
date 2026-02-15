export const CANVAS = {
  width: 880,
  height: 520,
  paddleWidth: 14,
  paddleHeight: 92,
  paddleMargin: 22,
  ballSize: 14,
  playerSpeed: 360,
  aiBaseSpeed: 300,
  baseBallSpeed: 400,
  maxBallSpeed: 620,
};

export const TABLE_THEMES = {
  "Soft Forest": {
    background: "#0F1B16",
    table: "#193126",
    line: "#3E5A4B",
    text: "#D3E7DA",
  },
  "Ocean Calm": {
    background: "#0E1A24",
    table: "#182B3A",
    line: "#34556C",
    text: "#CEE4F2",
  },
  "Grey Minimal": {
    background: "#12151A",
    table: "#202631",
    line: "#434E60",
    text: "#DCE3EE",
  },
  "Warm Sand": {
    background: "#221A12",
    table: "#3A2D21",
    line: "#6A5441",
    text: "#F2DFC8",
  },
};

export const BALL_STYLES = [
  "Circle",
  "Soft glow circle",
  "Minimal square",
  "Dot style",
];

export const DIFFICULTIES = {
  easy: { label: "Easy", aiMultiplier: 0.55 },
  medium: { label: "Medium", aiMultiplier: 0.8 },
  hard: { label: "Hard", aiMultiplier: 1.0 },
};
