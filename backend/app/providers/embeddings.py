import json
from dataclasses import dataclass
from typing import Protocol
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.core.config import settings


class EmbeddingProviderError(RuntimeError):
    pass


class EmbeddingProvider(Protocol):
    def embed(self, texts: list[str], *, task_type: str = "RETRIEVAL_DOCUMENT") -> list[list[float]]: ...


@dataclass
class GeminiEmbeddingProvider:
    api_key: str
    model: str
    base_url: str
    dimensions: int

    def embed(self, texts: list[str], *, task_type: str = "RETRIEVAL_DOCUMENT") -> list[list[float]]:
        if not texts:
            return []
        model_name = self.model.removeprefix("models/")
        resource_name = f"models/{model_name}"
        requests = [
            {
                "model": resource_name,
                "content": {"parts": [{"text": text}]},
                "taskType": task_type,
                "outputDimensionality": self.dimensions,
            }
            for text in texts
        ]
        payload = json.dumps({"requests": requests}).encode("utf-8")
        request = Request(
            f"{self.base_url.rstrip('/')}/{resource_name}:batchEmbedContents",
            data=payload,
            method="POST",
            headers={
                "x-goog-api-key": self.api_key,
                "Content-Type": "application/json",
                "User-Agent": "CaseMind/0.1",
            },
        )
        try:
            with urlopen(request, timeout=60) as response:
                body = json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            raise EmbeddingProviderError(f"Embedding provider returned HTTP {exc.code}") from exc
        except (URLError, TimeoutError, ValueError) as exc:
            raise EmbeddingProviderError("Embedding provider is unavailable") from exc

        vectors = [item.get("values") for item in body.get("embeddings", [])]
        if (
            len(vectors) != len(texts)
            or any(not isinstance(vector, list) for vector in vectors)
            or any(len(vector) != self.dimensions for vector in vectors)
        ):
            raise EmbeddingProviderError("Embedding provider returned an invalid response")
        return vectors


def get_embedding_provider() -> EmbeddingProvider | None:
    if not settings.GEMINI_API_KEY:
        return None
    if settings.EMBEDDING_PROVIDER.lower() != "gemini":
        raise EmbeddingProviderError("Configured embedding provider is not supported")
    return GeminiEmbeddingProvider(
        api_key=settings.GEMINI_API_KEY,
        model=settings.GEMINI_EMBEDDING_MODEL,
        base_url=settings.GEMINI_BASE_URL,
        dimensions=settings.GEMINI_EMBEDDING_DIMENSIONS,
    )
