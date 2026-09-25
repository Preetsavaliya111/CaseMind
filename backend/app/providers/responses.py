import json
from dataclasses import dataclass
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.core.config import settings


class ResponseProviderError(RuntimeError):
    pass


@dataclass
class GroqResponseProvider:
    api_key: str
    model: str
    base_url: str

    def generate(self, *, instructions: str, input_text: str) -> str:
        payload = json.dumps(
            {
                "model": self.model,
                "instructions": instructions,
                "input": input_text,
                "max_output_tokens": settings.AI_MAX_OUTPUT_TOKENS,
                "store": False,
            }
        ).encode("utf-8")
        request = Request(
            f"{self.base_url.rstrip('/')}/responses",
            data=payload,
            method="POST",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "User-Agent": "CaseMind/0.1",
            },
        )
        try:
            with urlopen(request, timeout=90) as response:
                body = json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            raise ResponseProviderError(f"AI provider returned HTTP {exc.code}") from exc
        except (URLError, TimeoutError, ValueError) as exc:
            raise ResponseProviderError("AI provider is unavailable") from exc

        output_text = body.get("output_text")
        if isinstance(output_text, str) and output_text.strip():
            return output_text.strip()

        parts: list[str] = []
        for item in body.get("output", []):
            if item.get("type") != "message":
                continue
            for content in item.get("content", []):
                if content.get("type") == "output_text" and isinstance(content.get("text"), str):
                    parts.append(content["text"])
        if not parts:
            raise ResponseProviderError("AI provider returned no text")
        return "\n".join(parts).strip()


def get_response_provider() -> GroqResponseProvider | None:
    if not settings.GROQ_API_KEY:
        return None
    if settings.CHAT_PROVIDER.lower() != "groq":
        raise ResponseProviderError("Configured answer provider is not supported")
    return GroqResponseProvider(
        api_key=settings.GROQ_API_KEY,
        model=settings.GROQ_CHAT_MODEL,
        base_url=settings.GROQ_BASE_URL,
    )
