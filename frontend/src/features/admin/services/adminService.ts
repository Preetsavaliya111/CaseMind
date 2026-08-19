import type { User, UserRole, ModelConfig, ModelExperiment } from '@/types'
import { mockUsers, mockModels, mockExperiments } from '@/mocks'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export interface InviteUserPayload {
  name: string
  email: string
  role: UserRole
  department: string
}

export interface CreateModelPayload {
  name: string
  version: string
  provider: string
  purpose: string
}

export interface CreateExperimentPayload {
  name: string
  modelName: string
  targetRuns?: number
}

export interface IAdminService {
  getUsers(): Promise<User[]>
  inviteUser(payload: InviteUserPayload): Promise<User>
  updateUserRole(userId: string, role: UserRole): Promise<User>
  toggleUserStatus(userId: string, isActive: boolean): Promise<User>
  getModels(): Promise<ModelConfig[]>
  createModel(payload: CreateModelPayload): Promise<ModelConfig>
  updateModelStatus(modelId: string, status: ModelConfig['status']): Promise<ModelConfig>
  getExperiments(): Promise<ModelExperiment[]>
  createExperiment(payload: CreateExperimentPayload): Promise<ModelExperiment>
}

class MockAdminService implements IAdminService {
  private users: User[] = [...mockUsers]
  private models: ModelConfig[] = [...mockModels]
  private experiments: ModelExperiment[] = [...mockExperiments]

  async getUsers(): Promise<User[]> {
    await delay(300)
    return [...this.users]
  }

  async inviteUser(payload: InviteUserPayload): Promise<User> {
    await delay(500)
    const newUser: User = {
      id: `usr_${Date.now()}`,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      department: payload.department,
      isActive: true,
      createdAt: new Date().toISOString(),
    }
    this.users.unshift(newUser)
    return newUser
  }

  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    await delay(300)
    const user = this.users.find((u) => u.id === userId)
    if (!user) throw new Error(`User ${userId} not found`)
    user.role = role
    return user
  }

  async toggleUserStatus(userId: string, isActive: boolean): Promise<User> {
    await delay(300)
    const user = this.users.find((u) => u.id === userId)
    if (!user) throw new Error(`User ${userId} not found`)
    user.isActive = isActive
    return user
  }

  async getModels(): Promise<ModelConfig[]> {
    await delay(350)
    return [...this.models]
  }

  async createModel(payload: CreateModelPayload): Promise<ModelConfig> {
    await delay(500)
    const newModel: ModelConfig = {
      id: `mdl_${Date.now()}`,
      name: payload.name,
      version: payload.version,
      provider: payload.provider,
      purpose: payload.purpose,
      status: 'standby',
      driftScore: 0.02,
      f1Score: 0.92,
      lastTrainedAt: new Date().toISOString(),
      nextRetrainingAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      totalPredictions: 0,
      health: {
        accuracy: 94.0,
        latencyMs: 45,
        errorRate: 0.05,
        requestsPerHour: 100,
        lastEvaluatedAt: new Date().toISOString(),
        accuracyTrend: [{ date: new Date().toISOString().split('T')[0], value: 94.0 }],
        latencyTrend: [{ date: new Date().toISOString().split('T')[0], value: 45 }],
      },
    }
    this.models.unshift(newModel)
    return newModel
  }

  async updateModelStatus(modelId: string, status: ModelConfig['status']): Promise<ModelConfig> {
    await delay(300)
    const model = this.models.find((m) => m.id === modelId)
    if (!model) throw new Error(`Model ${modelId} not found`)
    model.status = status
    return model
  }

  async getExperiments(): Promise<ModelExperiment[]> {
    await delay(300)
    return [...this.experiments]
  }

  async createExperiment(payload: CreateExperimentPayload): Promise<ModelExperiment> {
    await delay(500)
    const newExp: ModelExperiment = {
      id: `exp_${Date.now()}`,
      name: payload.name,
      modelName: payload.modelName,
      status: 'running',
      controlAccuracy: 94.2,
      variantAccuracy: 95.8,
      runsCompleted: 0,
      targetRuns: payload.targetRuns || 1000,
      startedAt: new Date().toISOString(),
      bestMetric: 'F1: 0.958',
    }
    this.experiments.unshift(newExp)
    return newExp
  }
}

export const adminService: IAdminService = new MockAdminService()
