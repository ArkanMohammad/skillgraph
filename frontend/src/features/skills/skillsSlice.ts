import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

// Represents the possible learning states of a skill
type SkillStatus =
  | 'LOCKED'
  | 'READY'
  | 'LEARNING'
  | 'PRACTICING'
  | 'ASSESSING'
  | 'MASTERED'

// Represents the user's current progress in a specific skill
type UserSkill = {
  skillId: number
  name: string
  mastery: number
  confidence: number
  status: SkillStatus
}

// Defines the skills-related state stored in Redux
type SkillsState = {
  userSkills: UserSkill[]
}

// Initial state before the user's skills are loaded
const initialState: SkillsState = {
  userSkills: [],
}

const skillsSlice = createSlice({
  name: 'skills',
  initialState,

  reducers: {
    // Stores all of the user's skills and their current progress
    setUserSkills: (state, action: PayloadAction<UserSkill[]>) => {
      state.userSkills = action.payload
    },

    // Updates the progress of one specific skill
    updateUserSkill: (state, action: PayloadAction<UserSkill>) => {
      const index = state.userSkills.findIndex(
        (skill) => skill.skillId === action.payload.skillId
      )

      if (index !== -1) {
        state.userSkills[index] = action.payload
      }
    },
  },
})

// Export actions so they can be dispatched from components
export const { setUserSkills, updateUserSkill } = skillsSlice.actions

// Export the reducer to register it in the Redux store
export default skillsSlice.reducer