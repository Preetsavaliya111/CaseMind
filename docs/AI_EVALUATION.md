# AI evaluation

CaseMind currently has provider contract tests, retrieval authorization tests and honest no-provider behavior. It does not yet claim measured retrieval or generation accuracy.

## Evaluation dataset format

Store approved, non-sensitive support examples outside production secrets. Each record should include:

```json
{
  "question": "How do we recover access after an identity certificate rotation?",
  "expected_relevant_sources": ["memory:<id>", "knowledge:<id>"],
  "expected_source_types": ["memory", "knowledge"],
  "answer_characteristics": ["mentions verification", "provides ordered steps"],
  "forbidden_claims": ["claims a successful deployment without evidence"],
  "expected_citation_behavior": "cite every factual recommendation"
}
```

## Metrics

Retrieval evaluation should calculate Recall@K, Precision@K, MRR, source diversity and duplicate rate. Generation evaluation should use reviewed labels for groundedness, citation correctness, completeness, contradiction rate, hallucination rate and insufficient-evidence/refusal accuracy. Operational runs should record retrieval, embedding and provider latency, token usage and failures.

Results must include dataset version, model/provider configuration, sample count and confidence/labeling method. Do not display an accuracy percentage until the dataset and review process exist. An internal evaluation dashboard and durable dataset runner are planned work, not current product capabilities.
