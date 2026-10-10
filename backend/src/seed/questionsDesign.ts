/**
 * Concepts and questions: UI/UX design skills
 * Format of each question: [conceptIndex, difficulty, prompt, correct, [wrong1, wrong2, wrong3]]
 */
import { SkillQuestions } from './types';

export const designQuestions: SkillQuestions[] = [
  {
    skill: 'Design Principles',
    concepts: [['Visual hierarchy', 0.35], ['Consistency & alignment', 0.35], ['Usability heuristics', 0.3]],
    questions: [
      [0, 1, 'What does visual hierarchy do?', 'Guides the eye to the most important elements first', ['Makes every element equally prominent', 'Adds animations', 'Reduces file size']],
      [1, 1, 'Why is consistency important in UI design?', 'Users learn patterns once and reuse them everywhere', ['It makes the design look old', 'It reduces the number of screens', 'It is required by browsers']],
      [2, 2, 'Which Nielsen heuristic says the system should always keep users informed about what is going on?', 'Visibility of system status', ['Error prevention', 'Recognition rather than recall', 'Aesthetic and minimalist design']],
      [0, 2, 'Which technique most effectively makes a heading stand out?', 'A larger size and higher weight than the body text', ['The same size as the body text', 'Using many different colors', 'Putting it in a box with a shadow only']],
      [1, 3, 'What does the Gestalt principle of proximity say?', 'Elements that are close together are perceived as related', ['Large elements are more important', 'Similar colors are always grouped', 'Elements on the left are read first']],
      [2, 3, 'Which heuristic does a destructive delete button with no confirmation or undo violate?', 'User control and freedom, and error prevention', ['Aesthetic design only', 'Consistency and standards only', 'Help and documentation']],
    ],
  },
  {
    skill: 'Color & Typography',
    concepts: [['Color theory & contrast', 0.4], ['Type choice & hierarchy', 0.35], ['Spacing & readability', 0.25]],
    questions: [
      [0, 1, 'Which colors are opposite each other on the color wheel?', 'Complementary colors', ['Analogous colors', 'Monochromatic colors', 'Triadic colors']],
      [1, 1, 'What is the "weight" of a typeface?', 'How thick or thin its strokes are', ['Its file size', 'Its age', 'Its language']],
      [0, 2, 'Why check the color contrast between text and background?', 'So the text is readable, including for people with low vision', ['To make the page load faster', 'To reduce the number of colors', 'Because browsers require it']],
      [1, 2, 'What is a good practice for body text?', 'Use a legible font at about 16px with a comfortable line height', ['Use all caps for long paragraphs', 'Use 10px to fit more content', 'Use a decorative script font']],
      [2, 3, 'What line-height range is generally comfortable for body text?', 'About 1.4 to 1.6 times the font size', ['Exactly 1.0', 'About 3.0', 'It does not matter']],
      [0, 3, 'In the 60-30-10 color rule, what does the 10% represent?', 'The accent color', ['The background', 'The text', 'The neutral color']],
    ],
  },
  {
    skill: 'User Research',
    concepts: [['Methods & planning', 0.4], ['Interviews & surveys', 0.35], ['Analysis & personas', 0.25]],
    questions: [
      [0, 1, 'What is the main goal of user research?', 'Understand users\' needs, behaviors and problems', ['Make the interface prettier', 'Write the code', 'Choose the logo']],
      [1, 1, 'Which method asks users open questions one-on-one?', 'User interviews', ['A/B testing', 'Analytics dashboards', 'Server logs']],
      [1, 2, 'What is a leading question?', 'A question that suggests the answer, such as "Don\'t you love this feature?"', ['A question with no answer', 'The first question asked', 'A question that is too long']],
      [0, 2, 'What is the difference between qualitative and quantitative research?', 'Qualitative explains why with words and observations; quantitative measures how much with numbers', ['Qualitative uses numbers and quantitative uses stories', 'They are identical', 'Quantitative is only for design']],
      [2, 3, 'What is a persona?', 'A fictional but research-based profile that represents a group of users', ['A real customer\'s private data', 'A team member role', 'A color palette']],
      [0, 3, 'How many participants does a small qualitative usability study usually need to reveal most major issues?', 'About 5', ['1', '50', '500']],
    ],
  },
  {
    skill: 'Wireframing',
    concepts: [['Purpose & fidelity', 0.4], ['Layout & flow', 0.35], ['Annotation & feedback', 0.25]],
    questions: [
      [0, 1, 'What is a wireframe?', 'A simple blueprint of a screen\'s layout and structure', ['A final polished design', 'A piece of code', 'A color palette']],
      [0, 1, 'Why use low-fidelity wireframes early in a project?', 'They are quick to make and easy to change', ['They look finished', 'They replace user testing', 'They need developers']],
      [1, 2, 'What does a user flow show?', 'The steps a user takes to complete a task', ['The color scheme', 'The database tables', 'The server layout']],
      [1, 2, 'In an F-shaped reading pattern, where do users look first?', 'Along the top, and then down the left side', ['The bottom right corner', 'The footer', 'The exact center only']],
      [2, 3, 'What is the benefit of adding annotations to a wireframe?', 'They explain behaviors and rules that the layout alone cannot show', ['They make it prettier', 'They replace the developer', 'They hide the layout']],
      [0, 3, 'Why keep color out of early wireframes?', 'So feedback focuses on structure and content, not decoration', ['Color is expensive', 'Wireframe tools cannot use color', 'Users dislike color']],
    ],
  },
  {
    skill: 'Figma',
    concepts: [['Frames & layout', 0.35], ['Components & variants', 0.35], ['Collaboration & handoff', 0.3]],
    questions: [
      [0, 1, 'In Figma, what is a Frame used for?', 'A container that works like an artboard or screen', ['A text style', 'A plugin', 'A comment']],
      [2, 1, 'How can teammates give feedback directly on a Figma file?', 'By leaving comments', ['By sending a Word file', 'By editing the code', 'By printing it']],
      [1, 2, 'What is a component in Figma?', 'A reusable element where changes to the main component update all instances', ['A one-time shape', 'A plugin', 'A font']],
      [0, 2, 'What does Auto Layout do?', 'Makes a frame resize and space its children automatically', ['Draws shapes automatically', 'Exports code', 'Creates animations only']],
      [1, 3, 'What are variants used for?', 'Grouping different states of one component, such as default, hover and disabled', ['Sharing files', 'Changing the canvas color', 'Zooming in']],
      [2, 3, 'What does Dev Mode help developers do?', 'Inspect spacing, styles and assets to implement the design', ['Edit the design freely', 'Delete components', 'Record videos']],
    ],
  },
  {
    skill: 'Prototyping',
    concepts: [['Interactions & transitions', 0.4], ['Fidelity & tools', 0.3], ['Testing prototypes', 0.3]],
    questions: [
      [0, 1, 'What is a prototype?', 'An interactive simulation of the product before it is built', ['The final shipped app', 'A database', 'A style guide']],
      [0, 1, 'In a clickable prototype, what links one screen to another?', 'Interactions or hotspots', ['Cookies', 'SQL queries', 'CSS variables']],
      [1, 2, 'What is the difference between low- and high-fidelity prototypes?', 'A high-fidelity prototype looks and behaves closer to the final product', ['A low-fidelity prototype is always interactive', 'A high-fidelity prototype has no visuals', 'They are identical']],
      [0, 2, 'What do smooth transitions between states help communicate?', 'Continuity and the relationship between two states', ['Server speed', 'Database changes', 'Legal terms']],
      [2, 3, 'Why test a prototype before development?', 'To find usability problems when they are cheapest to fix', ['To avoid hiring designers', 'To skip research', 'To reduce server cost']],
      [2, 3, 'What should you tell participants when testing a prototype?', 'That you are testing the design, not them', ['That they must finish every task', 'That the product is perfect', 'Nothing at all']],
    ],
  },
  {
    skill: 'Usability Testing',
    concepts: [['Planning & tasks', 0.35], ['Moderating & observing', 0.35], ['Metrics & reporting', 0.3]],
    questions: [
      [0, 1, 'What is the goal of usability testing?', 'Find where users struggle with a design', ['Increase page speed', 'Check server errors', 'Choose the font']],
      [0, 1, 'What is a task scenario?', 'A realistic goal given to participants, such as "Book a ticket for Friday"', ['A list of bugs', 'A code review', 'A sales script']],
      [1, 2, 'What does the think-aloud method ask users to do?', 'Say what they are thinking while they use the product', ['Stay silent', 'Read the manual', 'Answer a survey afterward only']],
      [2, 2, 'Which is a common usability metric?', 'Task success rate', ['Number of colors', 'Lines of code', 'Server uptime']],
      [1, 3, 'What should a moderator do when a participant is stuck?', 'Stay neutral, ask what they expect, and avoid giving the answer', ['Show them the answer immediately', 'End the session', 'Blame the participant']],
      [2, 3, 'What does the SUS questionnaire measure?', 'Perceived usability of a system', ['Server speed', 'Brand strength', 'Accessibility compliance']],
    ],
  },
  {
    skill: 'Design Systems',
    concepts: [['Tokens & foundations', 0.35], ['Components & patterns', 0.35], ['Governance & documentation', 0.3]],
    questions: [
      [0, 1, 'What is a design system?', 'A shared collection of reusable components, rules and guidelines', ['A single mockup', 'A programming language', 'A project plan']],
      [1, 1, 'Why reuse components?', 'It keeps the product consistent and speeds up work', ['It makes files bigger', 'It prevents testing', 'It removes the need for design']],
      [0, 2, 'What are design tokens?', 'Named values such as colors and spacing used across the system', ['Login tokens', 'Payment tokens', 'Browser plugins']],
      [1, 2, 'What does a pattern library describe?', 'How components are combined to solve common problems', ['Server routes', 'Legal terms', 'Database keys']],
      [2, 3, 'Why document usage guidelines for each component?', 'So teams use it correctly and consistently', ['To make the system look bigger', 'To replace designers', 'To avoid writing code']],
      [2, 3, 'What is a sign that a design system is working?', 'Teams ship faster with fewer inconsistencies', ['It has many files', 'It has a logo', 'It has no versions']],
    ],
  },
];