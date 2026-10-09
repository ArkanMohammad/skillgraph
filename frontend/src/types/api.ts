// Shared contracts between the frontend and the backend REST API

// Role values exactly as the backend returns them
export type UserRole = 'USER' | 'ADMIN'

// Authenticated user (id is a UUID string, not a number)
export type User = {
  id: string
  name: string
  email: string
  role: UserRole
}

// Response of POST /auth/login
export type LoginResponse = {
  message: string
  token: string
  user: User
}

// Represents a learning goal available in SkillGraph
// Career goal returned by GET /goals (description can be empty in the DB)
export type Goal = {
  id: number
  name: string
  description: string | null
}

// Response of GET /goals
export type GoalsResponse = {
  goals: Goal[]
}

// All learning states a skill can have
export type SkillStatus =
  | 'LOCKED'
  | 'READY'
  | 'LEARNING'
  | 'PRACTICING'
  | 'ASSESSING'
  | 'MASTERED'

// Skill node of the graph; mastery and confidence are percentages (0-100)
export type GraphNode = {
  id: number
  name: string
  category: string | null
  requiredMastery: number
  userState: SkillStatus
  mastery: number
  confidence: number
}

// Prerequisite edge: source must be learned before target
export type GraphEdge = {
  source: number
  target: number
  requiredMastery: number
}

// Response of GET /graph/:goalId
export type GraphResponse = {
  nodes: GraphNode[]
  edges: GraphEdge[]
}