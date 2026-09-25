import json

from app.core.config import settings
from app.providers import embeddings, responses


class FakeHTTPResponse:
    def __init__(self, payload: dict):
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, traceback):
        return False

    def read(self) -> bytes:
        return json.dumps(self.payload).encode("utf-8")


def test_groq_response_provider_uses_responses_api(monkeypatch):
    captured = {}

    def fake_urlopen(request, timeout):
        captured["url"] = request.full_url
        captured["payload"] = json.loads(request.data)
        captured["authorization"] = request.get_header("Authorization")
        captured["user_agent"] = request.get_header("User-agent")
        captured["timeout"] = timeout
        return FakeHTTPResponse({"output_text": "Grounded answer [S1]"})

    monkeypatch.setattr(settings, "GROQ_API_KEY", "test-groq-key")
    monkeypatch.setattr(settings, "GROQ_CHAT_MODEL", "openai/gpt-oss-20b")
    monkeypatch.setattr(responses, "urlopen", fake_urlopen)

    provider = responses.get_response_provider()
    assert provider is not None
    answer = provider.generate(instructions="Use evidence", input_text="Question and sources")

    assert answer == "Grounded answer [S1]"
    assert captured["url"] == "https://api.groq.com/openai/v1/responses"
    assert captured["authorization"] == "Bearer test-groq-key"
    assert captured["user_agent"] == "CaseMind/0.1"
    assert captured["payload"]["model"] == "openai/gpt-oss-20b"
    assert captured["payload"]["store"] is False


def test_gemini_embedding_provider_batches_and_preserves_order(monkeypatch):
    captured = {}
    vectors = [[0.1] * 768, [0.2] * 768]

    def fake_urlopen(request, timeout):
        captured["url"] = request.full_url
        captured["payload"] = json.loads(request.data)
        captured["key"] = request.get_header("X-goog-api-key")
        captured["timeout"] = timeout
        return FakeHTTPResponse({"embeddings": [{"values": vector} for vector in vectors]})

    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-gemini-key")
    monkeypatch.setattr(settings, "GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")
    monkeypatch.setattr(settings, "GEMINI_EMBEDDING_DIMENSIONS", 768)
    monkeypatch.setattr(embeddings, "urlopen", fake_urlopen)

    provider = embeddings.get_embedding_provider()
    assert provider is not None
    result = provider.embed(["first", "second"], task_type="RETRIEVAL_QUERY")

    assert result == vectors
    assert captured["url"].endswith("/models/gemini-embedding-001:batchEmbedContents")
    assert captured["key"] == "test-gemini-key"
    requests = captured["payload"]["requests"]
    assert [request["content"]["parts"][0]["text"] for request in requests] == ["first", "second"]
    assert all(request["taskType"] == "RETRIEVAL_QUERY" for request in requests)
    assert all(request["outputDimensionality"] == 768 for request in requests)
