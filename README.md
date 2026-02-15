# AI Pong Arena 🎮

<div align="center">

![AI Pong Arena](https://img.shields.io/badge/AI-Pong%20Arena-brightgreen)
![Python](https://img.shields.io/badge/Python-3.11+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-teal)
![React](https://img.shields.io/badge/React-18.3-cyan)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-orange)

**A real-time Pong game where you play against an adaptive AI opponent powered by GPT, built as a ChatGPT App using the Model Context Protocol (MCP).**

[Features](#features) • [Architecture](#architecture) • [Setup](#installation) • [Usage](#usage) • [How It Works](#how-it-works)

</div>

---

## ✨ Features

### Gameplay

- 🎮 **Classic Pong Mechanics**: Smooth paddle controls with realistic physics
- 🤖 **Adaptive AI Opponent**: GPT analyzes your play style and adjusts strategy
- 🎨 **Multiple Themes**: Choose from 4 visual themes (Soft Forest, Ocean Calm, Grey Minimal, Warm Sand)
- ⚾ **Ball Styles**: 4 different ball rendering styles
- 🏆 **Customizable Win Conditions**: Set match length from 1-21 points
- 🎚️ **Difficulty Levels**: Easy, Medium, and Hard AI multipliers

### Technical

- ⚡ **Real-Time Strategy Updates**: AI recalculates every 4 seconds based on game state
- 💬 **Live Commentary**: GPT provides contextual trash talk during gameplay
- 📊 **Structured Outputs**: Type-safe JSON responses from OpenAI API
- 🔐 **Stateless MCP Server**: Follows best practices for ChatGPT Apps
- 🎯 **Canvas Rendering**: 60 FPS HTML5 Canvas gameplay
- 📱 **Responsive Design**: Works on desktop and mobile browsers

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         ChatGPT UI                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  User: "Let's play pong"                               │ │
│  │  Chatgpt: *invokes launch_ai_pong_arena tool*          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │         AI Pong Arena Widget (React)             │  │ │
│  │  │  - Canvas game rendering                         │  │ │
│  │  │  - User paddle control                           │  │ │
│  │  │  - Score display & commentary                    │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    MCP Server (FastAPI)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  MCP Protocol Handler                                  │ │
│  │  - Tool registration: launch_ai_pong_arena             │ │
│  │  - Resource serving: widget HTML                       │ │
│  │  - Metadata: app title, descriptions                   │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Game API Endpoints                                    │ │
│  │  - POST /ai-move → AI strategy decisions               │ │
│  │  - GET / → Serve widget if accessed directly           │ │
│  │  - GET /health → Health check                          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    OpenAI API                               │
│  - Structured JSON outputs                                  │
│  - Real-time strategy generation                            │
│  - Game state analysis                                      │
└─────────────────────────────────────────────────────────────┘
```

### MCP Integration

The **Model Context Protocol** serves as the bridge between ChatGPT and your application. Here's how it works:

#### 1. Tool Definition

```python
@mcp.tool(
    title="Launch AI Pong Arena",
    description="Opens the AI Pong Arena game widget in ChatGPT.",
    meta={
        "ui": {"resourceUri": RESOURCE_URI, "visibility": ["model", "app"]},
        "openai/outputTemplate": RESOURCE_URI
    }
)
def launch_ai_pong_arena(
    max_score: int = 7,
    table_theme: str = "Soft Forest",
    ball_style: str = "Circle",
) -> CallToolResult:
    # Returns structured metadata telling ChatGPT to render the widget
```

#### 2. Resource Serving

```python
@mcp.resource(RESOURCE_URI, mime_type="text/html;profile=mcp-app")
def pong_widget() -> str:
    # Returns self-contained HTML with inlined React bundle
    # No external CDN dependencies (sandbox requirement)
```

#### 3. Tool Invocation Flow

1. User says: "I want to play pong"
2. ChatGPT recognizes intent and calls `launch_ai_pong_arena`
3. MCP server returns `CallToolResult` with:
   - `content`: Text message for ChatGPT
   - `structuredContent`: Game configuration defaults
   - `meta.ui.resourceUri`: Points to widget HTML
4. ChatGPT fetches the resource URI and renders it in an iframe
5. Game loads and begins polling `/ai-move` endpoint

### AI Opponent Logic

The AI opponent uses a sophisticated decision-making pipeline:

#### Game State Analysis

Every 4 seconds, the frontend sends a snapshot to the backend:

```python
snapshot = {
    "player_score": 3,
    "ai_score": 5,
    "rally_length": 12,
    "player_hit_pattern": "downward",  # upward/downward/flat/mixed
    "ball_speed": 480.5,
    "difficulty": "medium"
}
```

#### GPT Strategy Generation

The backend queries OpenAI's Responses API with strict JSON schema:

```python
response = await client.responses.create(
    model="gpt-4.1-mini",
    input=[
        {
            "role": "system",
            "content": [
                {
                    "type": "input_text",
                    "text": "You tune a Pong AI. Return strict JSON only."
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "input_text",
                    "text": f"Given this game snapshot, return strategy: {snapshot}"
                }
            ]
        }
    ],
    temperature=0.4,
    max_output_tokens=120,
    text={
        "format": {
            "type": "json_schema",
            "name": "pong_ai_move",
            "strict": True,
            "schema": {
                "type": "object",
                "properties": {
                    "strategy": {
                        "type": "string",
                        "enum": ["aggressive", "defensive", "balanced"]
                    },
                    "reaction_boost": {
                        "type": "number",
                        "minimum": 0.6,
                        "maximum": 1.8
                    },
                    "commentary": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 120
                    }
                },
                "required": ["strategy", "reaction_boost", "commentary"],
                "additionalProperties": False
            }
        }
    }
)
```

#### Response Application

The AI's response affects gameplay:

- **Strategy** (`aggressive`/`defensive`/`balanced`): Modifies base movement speed multiplier
- **Reaction Boost** (0.6-1.8): Fine-tunes how quickly AI paddle tracks the ball
- **Commentary**: Displayed to user in real-time

Example responses:

- When losing: `{"strategy": "aggressive", "reaction_boost": 1.35, "commentary": "Turning up the pressure."}`
- When winning: `{"strategy": "defensive", "reaction_boost": 0.95, "commentary": "Playing it safe now."}`

#### Fallback Logic

If OpenAI API is unavailable, a deterministic fallback activates:

- Score differential analysis
- Ball speed consideration
- Rally length evaluation
- Difficulty-based multipliers

---

## 📦 Prerequisites

### Required Software

- **Python 3.11+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** and npm - [Download](https://nodejs.org/)
- **OpenAI API Key**(Optional) - [Get one here](https://platform.openai.com/api-keys)
- **ngrok** (for local testing with ChatGPT) - [Download](https://ngrok.com/download)

### Optional Tools

- **Git** - For cloning the repository
- **Virtual environment tool** - venv (built-in) or conda

---

## 🚀 Installation

### Local Development Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/its-vaibhav04/ping-pong-chatgpt-connector/
cd ping-pong-chatgpt-connector
```

#### 2. Backend Setup

Create and activate a virtual environment:

```bash
# macOS/Linux
python3 -m venv env
source env/bin/activate

# Windows
python -m venv env
env\Scripts\activate
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file in the project root:(Optional)

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:(Optional)

```env
OPENAI_API_KEY=sk-proj-...your-key-here...
OPENAI_MODEL=gpt-4.1-mini
```

#### 3. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

Build the production bundle:

```bash
npm run build
```

This creates a `frontend/dist` directory with the compiled React application.

#### 4. Verify Installation

Return to the project root:

```bash
cd ..
```

Start the server:

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Visit `http://localhost:8000` in your browser. You should see the AI Pong Arena menu.

---

## 🎮 Usage

### Running Locally

#### Standard Local Play

1. Start the backend server:

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

2. Open `http://localhost:8000` in your browser

3. Configure game settings and click "Start Game"

#### Game Controls

- **W** or **↑** - Move paddle up
- **S** or **↓** - Move paddle down
- **P** - Pause/Resume
- **Back to Menu** - Return to settings

### Testing with ChatGPT

To integrate with ChatGPT, you need to expose your local server publicly using ngrok.

#### 1. Start ngrok

In a new terminal window:

```bash
ngrok http 8000
```

You'll see output like:

```
Forwarding   https://abc123def456.ngrok-free.app -> http://localhost:8000
```

Copy the HTTPS URL (e.g., `https://abc123def456.ngrok-free.app`).

#### 2. Configure ChatGPT

**Option A: Using ChatGPT Desktop/Web**

1. Open ChatGPT
2. Navigate to Settings → Apps (or Connectors)
3. Click "Add Custom App"
4. Enter your ngrok URL: `https://abc123def456.ngrok-free.app/mcp`
5. Save the configuration

**Option B: Using MCP Inspector (for debugging)**

```bash
npx @modelcontextprotocol/inspector uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

#### 3. Test the Integration

In ChatGPT, type:

```
Let's play AI Pong Arena!
```

or

```
Launch the pong game with max score 11
```

ChatGPT should invoke the `launch_ai_pong_arena` tool and display the game widget.

---

## 🔍 How It Works

### Frontend Architecture

#### Component Hierarchy

```
App.jsx (main)
├── Menu.jsx - Configuration screen
├── GameCanvas.jsx - Core game loop
│   ├── Canvas rendering (60 FPS)
│   ├── Physics engine
│   ├── AI polling logic
│   └── ScoreBoard.jsx
├── WinnerScreen.jsx - End game screen
└── ControlsModal.jsx - Help dialog
```

#### Game Loop

The game uses `requestAnimationFrame` for smooth 60 FPS rendering:

```javascript
const loop = (now) => {
  const delta = (now - last) / 1000; // Time delta in seconds

  if (!paused && state.running) {
    // 1. Update player paddle position
    movePlayer(state, keyboardInput, delta);

    // 2. Update AI paddle position (with GPT-4 boost multiplier)
    moveAi(state, aiState.reactionBoost, aiState.strategy, delta);

    // 3. Update ball position and handle collisions
    tickBall(state, delta);
  }

  // 4. Render everything
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTable();
  drawPaddles();
  drawBall();

  requestAnimationFrame(loop);
};
```

#### AI State Management

Every 4 seconds, a background process fetches new AI decisions:

```javascript
useEffect(() => {
  let cancelled = false;

  const tick = async () => {
    while (!cancelled) {
      const snapshot = {
        player_score: state.playerScore,
        ai_score: state.aiScore,
        rally_length: state.rallyLength,
        player_hit_pattern: state.playerHitPattern,
        ball_speed: Math.abs(state.ball.vx),
        difficulty: settings.difficulty,
      };

      try {
        const move = await fetchAiMove(snapshot);
        setAiState(move); // Update AI behavior
      } catch (error) {
        // Fallback to last known state
      }

      await new Promise((resolve) => setTimeout(resolve, 4000));
    }
  };

  tick();
  return () => {
    cancelled = true;
  };
}, [settings.difficulty]);
```

### Backend Architecture

#### FastAPI Structure

**Main Application** (`backend/main.py`):

- Serves frontend static files
- Hosts MCP server at `/mcp`
- Provides REST API for AI decisions

**AI Engine** (`backend/ai_engine.py`):

- Manages OpenAI API client
- Implements retry logic
- Handles fallback strategies

**MCP Server** (`backend/mcp_server.py`):

- Registers tools and resources
- Bundles frontend assets into single HTML
- Manages widget metadata

#### Request Flow

1. **ChatGPT → MCP Server**

   ```
   POST /mcp/tools/call
   {
     "name": "launch_ai_pong_arena",
     "arguments": {
       "max_score": 7,
       "table_theme": "Soft Forest"
     }
   }
   ```

2. **MCP Server → ChatGPT**

   ```json
   {
     "content": [{ "type": "text", "text": "Launching AI Pong Arena." }],
     "meta": {
       "ui": {
         "resourceUri": "ui://widget/ai-pong-arena-v1.html"
       }
     }
   }
   ```

3. **ChatGPT → MCP Server** (fetch widget)

   ```
   GET /mcp/resources?uri=ui://widget/ai-pong-arena-v1.html
   ```

4. **During Gameplay: Frontend → Backend**

   ```
   POST /ai-move
   {
     "player_score": 3,
     "ai_score": 5,
     "rally_length": 8,
     "player_hit_pattern": "downward",
     "ball_speed": 420.5,
     "difficulty": "medium"
   }
   ```

5. **Backend → OpenAI API**

   ```
   POST https://api.openai.com/v1/responses
   {
     "model": "gpt-4.1-mini",
     "input": [...],
     "text": {
       "format": {
         "type": "json_schema",
         "strict": true,
         "schema": {...}
       }
     }
   }
   ```

6. **OpenAI → Backend → Frontend**
   ```json
   {
     "strategy": "aggressive",
     "reaction_boost": 1.25,
     "commentary": "Time to step it up!"
   }
   ```

### AI Decision Making

#### Strategy Selection Logic

GPT considers multiple factors:

| Factor                 | Impact on Strategy                                   |
| ---------------------- | ---------------------------------------------------- |
| **Score Differential** | Losing by 2+ → Aggressive; Winning by 2+ → Defensive |
| **Ball Speed**         | >7.5 units/sec → More cautious positioning           |
| **Rally Length**       | >7 hits → Tighten timing, reduce errors              |
| **Player Pattern**     | Upward bias → Anticipate high shots                  |
| **Difficulty Setting** | Easy: 0.55x, Medium: 0.8x, Hard: 1.0x multiplier     |

#### Example Decision Tree

```
IF ai_score - player_score <= -2:
  THEN strategy = "aggressive", boost = 1.35
ELSE IF ai_score - player_score >= 2:
  THEN strategy = "defensive", boost = 0.95
ELSE IF ball_speed > 7.5 OR rally_length > 7:
  THEN strategy = "balanced", boost = 1.15
ELSE:
  THEN strategy = "balanced", boost = 1.0
```

This logic is executed by GPT-4 with contextual commentary generation.

---

### Game Constants

Edit `frontend/src/game/constants.js` to modify:

```javascript
export const CANVAS = {
  width: 880, // Canvas width in pixels
  height: 520, // Canvas height in pixels
  paddleWidth: 14, // Paddle width
  paddleHeight: 92, // Paddle height
  paddleMargin: 22, // Distance from edge
  playerSpeed: 360, // Player paddle speed (px/sec)
  aiBaseSpeed: 300, // Base AI paddle speed (px/sec)
  baseBallSpeed: 400, // Initial ball speed (px/sec)
  maxBallSpeed: 620, // Max ball speed after bounces
};
```

### Difficulty Tuning

Modify `DIFFICULTIES` object:

```javascript
export const DIFFICULTIES = {
  easy: { label: "Easy", aiMultiplier: 0.55 },
  medium: { label: "Medium", aiMultiplier: 0.8 },
  hard: { label: "Hard", aiMultiplier: 1.0 },
  expert: { label: "Expert", aiMultiplier: 1.3 }, // Add custom difficulty
};
```

---

## 📁 Project Structure

```
ai-pong-arena/
├── backend/
│   ├── __init__.py
│   ├── main.py              # FastAPI app + MCP mounting
│   ├── mcp_server.py        # MCP protocol implementation
│   ├── ai_engine.py         # OpenAI API client + fallback logic
│   └── models.py            # Pydantic models for validation
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ControlsModal.jsx
│   │   │   ├── GameCanvas.jsx    # Core game loop
│   │   │   ├── Menu.jsx          # Settings screen
│   │   │   └── ScoreBoard.jsx
│   │   ├── game/
│   │   │   ├── aiLogic.js        # AI state management
│   │   │   ├── constants.js      # Game configuration
│   │   │   └── physics.js        # Game physics engine
│   │   ├── App.jsx               # Root component
│   │   ├── main.jsx              # React entry point
│   │   └── styles.css            # Tailwind + custom CSS
│   ├── dist/                     # Build output (generated)
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── .env.example              # Template for environment variables
├── .gitignore
├── AGENTS.md                 # Agent behavior notes
├── README.md                 # This file
└── requirements.txt          # Python dependencies
```

---

## 📚 API Reference

### REST Endpoints

#### `POST /ai-move`

Get AI strategy decision based on game state.

**Request Body:**

```json
{
  "player_score": 3,
  "ai_score": 5,
  "rally_length": 8,
  "player_hit_pattern": "downward",
  "ball_speed": 420.5,
  "difficulty": "medium"
}
```

**Response:**

```json
{
  "strategy": "aggressive",
  "reaction_boost": 1.25,
  "commentary": "I'm turning up the pressure!"
}
```

**Status Codes:**

- `200 OK` - Success
- `422 Unprocessable Entity` - Invalid request data
- `500 Internal Server Error` - OpenAI API failure (returns fallback response)

#### `GET /health`

Health check endpoint.

**Response:**

```json
{
  "status": "ok"
}
```

#### `GET /`

Serves the frontend application when accessed directly (not through ChatGPT).

### MCP Endpoints

#### `POST /mcp/tools/call`

MCP protocol tool invocation.

**Request:**

```json
{
  "name": "launch_ai_pong_arena",
  "arguments": {
    "max_score": 7,
    "table_theme": "Soft Forest",
    "ball_style": "Circle"
  }
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Launching AI Pong Arena."
    }
  ],
  "structuredContent": {
    "app": "AI Pong Arena",
    "defaults": {
      "maxScore": 7,
      "tableTheme": "Soft Forest",
      "ballStyle": "Circle"
    }
  },
  "meta": {
    "ui": {
      "resourceUri": "ui://widget/ai-pong-arena-v1.html",
      "visibility": ["model", "app"]
    }
  }
}
```

#### `GET /mcp/resources`

Fetch widget HTML resource.

**Query Parameters:**

- `uri` (required) - Resource URI to fetch

**Response:**

- Content-Type: `text/html;profile=mcp-app`
- Body: Self-contained HTML with inlined CSS/JS

---

## 🙏 Acknowledgments

- **OpenAI** - For the ChatGPT Apps SDK and GPT-4 API
- **Model Context Protocol** - For the MCP specification
- **FastAPI** - For the amazing Python web framework
- **React** - For the frontend framework
- **Vite** - For lightning-fast frontend tooling
- **ngrok** - For making local development seamless

---

## 📞 Contact

**Vaibhav Tyagi** - [Email](tyagi.vaibhav4814@gmail.com)

---

<div align="center">

**Made with curiosity about how ChatGPT Apps work**

</div>
