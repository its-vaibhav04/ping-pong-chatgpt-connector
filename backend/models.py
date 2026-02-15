from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator


class GameSnapshot(BaseModel):
    player_score: int = Field(ge=0)
    ai_score: int = Field(ge=0)
    rally_length: int = Field(ge=0)
    player_hit_pattern: Literal["upward", "downward", "flat", "mixed"]
    ball_speed: float = Field(gt=0)
    difficulty: Literal["easy", "medium", "hard"] = "medium"


class AIMoveResponse(BaseModel):
    strategy: Literal["aggressive", "defensive", "balanced"]
    reaction_boost: float = Field(ge=0.6, le=1.8)
    commentary: str = Field(min_length=1, max_length=120)

    @field_validator("commentary")
    @classmethod
    def trim_commentary(cls, value: str) -> str:
        return value.strip()
