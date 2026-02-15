from __future__ import annotations

import re
from pathlib import Path

from mcp.server.fastmcp import FastMCP
from mcp.types import CallToolResult, TextContent

APP_TITLE = "AI Pong Arena"
RESOURCE_URI = "ui://widget/ai-pong-arena-v1.html"
MCP_MIME = "text/html;profile=mcp-app"


def _load_dist_widget_html() -> str:
    dist_dir = Path(__file__).resolve().parent.parent / "frontend" / "dist"
    index_file = dist_dir / "index.html"

    if not index_file.exists():
        return (
            "<!doctype html><html><head><meta charset='utf-8'/>"
            "<title>AI Pong Arena</title></head><body>"
            "<div style='font-family:sans-serif;padding:16px'>"
            "Frontend build is missing. Run <code>npm install && npm run build</code> in <code>frontend/</code>."
            "</div></body></html>"
        )

    html = index_file.read_text(encoding="utf-8")

    css_match = re.search(r'href="([^"]+\.css)"', html)
    js_match = re.search(r'src="([^"]+\.js)"', html)

    css = ""
    js = ""

    if css_match:
        css_path = dist_dir / css_match.group(1).lstrip("/")
        if css_path.exists():
            css = css_path.read_text(encoding="utf-8")

    if js_match:
        js_path = dist_dir / js_match.group(1).lstrip("/")
        if js_path.exists():
            js = js_path.read_text(encoding="utf-8")

    return (
        "<!doctype html>"
        "<html lang='en'>"
        "<head>"
        "<meta charset='UTF-8' />"
        "<meta name='viewport' content='width=device-width, initial-scale=1.0' />"
        f"<title>{APP_TITLE}</title>"
        f"<style>{css}</style>"
        "</head>"
        "<body>"
        "<div id='root'></div>"
        f"<script type='module'>{js}</script>"
        "</body>"
        "</html>"
    )


def create_mcp_server() -> FastMCP:
    mcp = FastMCP(
        APP_TITLE,
        host="0.0.0.0",
        stateless_http=True,
        json_response=True,
        instructions=(
            "Launch AI Pong Arena, a calm Pong game where the user plays against adaptive AI. "
            "Use the game UI widget and keep narration concise."
        ),
    )
    try:
        mcp.settings.streamable_http_path = "/"
    except Exception:
        pass

    @mcp.resource(RESOURCE_URI, mime_type=MCP_MIME)
    def pong_widget() -> str:
        return _load_dist_widget_html()

    @mcp.tool(
        title="Launch AI Pong Arena",
        description="Opens the AI Pong Arena game widget in ChatGPT.",
        meta={
            "ui": {"resourceUri": RESOURCE_URI, "visibility": ["model", "app"]},
            "openai/outputTemplate": RESOURCE_URI,
        },
    )
    def launch_ai_pong_arena(
        max_score: int = 7,
        table_theme: str = "Soft Forest",
        ball_style: str = "Circle",
    ) -> CallToolResult:
        safe_max = min(max(max_score, 1), 21)
        return CallToolResult(
            content=[TextContent(type="text", text="Launching AI Pong Arena.")],
            structuredContent={
                "app": APP_TITLE,
                "defaults": {
                    "maxScore": safe_max,
                    "tableTheme": table_theme,
                    "ballStyle": ball_style,
                },
            },
            meta={
                "ui": {
                    "resourceUri": RESOURCE_URI,
                    "visibility": ["model", "app"],
                },
                "openai/outputTemplate": RESOURCE_URI,
            },
        )

    return mcp
