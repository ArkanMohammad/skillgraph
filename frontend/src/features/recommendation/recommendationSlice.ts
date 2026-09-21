import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

// Represents the skill recommended by the SkillGraph algorithm
type RecommendedSkill = {
  skillId: number
  name: string
  score: number
  explanation: string
}

// Defines the recommendation state stored in Redux
type RecommendationState = {
  nextBestSkill: RecommendedSkill | null
}

// Initial state before the algorithm generates a recommendation
const initialState: RecommendationState = {
  nextBestSkill: null,
}

const recommendationSlice = createSlice({
  name: 'recommendation',
  initialState,

  reducers: {
    // Stores the next best skill selected by the recommendation algorithm
    setNextBestSkill: (
      state,
      action: PayloadAction<RecommendedSkill>
    ) => {
      state.nextBestSkill = action.payload
    },

    // Removes the current recommendation
    clearRecommendation: (state) => {
      state.nextBestSkill = null
    },
  },
})

// Export actions so they can be dispatched from components
export const {
  setNextBestSkill,
  clearRecommendation,
} = recommendationSlice.actions

// Export the reducer to register it in the Redux store
export default recommendationSlice.reducer