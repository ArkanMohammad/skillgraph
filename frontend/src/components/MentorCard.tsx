import { GraduationCap } from 'lucide-react'
import { useMyMentors } from '../hooks/useMyMentors'
import '../styles/mentors.css'

// First letter of a name, shown inside the round avatar
function initial(name: string) {
  return name.trim().charAt(0).toUpperCase() || '?'
}

// Dashboard card: the mentors who look after the goal the user follows.
// It stays hidden until an admin assigns a mentor to the goal.
function MentorCard() {
  const { data, loading } = useMyMentors()

  if (loading || !data || data.mentors.length === 0) return null

  return (
    <div className="card mentor-card">
      <h3>
        <GraduationCap size={20} /> Your {data.mentors.length === 1 ? 'mentor' : 'mentors'}
      </h3>
      <p className="muted">
        {data.mentors.length === 1 ? 'Looks' : 'Look'} after the learners of {data.goal.name}.
      </p>
      <div className="mentor-list">
        {data.mentors.map((mentor) => (
          <div className="mentor-person" key={mentor.id}>
            <span className="mentor-avatar" aria-hidden="true">
              {initial(mentor.name)}
            </span>
            <span className="mentor-name">{mentor.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MentorCard