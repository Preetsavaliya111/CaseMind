# AI and retrieval

CaseMind uses a modular provider boundary: Groq Responses API generation and Gemini embeddings live in `backend/app/providers`, while organization rules and evidence construction live in `backend/app/services/rag_service.py`. Provider credentials are read only by the backend.

## Ingestion

Documents are validated by extension, declared MIME type, content signature, and byte limit. Files are stored under generated organization/document identifiers, extracted, normalized, chunked with overlap, and persisted before embedding. A document is marked `indexed` only after embeddings and Qdrant upsert both succeed. Without a configured provider it remains truthfully `ready_for_indexing`.

## Retrieval

The query path combines bounded lexical candidates from verified Memory, Cases, published Knowledge, and extracted document chunks with Qdrant results when embeddings are available. SQL access requires the authenticated organization plus the user's effective permission, team, and department scope. Qdrant results are re-hydrated through those SQL rules, so an inaccessible same-organization vector is discarded before prompt construction. Results are deduplicated and ranked only after authorization.

## Generation and safety

Retrieved content is labeled as untrusted evidence and kept separate from system instructions. The model is instructed to use only supplied evidence, cite claims with stable `[S#]` keys, disclose insufficient or conflicting evidence, and ignore instructions embedded in sources. Responses API storage is disabled. The API returns structured citations with source identifiers, excerpts, relevance signals, and in-product locators.

If no provider key exists, generation returns a service-unavailable response and the frontend displays a setup-pending state. CaseMind never substitutes fixture answers or invented confidence values.

## Configuration

Set `GROQ_API_KEY`, `GROQ_CHAT_MODEL`, `GEMINI_API_KEY`, `GEMINI_EMBEDDING_MODEL`, `QDRANT_URL`, and `QDRANT_COLLECTION` in `backend/.env`. After adding the keys, reprocess documents in `ready_for_indexing` state so vectors are created.
