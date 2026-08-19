import { useState, useEffect } from 'react'
import {
  Brain, CheckCircle2, AlertTriangle, RefreshCw, Zap, Sparkles
} from 'lucide-react'

import {
  Card, CardContent, CardHeader, CardTitle,
  Badge, Button, Progress,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui'
import { StatCard } from '@/components/common'
import { useAdminModels, useAdminExperiments, useUpdateModelStatus } from '@/features/admin/hooks/useAdmin'
import type { ModelConfig, ModelExperiment } from '@/types'

export function AdminModelsPage() {
  const { data: initialModels = [] } = useAdminModels()
  const { data: initialExperiments = [] } = useAdminExperiments()
  const [models, setModels] = useState<ModelConfig[]>(initialModels)
  const [experiments, setExperiments] = useState<ModelExperiment[]>(initialExperiments)
  const [retrainingModel, setRetrainingModel] = useState<ModelConfig | null>(null)
  const [retrainingProgress, setRetrainingProgress] = useState(0)
  const updateStatusMutation = useUpdateModelStatus()

  // Sync state with query
  useEffect(() => {
    if (initialModels.length > 0) {
      setModels(initialModels)
    }
  }, [initialModels])

  useEffect(() => {
    if (initialExperiments.length > 0) {
      setExperiments(initialExperiments)
    }
  }, [initialExperiments])

  const activeCount = models.filter((m) => m.status === 'active').length
  const avgAccuracy = (models.reduce((s, m) => s + m.health.accuracy, 0) / models.length).toFixed(1)
  const highDrift = models.filter((m) => m.driftScore >= 0.12).length


  const handleStartRetrain = async (model: ModelConfig) => {
    setRetrainingModel(model)
    setRetrainingProgress(10)
    for (let i = 20; i <= 100; i += 20) {
      await new Promise((r) => setTimeout(r, 600))
      setRetrainingProgress(i)
    }
    updateStatusMutation.mutate({ modelId: model.id, status: 'active' })
    setModels((prev) =>
      prev.map((m) =>
        m.id === model.id
          ? {
              ...m,
              status: 'active',
              driftScore: 0.02,
              f1Score: Math.min(Number((m.f1Score + 0.02).toFixed(3)), 0.99),
              lastTrainedAt: new Date().toISOString(),
            }
          : m
      )
    )
    setTimeout(() => {
      setRetrainingModel(null)
      setRetrainingProgress(0)
    }, 800)
  }

  function driftBadge(score: number) {
    if (score < 0.05) return <Badge variant="success" className="font-mono text-2xs">Healthy ({score})</Badge>
    if (score < 0.12) return <Badge variant="warning" className="font-mono text-2xs">Low Drift ({score})</Badge>
    return <Badge variant="critical" className="font-mono text-2xs">Drift Alert ({score})</Badge>
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
          ML Model Monitoring & Ingestion
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Real-time tracking of transformer classifiers, sentiment analyzers, and organizational memory embedding models.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Production Models"
          value={activeCount}
          icon={Brain}
          description="5 deployed inference pipelines"
        />
        <StatCard
          title="Avg Inference Accuracy"
          value={`${avgAccuracy}%`}
          icon={CheckCircle2}
          iconClassName="bg-success/10"
        />
        <StatCard
          title="Drift Risk Flags"
          value={highDrift}
          icon={AlertTriangle}
          iconClassName={highDrift > 0 ? 'bg-warning/10 text-warning' : 'bg-success/10'}
          description={highDrift > 0 ? 'Retraining triggered' : 'All embeddings healthy'}
        />
        <StatCard
          title="Avg Inference Latency"
          value="48ms"
          icon={Zap}
          iconClassName="bg-purple-500/10"
          description="99.9% p95 SLA met"
        />
      </div>

      {/* Production Models Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold font-display flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              Deployed AI / ML Models
            </CardTitle>
            <Badge variant="secondary" className="text-2xs font-mono">
              PyTorch / HuggingFace / OpenAI
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b text-xs text-muted-foreground">
                <tr className="text-left">
                  <th scope="col" className="px-4 py-2.5">Model Name</th>
                  <th scope="col" className="px-4 py-2.5">Status</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Accuracy</th>
                  <th scope="col" className="px-4 py-2.5 text-right">F1 Score</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Latency</th>
                  <th scope="col" className="px-4 py-2.5 text-center">Drift State</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {models.map((model) => (
                  <tr key={model.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground text-xs">{model.name}</div>
                      <div className="text-2xs text-muted-foreground font-mono">
                        {model.version} · {model.provider}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={model.status === 'active' ? 'success' : model.status === 'retraining' ? 'warning' : 'secondary'}
                        className="text-2xs uppercase"
                      >
                        {model.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-foreground">
                      {model.health.accuracy}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-foreground">
                      {model.f1Score}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                      {model.health.latencyMs}ms
                    </td>
                    <td className="px-4 py-3 text-center">
                      {driftBadge(model.driftScore)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5"
                        onClick={() => handleStartRetrain(model)}
                        disabled={model.status === 'retraining' || Boolean(retrainingModel)}
                      >
                        <RefreshCw className="h-3 w-3" />
                        Retrain
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MLflow-Style Experiment Runs */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold font-display flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              Active A/B Fine-Tuning Experiments (MLflow)
            </CardTitle>
            <span className="text-2xs text-muted-foreground">Auto-promotes when p &lt; 0.01</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b text-xs text-muted-foreground">
                <tr className="text-left">
                  <th scope="col" className="px-4 py-2.5">Experiment</th>
                  <th scope="col" className="px-4 py-2.5">Target Model</th>
                  <th scope="col" className="px-4 py-2.5 text-center">Control vs Variant</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Runs Evaluated</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Metric Uplift</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {experiments.map((exp) => (
                  <tr key={exp.id} className="hover:bg-muted/20 transition-colors text-xs">
                    <td className="px-4 py-3 font-semibold text-foreground">{exp.name}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono">{exp.modelName}</td>
                    <td className="px-4 py-3 text-center font-mono">
                      <span className="text-muted-foreground">{exp.controlAccuracy}%</span>
                      <span className="mx-2 text-primary font-bold">→</span>
                      <span className="text-success font-bold">{exp.variantAccuracy}%</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                      {exp.runsCompleted} / {exp.targetRuns}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-success">
                      {exp.bestMetric}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge
                        variant={exp.status === 'completed' ? 'success' : 'default'}
                        className="text-2xs uppercase"
                      >
                        {exp.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Retrain Simulation Dialog */}
      <Dialog open={Boolean(retrainingModel)} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Retraining {retrainingModel?.name}
            </DialogTitle>
            <DialogDescription className="pt-1 text-xs">
              Fetching latest domain fine-tuning dataset, computing loss gradients, and updating LoRA adapter weights.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-muted-foreground">Epoch Progress</span>
              <span className="font-bold text-primary">{retrainingProgress}%</span>
            </div>
            <Progress value={retrainingProgress} className="h-2" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
