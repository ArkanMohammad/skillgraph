/**
 * Extra questions: web skills (frontend + backend).
 * Each skill gets 4 more questions (1 easy, 2 medium, 1 hard) on top of its 6 base questions,
 * so the bank of every skill has 10 questions: 3 easy, 4 medium, 3 hard.
 * Format: [conceptIndex, difficulty, prompt, correct, [wrong1, wrong2, wrong3]]
 */
import { ExtraQuestions } from './types';

export const webExtraQuestions: ExtraQuestions[] = [
  {
    skill: 'HTML',
    questions: [
      [0, 1, 'Which declaration at the top of a page tells the browser to use modern HTML5?', '<!DOCTYPE html>', ['<html version="5">', '<meta html5>', '<?html5?>']],
      [2, 2, 'Which input type shows a browser date picker?', 'type="date"', ['type="calendar"', 'type="datetime-text"', 'type="day"']],
      [1, 2, 'Which element should hold the main navigation links of a site?', '<nav>', ['<menu-links>', '<header-links>', '<links>']],
      [2, 3, 'What is the purpose of rel="noopener" on a link with target="_blank"?', 'It stops the opened page from controlling the original page through window.opener', ['It makes the link open faster', 'It hides the link from search engines', 'It forces the link to open in the same tab']],
    ],
  },
  {
    skill: 'CSS',
    questions: [
      [1, 1, 'Which property sets the space OUTSIDE an element, between it and its neighbors?', 'margin', ['padding', 'border-spacing', 'outline']],
      [2, 2, 'Which property aligns flex items along the main axis?', 'justify-content', ['align-content', 'flex-align', 'item-align']],
      [0, 2, 'What does the selector ul > li select?', 'li elements that are direct children of a ul', ['All li elements anywhere inside a ul', 'The first li after every ul', 'Both ul and li elements']],
      [0, 3, 'Which rule wins when two declarations have equal specificity?', 'The one that comes later in the stylesheet', ['The one that comes first', 'The one with more properties', 'The one in the shorter selector']],
    ],
  },
  {
    skill: 'Responsive Design',
    questions: [
      [1, 1, 'Which CSS declaration keeps an image from overflowing its container?', 'max-width: 100%;', ['overflow: image;', 'fit: auto;', 'width: 100vw;']],
      [0, 2, 'Which media query targets screens in landscape orientation?', '@media (orientation: landscape)', ['@media (landscape: true)', '@media (shape: wide)', '@media (direction: landscape)']],
      [1, 2, 'What does 1rem equal?', 'The font size of the root element', ['The font size of the parent element', '1% of the viewport width', 'One pixel']],
      [2, 3, 'Which declaration makes a card grid add or remove columns automatically as the screen changes?', 'grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));', ['grid-template-columns: auto;', 'display: columns-auto;', 'flex-flow: columns;']],
    ],
  },
  {
    skill: 'JavaScript',
    questions: [
      [0, 1, 'Which keyword declares a variable that cannot be reassigned?', 'const', ['let', 'var', 'static']],
      [1, 2, 'What does const add = (a, b) => a + b; add(2, 3) return?', '5', ['23', 'undefined', 'NaN']],
      [2, 2, 'What does await do inside an async function?', 'Pauses the function until the promise settles, without blocking the page', ['Blocks the whole browser until it finishes', 'Runs the code in a new thread', 'Cancels the promise']],
      [0, 3, 'What does typeof null return?', '"object"', ['"null"', '"undefined"', '"number"']],
    ],
  },
  {
    skill: 'Git',
    questions: [
      [0, 1, 'Which command shows the history of commits?', 'git log', ['git history', 'git show-all', 'git commits']],
      [0, 2, 'Which command shows which files are modified or staged?', 'git status', ['git diff --all', 'git info', 'git files']],
      [1, 2, 'What is a merge conflict?', 'Two branches changed the same lines and Git cannot decide which to keep', ['A branch name is already used', 'The remote repository is offline', 'A commit message is empty']],
      [2, 3, 'Why is git push --force dangerous on a shared branch?', 'It can overwrite commits that teammates already pushed', ['It deletes the local repository', 'It skips staging', 'It creates a new remote']],
    ],
  },
  {
    skill: 'TypeScript',
    questions: [
      [0, 1, 'Which type represents a list of numbers?', 'number[]', ['numbers', 'list<number>', 'array(number)']],
      [1, 2, 'What does readonly do on an interface property?', 'Prevents the property from being assigned after the object is created', ['Hides the property from JSON', 'Makes the property optional', 'Converts the property to a string']],
      [2, 2, 'What does the union type string | null mean?', 'The value is either a string or null', ['The value is both a string and null', 'The value is a string with a null character', 'The value must be converted to null']],
      [0, 3, 'What is the difference between any and unknown?', 'unknown forces you to check the type before using the value; any turns off type checking', ['They are identical', 'any is only for numbers', 'unknown can only hold null']],
    ],
  },
  {
    skill: 'React',
    questions: [
      [0, 1, 'What must a React component name start with?', 'A capital letter', ['A number', 'An underscore', 'The word React']],
      [1, 2, 'Why should you not change state directly, like state.count = 5?', 'React will not know the state changed, so it will not re-render', ['It throws a syntax error', 'It deletes the component', 'It resets the props']],
      [2, 2, 'Which hook keeps a value between renders without causing a re-render when it changes?', 'useRef', ['useState', 'useMemo', 'useContext']],
      [1, 3, 'What is "lifting state up"?', 'Moving shared state to the closest common parent so siblings can use it', ['Storing state in the browser', 'Moving state into a global variable', 'Making a component re-render faster']],
    ],
  },
  {
    skill: 'State Management (Redux)',
    questions: [
      [0, 1, 'Which Redux Toolkit function creates a store?', 'configureStore', ['createContext', 'newStore', 'initStore']],
      [1, 2, 'What does createSlice generate?', 'A reducer together with its action creators', ['Only a component', 'A database table', 'A network request']],
      [2, 2, 'Which react-redux hook sends an action to the store?', 'useDispatch', ['useSelector', 'useReducer', 'useAction']],
      [1, 3, 'Why can reducers written with Redux Toolkit appear to mutate state?', 'Immer tracks the changes and produces a new immutable state', ['Redux allows direct mutation', 'The store is copied by the browser', 'They run in a separate thread']],
    ],
  },
  {
    skill: 'Web Accessibility',
    questions: [
      [2, 1, 'What is a screen reader?', 'Software that reads the content of the screen aloud or in braille', ['A tool that records the screen', 'A screen cleaning app', 'A browser that blocks ads']],
      [0, 2, 'How should headings be used on an accessible page?', 'In a logical order (h1, then h2, then h3) to describe the structure', ['Only for making text bigger', 'Always as h1', 'Never, use bold paragraphs instead']],
      [1, 2, 'What should a visible focus indicator do?', 'Show keyboard users which element is currently focused', ['Hide the outline for a cleaner look', 'Make the page load faster', 'Mark an element as required']],
      [2, 3, 'What is the best way to make the speech in a video accessible to deaf users?', 'Add synchronized captions', ['Add a larger play button', 'Increase the volume', 'Add the word "video" as alt text']],
    ],
  },
  {
    skill: 'Node.js',
    questions: [
      [2, 1, 'Which command installs the dependencies listed in package.json?', 'npm install', ['npm start', 'npm run deps', 'node install']],
      [0, 2, 'What does module.exports do in CommonJS?', 'Makes values available to other files that require this module', ['Exports the project to npm', 'Starts the server', 'Imports a package']],
      [2, 2, 'What does process.env.PORT usually contain?', 'A value from the environment variables, such as the port the server should listen on', ['The port of the database', 'The process ID', 'The port of the browser']],
      [1, 3, 'What happens if you run a long synchronous loop inside a request handler?', 'It blocks the event loop, so other requests must wait', ['Node runs it in another thread', 'The loop is skipped', 'Other requests are served normally']],
    ],
  },
  {
    skill: 'Express',
    questions: [
      [2, 1, 'Which method sets the HTTP status code of a response?', 'res.status(404)', ['res.code(404)', 'res.error(404)', 'req.status(404)']],
      [0, 2, 'Which method defines a handler for POST requests?', 'app.post(path, handler)', ['app.send(path, handler)', 'app.create(path, handler)', 'app.add(path, handler)']],
      [2, 2, 'Where does the q value of /search?q=node appear?', 'req.query.q', ['req.params.q', 'req.body.q', 'req.url.q']],
      [1, 3, 'In what order do middleware functions run?', 'In the order they are registered', ['In alphabetical order', 'Last registered first', 'In random order']],
    ],
  },
  {
    skill: 'SQL',
    questions: [
      [0, 1, 'Which keyword sorts the result of a query?', 'ORDER BY', ['SORT BY', 'GROUP BY', 'ARRANGE']],
      [2, 2, 'What does AVG(price) return?', 'The average of the price values', ['The highest price', 'The number of prices', 'The sum of the prices']],
      [0, 2, 'Which statement adds a new row to a table?', 'INSERT INTO', ['ADD ROW', 'UPDATE TABLE', 'PUSH INTO']],
      [0, 3, 'What is the danger of running UPDATE users SET active = false; without a WHERE clause?', 'It changes every row in the table', ['It changes nothing', 'It deletes the table', 'It changes only the first row']],
    ],
  },
  {
    skill: 'PostgreSQL',
    questions: [
      [0, 1, 'Which constraint ensures a column can never be empty?', 'NOT NULL', ['UNIQUE', 'DEFAULT', 'CHECK NULL']],
      [0, 2, 'What does a FOREIGN KEY constraint enforce?', 'The value must exist in the referenced table', ['The value must be unique', 'The value must be numeric', 'The value is encrypted']],
      [1, 2, 'Which command shows how PostgreSQL plans to run a query?', 'EXPLAIN', ['SHOW PLAN', 'DESCRIBE', 'ANALYZE TABLE']],
      [2, 3, 'What does Atomicity (the A in ACID) guarantee?', 'A transaction either fully completes or has no effect', ['Queries are always fast', 'Data is always encrypted', 'Every table has a primary key']],
    ],
  },
  {
    skill: 'REST APIs',
    questions: [
      [0, 1, 'Which HTTP method is normally used to read data without changing it?', 'GET', ['POST', 'PUT', 'DELETE']],
      [0, 2, 'Which status code means the client is not authenticated?', '401', ['403', '404', '500']],
      [1, 2, 'Which URL best identifies the order with id 7 of user 3?', '/users/3/orders/7', ['/getOrder?user=3&id=7', '/user-order-3-7', '/orders/get/7/user/3']],
      [2, 3, 'What is one common way to version a REST API?', 'Put the version in the URL, such as /api/v1/users', ['Rename the database', 'Delete the old clients', 'Use a different HTTP method']],
    ],
  },
  {
    skill: 'Authentication (JWT)',
    questions: [
      [0, 1, 'Which part of a JWT carries the claims, such as the user id?', 'The payload', ['The signature', 'The header', 'The salt']],
      [2, 2, 'What does the exp claim in a JWT define?', 'When the token expires', ['The user role', 'The signing algorithm', 'The token size']],
      [1, 2, 'What does bcrypt.compare(password, hash) do?', 'Checks whether the password matches the stored hash', ['Decrypts the hash back to the password', 'Creates a new hash', 'Deletes the old hash']],
      [2, 3, 'Why should a JWT payload not contain secrets such as passwords?', 'The payload is only encoded, so anyone holding the token can read it', ['It is encrypted twice', 'It makes the token too short', 'JWT cannot store text']],
    ],
  },
];