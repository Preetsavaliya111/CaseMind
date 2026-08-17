// Admin / ML Model Monitoring type definitions

export type ModelStatus = 'active' | 'standby' | 'degraded' | 'failed' | 'retraining'
export type ExperimentStatus = 'running' | 'completed' | 'failed' | 'pending'

export interface ModelMetricPoint {
  date: string
  value: number
}

export interface ModelHealth {
  accuracy: number          // 0–100
  latencyMs: number         // avg inference latency
  errorRate: number         // 0–100
  requestsPerHour: number
  lastEvaluatedAt: string
  accuracyTrend: ModelMetricPoint[]
  latencyTrend: ModelMetricPoint[]
}

export interface ModelConfig {
  id: string
  name: string
  version: string
  provider: string          // "OpenAI", "Anthropic", "Internal"
  status: ModelStatus
  purpose: string           // "ticket classification", "priority prediction", etc.
  health: ModelHealth
  driftScore: number        // 0–1 (>0.1 = concern, >0.2 = retrain)
  f1Score: number           // 0–1
  lastTrainedAt: string
  nextRetrainingAt?: string
  totalPredictions: number
  experiment?: string       // linked experiment name
}

export interface ModelExperiment {
  id: string
  name: string
  status: ExperimentStatus
  modelName: string
  controlAccuracy: number   // baseline %
  variantAccuracy: number   // challenger %
  runsCompleted: number
  targetRuns: number
  startedAt: string
  completedAt?: string
  winner?: 'control' | 'variant' | 'inconclusive'
  statisticalSignificance?: number  // 0–1 (>0.95 = significant)
  bestMetric: string                // e.g. "F1: 0.941"
}

export type IngestionStatus = 'pending' | 'uploading' | 'parsing' | 'chunking' | 'embedding' | 'indexed' | 'failed'

export interface IngestionJob {
  id: string
  filename: string
  title: string
  category: string
  tags: string[]
  status: IngestionStatus
  uploadedBy: string
  uploadedAt: string
  completedAt?: string
  errorMessage?: string
  progress: number          // 0–100
  chunkCount?: number       // set after chunking
  embeddingDimensions?: number
}
