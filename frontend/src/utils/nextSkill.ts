import type { GraphNode } from '../types/api'

// TEMPORARY: until the backend exposes the recommendation endpoint,
// suggest the first skill that is ready to start.
// Replace this with the real "next best skill" result from the API.
export function pickNextSkill(skills: GraphNode[]): GraphNode | undefined {
  return skills.find((s) => s.userState === 'READY')
}