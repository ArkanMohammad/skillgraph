// Study links for a skill. The app does not store course data, so every link is a search
// built from the skill name. It always works and never goes stale.

export type LearningResource = {
  label: string
  description: string
  url: string
}

function search(base: string, query: string) {
  return `${base}${encodeURIComponent(query)}`
}

export function getLearningResources(skillName: string): LearningResource[] {
  return [
    {
      label: 'Video course',
      description: 'Beginner tutorials on YouTube',
      url: search('https://www.youtube.com/results?search_query=', `${skillName} full course for beginners`),
    },
    {
      label: 'Official documentation',
      description: 'The most accurate and up-to-date reference',
      url: search('https://www.google.com/search?q=', `${skillName} official documentation`),
    },
    {
      label: 'Free interactive lessons',
      description: 'Articles and exercises on freeCodeCamp',
      url: search('https://www.freecodecamp.org/news/search/?query=', skillName),
    },
    {
      label: 'Practice projects',
      description: 'Small hands-on exercises to apply it',
      url: search('https://www.google.com/search?q=', `${skillName} practice exercises projects for beginners`),
    },
  ]
}

// Practical advice, adjusted to the time the skill needs and how much is already known
export function getStudyTips(hours: number, mastery: number): string[] {
  const sessions = Math.max(1, Math.ceil(hours / 1.5))
  const tips = [
    `Plan about ${sessions} study ${sessions === 1 ? 'session' : 'sessions'} of 1 to 1.5 hours each (around ${hours} hours in total).`,
    'Start with one video course to get the big picture, then read the official documentation for details.',
    'Build something small while you learn. Practice sticks much better than watching.',
  ]
  if (mastery > 0) {
    tips.push(`You already know part of this (${mastery}%), so skip the basics you are comfortable with and focus on the gaps.`)
  }
  tips.push('Take the test when you feel ready. Your result updates the recommendation right away.')
  return tips
}