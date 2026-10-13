/**
 * Extra questions: design skills.
 * Each skill gets 4 more questions (1 easy, 2 medium, 1 hard) on top of its 6 base questions,
 * so the bank of every skill has 10 questions: 3 easy, 4 medium, 3 hard.
 * Format: [conceptIndex, difficulty, prompt, correct, [wrong1, wrong2, wrong3]]
 */
import { ExtraQuestions } from './types';

export const designExtraQuestions: ExtraQuestions[] = [
  {
    skill: 'Design Principles',
    questions: [
      [0, 1, 'What is white space (negative space) in a design?', 'The empty space around and between elements', ['Only white colored areas', 'Text that is hidden', 'A bug in the layout']],
      [1, 2, 'What does alignment improve?', 'Order and a clean, organized look', ['The file size', 'The server speed', 'The number of colors']],
      [2, 2, 'Which heuristic means the interface should use words and concepts familiar to the user?', 'Match between the system and the real world', ['Flexibility and efficiency of use', 'Aesthetic and minimalist design', 'Help and documentation']],
      [0, 3, 'What does the Gestalt principle of similarity say?', 'Elements that look alike are seen as related', ['Elements that are far apart are grouped', 'Only colors matter', 'Bigger elements are always related']],
    ],
  },
  {
    skill: 'Color & Typography',
    questions: [
      [0, 1, 'Which colors are next to each other on the color wheel?', 'Analogous colors', ['Complementary colors', 'Triadic colors', 'Monochrome colors']],
      [1, 2, 'What is the difference between serif and sans-serif fonts?', 'Serif fonts have small strokes at the ends of letters; sans-serif fonts do not', ['Serif fonts are always bold', 'Sans-serif fonts are only for code', 'There is no visual difference']],
      [2, 2, 'Why use enough whitespace between paragraphs?', 'It makes text easier to scan and read', ['It reduces page weight', 'It makes colors brighter', 'It hides errors']],
      [0, 3, 'What is the minimum WCAG AA contrast ratio for large text?', '3:1', ['1.5:1', '7:1', '10:1']],
    ],
  },
  {
    skill: 'User Research',
    questions: [
      [0, 1, 'Which research method watches users in their real environment?', 'Field observation', ['Online card sorting', 'A/B testing', 'Keyword research']],
      [1, 2, 'Why ask "tell me more" and "why" in an interview?', 'To uncover the reasons and details behind answers', ['To end the interview sooner', 'To lead the user to your idea', 'To avoid taking notes']],
      [2, 2, 'What is affinity mapping?', 'Grouping notes and findings by similar themes', ['Drawing the final UI', 'Testing server speed', 'Choosing brand colors']],
      [1, 3, 'What is a common problem with surveys that have only closed questions?', 'They may miss reasons and unexpected answers', ['They cost too much', 'They cannot be analyzed', 'They need no participants']],
    ],
  },
  {
    skill: 'Wireframing',
    questions: [
      [0, 1, 'Which of these tools is commonly used to create wireframes?', 'Figma', ['Excel', 'Notepad', 'Terminal']],
      [1, 2, 'What does a sitemap show?', 'The structure and hierarchy of the pages in a product', ['The color palette', 'The server layout', 'The database tables']],
      [2, 2, 'Why use placeholder text such as lorem ipsum in a wireframe?', 'To show where content goes without distracting from the structure', ['To provide the final copy', 'To test the spelling', 'To increase page speed']],
      [1, 3, 'Why should primary actions in a wireframe be easy to find?', 'Users should complete key tasks without searching', ['To decorate the page', 'To hide the secondary links', 'To reduce the number of pages']],
    ],
  },
  {
    skill: 'Figma',
    questions: [
      [0, 1, 'Which tool in Figma draws a rectangle?', 'The Rectangle tool', ['The Comment tool', 'The Hand tool', 'Dev Mode']],
      [1, 2, 'What happens to the instances when you change the main component?', 'The instances update with the change', ['Nothing changes', 'They are deleted', 'They turn into frames']],
      [2, 2, 'What are Figma styles and variables useful for?', 'Reusing colors, text and spacing values consistently', ['Printing designs', 'Hosting websites', 'Recording audio']],
      [0, 3, 'What do constraints control in Figma?', 'How a layer behaves when its parent frame is resized', ['The file permissions', 'The export format', 'The font license']],
    ],
  },
  {
    skill: 'Prototyping',
    questions: [
      [0, 1, 'What is a hotspot in a prototype?', 'A clickable area that triggers an interaction', ['A heat map of users', 'A broken link', 'A color style']],
      [1, 2, 'When is a low-fidelity prototype a good choice?', 'Early on, to test ideas quickly and cheaply', ['Only right before launch', 'Only for developers', 'When pixel-perfect visuals are required']],
      [0, 2, 'What is a micro-interaction?', 'A small animation or feedback for one action, such as a like button', ['A tiny database', 'A short meeting', 'A one-pixel border']],
      [2, 3, 'What is the benefit of testing a prototype early with about 5 users?', 'You find the biggest problems quickly, before building', ['It proves the product is perfect', 'It replaces all later testing', 'It avoids the need for design']],
    ],
  },
  {
    skill: 'Usability Testing',
    questions: [
      [0, 1, 'How many participants are often enough for one round of small qualitative usability testing?', 'About 5', ['Exactly 1', 'About 500', 'Always 1000']],
      [1, 2, 'Why avoid explaining the interface to the participant during a test?', 'Real users will not have you beside them to explain it', ['It is rude', 'It makes the test shorter', 'Tests must be silent']],
      [2, 2, 'What does "time on task" measure?', 'How long a user needs to complete a task', ['How many colors are used', 'How fast the server is', 'The size of the screen']],
      [0, 3, 'Which of these is a good usability task?', '"Find and book a ticket for next Friday."', ['"Click the blue button."', '"Do you like the design?"', '"Look at the logo."']],
    ],
  },
  {
    skill: 'Design Systems',
    questions: [
      [0, 1, 'Which of these is an example of a design token?', 'A spacing value such as space-4', ['A random bug', 'A server log', 'A git branch']],
      [1, 2, 'Why define component states such as hover, disabled and error?', 'So the component behaves consistently in every situation', ['To increase the file size', 'To avoid documentation', 'To remove the need for testing']],
      [2, 2, 'What is a changelog useful for in a design system?', 'Teams can see what changed between versions', ['Storing passwords', 'Compressing images', 'Training users']],
      [2, 3, 'What is a good way to handle a team request for a new component?', 'Review it against the existing patterns and add it if it is reusable', ['Reject all requests', 'Copy it into every project', 'Let everyone edit the library freely']],
    ],
  },
];