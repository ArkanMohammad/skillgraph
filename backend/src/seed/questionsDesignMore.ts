/**
 * More questions: design skills.
 * Each skill gets 5 more questions (2 easy, 1 medium, 2 hard), so the bank of every skill
 * has 15 questions: 5 easy, 5 medium, 5 hard. An assessment asks 10 of them.
 * Format: [conceptIndex, difficulty, prompt, correct, [wrong1, wrong2, wrong3]]
 */
import { ExtraQuestions } from './types';

export const designMoreQuestions: ExtraQuestions[] = [
  {
    skill: 'Design Principles',
    questions: [
      [0, 1, 'Which element usually draws the eye first on a page?', 'The largest element with the highest contrast', ['The smallest text', 'The footer', 'The element with the least contrast']],
      [1, 1, 'What is a grid in design?', 'A set of guides that helps place elements consistently', ['A type of font', 'A color palette', 'A prototype tool']],
      [2, 2, 'What does recognition rather than recall mean?', 'Show options so users do not have to remember them', ['Users must memorize shortcuts', 'Hide the menus', 'Use only icons']],
      [1, 3, 'What does the Gestalt principle of closure say?', 'People mentally complete shapes that are not fully drawn', ['People ignore symmetry', 'People see only the largest object', 'People remember colors better than shapes']],
      [2, 3, 'Which heuristic do clear error messages that suggest a fix support?', 'Help users recognize, diagnose and recover from errors', ['Aesthetic and minimalist design', 'Flexibility and efficiency of use', 'Consistency and standards']],
    ],
  },
  {
    skill: 'Color & Typography',
    questions: [
      [0, 1, 'What is a color palette?', 'A chosen set of colors used in a design', ['A tool for erasing colors', 'A font family', 'A camera filter']],
      [1, 1, 'What is a typeface?', 'A design of letters, such as Helvetica', ['The size of text', 'The color of text', 'The space between lines']],
      [2, 2, 'What is kerning?', 'The space between two specific letters', ['The space between lines', 'The thickness of letters', 'The size of the margins']],
      [0, 3, 'What does color temperature describe?', 'Whether a color feels warm (reds, oranges) or cool (blues, greens)', ['How bright a screen is', 'The contrast ratio', 'How many colors a printer can use']],
      [1, 3, 'Why limit a design to two or three typefaces?', 'Too many typefaces make a design look inconsistent and hard to read', ['Browsers support only three fonts', 'More fonts cost more', 'Typefaces cannot be combined']],
    ],
  },
  {
    skill: 'User Research',
    questions: [
      [0, 1, 'Which of these is a quantitative research method?', 'A survey with numeric ratings', ['A one-on-one interview', 'A diary study', 'An observation session']],
      [1, 1, 'Why get consent from research participants?', 'They must agree to take part and know how their data is used', ['It speeds up the session', 'It is only needed for children', 'It guarantees good answers']],
      [2, 2, 'What is a user journey map?', 'A visualization of the steps, feelings and pain points of a user across an experience', ['A map of the office', 'A sitemap of the website', 'A list of all features']],
      [0, 3, 'What is confirmation bias in research?', 'Noticing only the evidence that supports what you already believe', ['Confirming the time of the meeting', 'Asking every participant the same question', 'Choosing the right sample size']],
      [1, 3, 'Why are a few interviews not enough to say how many users prefer a feature?', 'The small sample cannot represent the whole user population statistically', ['Interviews cannot be recorded', 'Interviews are always illegal', 'Participants never answer honestly']],
    ],
  },
  {
    skill: 'Wireframing',
    questions: [
      [0, 1, 'What does fidelity describe in wireframes?', 'How detailed and realistic the wireframe looks', ['How fast it loads', 'How many users approve it', 'The size of the file']],
      [1, 1, 'What is a call to action (CTA)?', 'An element, often a button, that invites the user to do something', ['A legal notice', 'A footer link', 'A color rule']],
      [2, 2, 'Why share wireframes with stakeholders early?', 'To collect feedback before expensive design and development work', ['To skip user research', 'To finalize the colors', 'To avoid documentation']],
      [1, 3, 'What does above the fold mean?', 'The part of a page that is visible without scrolling', ['The footer of the page', 'The hidden menu', 'The printed version of the page']],
      [0, 3, 'What is the risk of making a wireframe too detailed too early?', 'Feedback focuses on small visual details instead of structure and flow', ['It cannot be exported', 'It needs a developer', 'It always costs more to print']],
    ],
  },
  {
    skill: 'Figma',
    questions: [
      [0, 1, 'Which tool in Figma adds text?', 'The Text tool (T)', ['The Pen tool (P)', 'The Frame tool (F)', 'The Comment tool (C)']],
      [2, 1, 'What does a view-only share link allow?', 'Others can look at the design but not edit it', ['Others can edit everything', 'Others can delete the file', 'Others can publish the library']],
      [1, 2, 'What is an instance in Figma?', 'A copy of a main component that stays linked to it', ['A deleted component', 'A page of a file', 'A plugin']],
      [0, 3, 'How does Hug contents differ from Fill container in Auto Layout?', 'Hug sizes the frame to fit its children, Fill stretches it to fill the parent', ['Hug makes text bold', 'Fill hides the children', 'They are the same setting']],
      [2, 3, 'What is the benefit of a shared library in Figma?', 'Teams reuse the same components and styles across files', ['It makes frames export faster', 'It removes the need for components', 'It prevents others from commenting']],
    ],
  },
  {
    skill: 'Prototyping',
    questions: [
      [0, 1, 'What does an on click trigger do in a prototype?', 'Starts an action, such as going to another screen, when the user clicks', ['Deletes the screen', 'Exports the file', 'Changes the font']],
      [1, 1, 'Which tool can you use to build a clickable prototype?', 'Figma', ['Excel', 'Notepad', 'Wireshark']],
      [2, 2, 'What should you watch for while a user tests a prototype?', 'Where they hesitate or get lost', ['Only what they say they like', 'How fast they type', 'The brand colors']],
      [1, 3, 'Why can a high-fidelity prototype be risky early in a project?', 'People focus on visuals and the team gets attached to one solution', ['It cannot be clicked', 'It always needs code', 'It cannot be shared']],
      [0, 3, 'What is the purpose of a smart animate transition?', 'Animating matching layers smoothly between two screens', ['Compressing images automatically', 'Writing code for developers', 'Checking accessibility']],
    ],
  },
  {
    skill: 'Usability Testing',
    questions: [
      [0, 1, 'Who is a participant in a usability test?', 'A person who tries to complete tasks with the product', ['The designer who made it', 'A developer who fixes bugs', 'A manager who approves it']],
      [1, 1, 'What should a moderator avoid doing?', 'Leading the participant to the answer', ['Taking notes', 'Greeting the participant', 'Thanking the participant']],
      [2, 2, 'What does the task success rate measure?', 'The share of tasks that participants completed successfully', ['How long the test took', 'How many pages exist', 'How many participants were invited']],
      [0, 3, 'Why run a pilot test before the real sessions?', 'To find problems in the tasks and the setup', ['To replace the real sessions', 'To collect all the data', 'To avoid recruiting users']],
      [2, 3, 'Why does a usability report rank the issues by severity?', 'So the team fixes the most harmful problems first', ['To make the report longer', 'To blame the designers', 'To count the participants']],
    ],
  },
  {
    skill: 'Design Systems',
    questions: [
      [2, 1, 'What does a single source of truth mean for a design system?', 'One shared place holds the approved styles and components', ['Each team keeps its own copy', 'The design is stored in emails', 'Only one person may use it']],
      [1, 1, 'Which of these is a common UI component?', 'Button', ['Database', 'Server', 'Compiler']],
      [2, 2, 'Why version a design system?', 'Teams know what changed and can upgrade safely', ['To hide old components', 'To make it bigger', 'To avoid documentation']],
      [0, 3, 'Why name tokens by purpose (color-text-danger) instead of by value (red-500)?', 'The meaning stays the same when the actual color changes, for example in a dark theme', ['The names are shorter', 'Browsers read them faster', 'It removes the need for color contrast']],
      [1, 3, 'What is the difference between a component and a pattern?', 'A component is one reusable piece, a pattern combines components to solve a common problem', ['They are the same thing', 'Patterns exist only in print', 'Components exist only in code']],
    ],
  },
];