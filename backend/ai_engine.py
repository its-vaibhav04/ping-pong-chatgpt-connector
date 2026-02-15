from __future__ import annotations

import json
import os
from typing import Any

from openai import AsyncOpenAI

from .models import AIMoveResponse, GameSnapshot


class AIEngine:
    def __init__(self) -> None:
        api_key = os.getenv("OPENAI_API_KEY")
        self.model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
        self.client = AsyncOpenAI(api_key=api_key) if api_key else None

    async def get_ai_move(self, snapshot: GameSnapshot) -> AIMoveResponse:
        if self.client is None:
            return self._fallback_move(snapshot)

        try:
            response = await self.client.responses.create(
                model=self.model,
                input=[
                    {
                        "role": "system",
                        "content": [
                            {
                                "type": "input_text",
                                "text": (
                                    "You tune a Pong AI. Return strict JSON only. "
                                    "Commentary must be short, competitive, and calm."
                                ),
                            }
                        ],
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "input_text",
                                "text": (
                                    "Given this game snapshot, return strategy, reaction_boost, "
                                    f"and commentary: {snapshot.model_dump_json()}"
                                ),
                            }
                        ],
                    },
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
                                    "enum": ["aggressive", "defensive", "balanced"],
                                },
                                "reaction_boost": {"type": "number", "minimum": 0.6, "maximum": 1.8},
                                "commentary": {"type": "string", "minLength": 1, "maxLength": 120},
                            },
                            "required": ["strategy", "reaction_boost", "commentary"],
                            "additionalProperties": False,
                        },
                    }
                },
            )
            payload = self._extract_json(response)
            return AIMoveResponse.model_validate(payload)
        except Exception:
            return self._fallback_move(snapshot)

    @staticmethod
    def _extract_json(response: Any) -> dict[str, Any]:
        if hasattr(response, "output_text") and response.output_text:
            return json.loads(response.output_text)

        output = getattr(response, "output", []) or []
        for item in output:
            if getattr(item, "type", None) != "message":
                continue
            content = getattr(item, "content", []) or []
            for part in content:
                if getattr(part, "type", None) == "output_text" and getattr(part, "text", None):
                    return json.loads(part.text)
        raise ValueError("No JSON output found")

    @staticmethod
    def _fallback_move(snapshot: GameSnapshot) -> AIMoveResponse:
        lead = snapshot.ai_score - snapshot.player_score
        speed = snapshot.ball_speed
        rally = snapshot.rally_length
        difficulty_bias = {"easy": 0.6, "medium": 0.82, "hard": 1.0}[snapshot.difficulty]

        if lead <= -2:
            strategy = "aggressive"
            boost = 1.35
            text = "I am turning up pressure for this rally."
        elif lead >= 2:
            strategy = "defensive"
            boost = 0.95
            text = "I will play safe and hold my lead."
        elif speed > 7.5 or rally > 7:
            strategy = "balanced"
            boost = 1.15
            text = "Long rally. I am tightening my timing."
        else:
            strategy = "balanced"
            boost = 1.0
            text = "Steady pace. I am reading your angles."

        return AIMoveResponse(
            strategy=strategy,
            reaction_boost=max(0.6, min(1.8, boost * difficulty_bias)),
            commentary=text,
        )
