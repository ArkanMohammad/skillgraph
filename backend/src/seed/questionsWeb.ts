/**
 * Concepts and questions: web skills (frontend + backend)
 * Format of each question: [conceptIndex, difficulty, prompt, correct, [wrong1, wrong2, wrong3]]
 * difficulty: 1 easy, 2 medium, 3 hard
 */
import { SkillQuestions } from './types';

export const webQuestions: SkillQuestions[] = [
  {
    skill: 'HTML',
    concepts: [['Document structure', 0.35], ['Semantic elements', 0.35], ['Forms & links', 0.3]],
    questions: [
      [2, 1, 'Which attribute of the <a> element holds the link destination?', 'href', ['src', 'link', 'url']],
      [1, 1, 'Which element represents the footer of a page or section semantically?', '<footer>', ['<bottom>', '<end>', '<foot>']],
      [0, 2, 'Where should the <meta charset="UTF-8"> tag be placed?', 'Inside <head>', ['Inside <body>, at the end', 'Before the <!DOCTYPE html>', 'Inside the <title> element']],
      [2, 2, 'What does the "for" attribute of a <label> do?', 'Links the label to the input whose id matches', ['Sets the label text size', 'Loops over the options of a select', 'Marks the input as required']],
      [1, 3, 'Which element is best for a self-contained piece of content that could be reused on its own, such as a blog post?', '<article>', ['<aside>', '<details>', '<figure>']],
      [0, 3, 'What happens if two elements on the same page share the same id?', 'The HTML is invalid, and getElementById returns only the first match', ['Both are selected automatically', 'The browser merges their styles', 'The page refuses to render']],
    ],
  },
  {
    skill: 'CSS',
    concepts: [['Selectors & specificity', 0.35], ['Box model', 0.3], ['Flexbox & Grid', 0.35]],
    questions: [
      [0, 1, 'Which selector targets all elements with the class "card"?', '.card', ['#card', 'card', '*card']],
      [1, 1, 'Which property adds space INSIDE an element, between its content and its border?', 'padding', ['margin', 'spacing', 'gap']],
      [2, 2, 'Which declaration turns an element into a flex container?', 'display: flex;', ['flex: container;', 'position: flex;', 'align: flex;']],
      [0, 2, 'Which selector has the highest specificity?', '#header', ['.header', 'header', 'header p']],
      [1, 3, 'With box-sizing: border-box, a box has width: 200px, padding: 20px and border: 5px. How wide is its content area?', '150px', ['200px', '160px', '250px']],
      [2, 3, 'Which declaration creates three equal-width grid columns?', 'grid-template-columns: repeat(3, 1fr);', ['grid-columns: 3;', 'grid-template-rows: repeat(3, 1fr);', 'display: grid-3;']],
    ],
  },
  {
    skill: 'Responsive Design',
    concepts: [['Media queries', 0.35], ['Fluid layouts & units', 0.35], ['Mobile-first & viewport', 0.3]],
    questions: [
      [2, 1, 'Which meta tag makes a page scale correctly on mobile screens?', '<meta name="viewport" content="width=device-width, initial-scale=1">', ['<meta name="mobile" content="true">', '<meta name="responsive" content="auto">', '<meta charset="mobile">']],
      [1, 1, 'Which unit is relative to the width of the viewport?', 'vw', ['px', 'pt', 'cm']],
      [0, 2, 'Which media query applies styles only when the screen is at least 768px wide?', '@media (min-width: 768px) { ... }', ['@media (max-width: 768px) { ... }', '@media screen > 768px { ... }', '@media (width: min 768px) { ... }']],
      [2, 2, 'What does a mobile-first approach mean?', 'Base styles target small screens, and media queries add styles for larger ones', ['Desktop styles are written first and hidden on mobile', 'The site is built as a native mobile app first', 'Only phones are supported']],
      [1, 3, 'What does font-size: clamp(1rem, 2.5vw, 2rem) do?', 'Scales with the viewport but never goes below 1rem or above 2rem', ['Sets the font to exactly 2.5vw', 'Picks the smallest of the three values only', 'Clamps the text to one line']],
      [0, 3, 'Which feature lets a component adapt to the size of its container instead of the viewport?', 'Container queries (@container)', ['Media queries with min-width', 'The viewport meta tag', 'CSS variables']],
    ],
  },
  {
    skill: 'JavaScript',
    concepts: [['Variables & types', 0.3], ['Functions & scope', 0.35], ['Async & DOM', 0.35]],
    questions: [
      [0, 1, 'Which array method adds an element to the end of the array?', 'push()', ['pop()', 'shift()', 'unshift()']],
      [2, 1, 'Which method selects the first element that matches a CSS selector?', 'document.querySelector()', ['document.getAll()', 'document.select()', 'document.find()']],
      [1, 2, 'What does [1, 2, 3].map(n => n * 2) return?', '[2, 4, 6]', ['[1, 4, 9]', '12', 'undefined']],
      [0, 2, 'What is the result of 0 == "" in JavaScript?', 'true', ['false', 'TypeError', 'NaN']],
      [2, 3, 'What does this log? for (var i = 0; i < 3; i++) { setTimeout(() => console.log(i), 0); }', '3, 3, 3', ['0, 1, 2', '0, 0, 0', 'undefined, undefined, undefined']],
      [1, 3, 'What is a closure?', 'A function that remembers the variables of the scope where it was created', ['A function that is called immediately after being defined', 'A way to close the browser window from code', 'A function that cannot take parameters']],
    ],
  },
  {
    skill: 'Git',
    concepts: [['Commits & history', 0.35], ['Branches & merging', 0.35], ['Remotes & collaboration', 0.3]],
    questions: [
      [0, 1, 'Which command saves staged changes as a new commit?', 'git commit', ['git save', 'git push', 'git stage']],
      [2, 1, 'Which command uploads your local commits to the remote repository?', 'git push', ['git pull', 'git fetch', 'git clone']],
      [1, 2, 'Which command creates a new branch AND switches to it?', 'git checkout -b feature/login', ['git branch feature/login', 'git switch feature/login', 'git new feature/login']],
      [0, 2, 'What does git add . do?', 'Stages all changes in the current directory for the next commit', ['Commits all changes', 'Pushes all changes', 'Creates a new repository']],
      [2, 3, 'What is the difference between git fetch and git pull?', 'fetch downloads remote changes without merging; pull fetches and then merges', ['fetch uploads and pull downloads', 'They are identical commands', 'pull only works on the main branch']],
      [1, 3, 'What does git rebase main do when run on a feature branch?', 'Replays the feature branch commits on top of the latest main', ['Deletes the main branch', 'Merges main into the feature branch with a merge commit', 'Resets the feature branch to main and discards its commits']],
    ],
  },
  {
    skill: 'TypeScript',
    concepts: [['Basic types', 0.3], ['Interfaces & type aliases', 0.35], ['Generics & narrowing', 0.35]],
    questions: [
      [0, 1, 'How do you declare a variable that must hold a string?', 'let name: string;', ['let name = string;', 'string name;', 'let name <string>;']],
      [0, 1, 'What is the main benefit of TypeScript over plain JavaScript?', 'Static type checking before the code runs', ['It runs faster in the browser', 'It removes the need for a compiler', 'It adds new HTML tags']],
      [1, 2, 'What does the ? mean in interface User { age?: number }?', 'The property is optional', ['The property is read-only', 'The property can only be null', 'The property is private']],
      [2, 2, 'What does function id<T>(x: T): T accept?', 'Any type, and the return type matches the argument type', ['Only numbers', 'Only objects', 'No arguments']],
      [2, 3, 'Given value: string | number, what is the type of value inside if (typeof value === "string") { ... }?', 'string', ['string | number', 'number', 'unknown']],
      [1, 3, 'What is a difference between "type" aliases and "interface" for object shapes?', 'Interfaces can be merged by declaring them again; type aliases cannot', ['Only interfaces can describe objects', 'Types exist at runtime and interfaces do not', 'Interfaces can only be used with classes']],
    ],
  },
  {
    skill: 'React',
    concepts: [['Components & JSX', 0.3], ['State & props', 0.35], ['Hooks & effects', 0.35]],
    questions: [
      [0, 1, 'What does JSX let you do?', 'Write HTML-like markup inside JavaScript', ['Write CSS inside HTML', 'Run JavaScript on the server only', 'Replace the DOM with a database']],
      [1, 1, 'How does a parent component pass data to a child?', 'Through props', ['Through useEffect', 'By editing the child file', 'Through the DOM id']],
      [1, 2, 'With const [count, setCount] = useState(0), which call updates the state?', 'setCount(count + 1)', ['count = count + 1', 'count++', 'this.setState(count + 1)']],
      [2, 2, 'When does useEffect(() => { ... }, []) run?', 'Once after the first render', ['After every render', 'Before every render', 'Only when props change']],
      [0, 3, 'Why should each item in a list rendered with map() have a stable, unique key?', 'So React can match items between renders and update only what changed', ['So items can be sorted alphabetically', 'Because JSX will not compile without it', 'To make the items clickable']],
      [2, 3, 'What is wrong with calling a hook inside an if statement?', 'Hooks must run in the same order on every render, so they cannot be conditional', ['Hooks are only allowed in class components', 'If statements are not allowed in JSX', 'Nothing, it is a recommended pattern']],
    ],
  },
  {
    skill: 'State Management (Redux)',
    concepts: [['Store & state', 0.35], ['Actions & reducers', 0.35], ['Async & selectors', 0.3]],
    questions: [
      [0, 1, 'In Redux, where is the global state kept?', 'In a single store', ['In each component', 'In the browser URL only', 'In the CSS']],
      [1, 1, 'What is an action in Redux?', 'A plain object describing what happened', ['A function that returns JSX', 'A database query', 'A CSS class']],
      [1, 2, 'What must a reducer be?', 'A pure function that returns the new state without side effects', ['An async function that calls the API', 'A class with setState', 'A function that edits the DOM']],
      [0, 2, 'Which react-redux hook reads a value from the store in a component?', 'useSelector', ['useState', 'useReducer', 'useRef']],
      [2, 3, 'Which Redux Toolkit API handles async logic and dispatches pending, fulfilled and rejected actions?', 'createAsyncThunk', ['createSlice', 'configureStore', 'createSelector']],
      [2, 3, 'What does a memoized selector (createSelector) avoid?', 'Recomputing derived data when its inputs have not changed', ['Writing reducers', 'Using the store in components', 'Dispatching actions']],
    ],
  },
  {
    skill: 'Web Accessibility',
    concepts: [['Semantics & ARIA', 0.35], ['Keyboard & focus', 0.3], ['Visual & media', 0.35]],
    questions: [
      [2, 1, 'Which attribute provides a text alternative for an image?', 'alt', ['src', 'caption', 'name']],
      [1, 1, 'Which key moves focus to the next interactive element on a page?', 'Tab', ['Enter', 'Esc', 'Space']],
      [0, 2, 'When should you use ARIA attributes?', 'When native HTML cannot express the role or state you need', ['Always, instead of semantic HTML', 'Never, they are deprecated', 'Only for images']],
      [2, 2, 'What is the minimum WCAG AA contrast ratio for normal body text?', '4.5:1', ['2:1', '3:1 for all text', '7:1 always']],
      [1, 3, 'What does a "skip to main content" link help with?', 'Keyboard users can bypass repeated navigation', ['Search engines index the page faster', 'Screen readers hide images', 'Mouse users scroll faster']],
      [0, 3, 'What is the most accessible way to build a clickable action?', 'Use a <button> element', ['Use a <div> with an onclick handler only', 'Use a <span> styled like a button', 'Use an <a> without href']],
    ],
  },
  {
    skill: 'Node.js',
    concepts: [['Runtime & modules', 0.35], ['Async I/O & event loop', 0.35], ['npm & core APIs', 0.3]],
    questions: [
      [0, 1, 'What is Node.js?', 'A JavaScript runtime that runs outside the browser', ['A CSS framework', 'A database', 'A browser extension']],
      [2, 1, 'Which file lists a project\'s dependencies and scripts?', 'package.json', ['node.json', 'dependencies.txt', 'index.lock']],
      [0, 2, 'Which syntax imports a module in CommonJS?', 'const fs = require("fs");', ['import fs = "fs";', 'include fs;', 'using fs;']],
      [1, 2, 'Why is Node.js good at handling many concurrent connections?', 'It uses non-blocking I/O and an event loop', ['It creates one thread per request', 'It compiles every request to machine code', 'It only serves one request at a time']],
      [1, 3, 'In what order does this log? console.log("A"); setTimeout(() => console.log("B"), 0); Promise.resolve().then(() => console.log("C")); console.log("D");', 'A, D, C, B', ['A, B, C, D', 'A, C, D, B', 'A, D, B, C']],
      [2, 3, 'Which approach reads a file without blocking the event loop?', 'fs.promises.readFile', ['fs.readFileSync', 'path.join', 'os.readFile']],
    ],
  },
  {
    skill: 'Express',
    concepts: [['Routing', 0.35], ['Middleware', 0.35], ['Request & response', 0.3]],
    questions: [
      [0, 1, 'Which call defines a handler for GET requests to /users?', 'app.get("/users", handler)', ['app.fetch("/users", handler)', 'app.read("/users")', 'app.route.get = handler']],
      [2, 1, 'Which method sends a JSON response?', 'res.json(data)', ['res.print(data)', 'res.body(data)', 'res.html(data)']],
      [1, 2, 'What does express.json() do?', 'Parses JSON request bodies into req.body', ['Sends JSON responses', 'Validates JSON schemas', 'Converts req.body to XML']],
      [2, 2, 'How do you read the :id value from the route /users/:id?', 'req.params.id', ['req.query.id', 'req.body.id', 'req.id']],
      [1, 3, 'What must a middleware do so the request continues to the next handler?', 'Call next()', ['Return true', 'Call res.next()', 'Nothing, it continues automatically']],
      [1, 3, 'How does Express recognize an error-handling middleware?', 'It has four parameters: (err, req, res, next)', ['Its name starts with "error"', 'It is registered before all routes', 'It returns a Promise']],
    ],
  },
  {
    skill: 'SQL',
    concepts: [['Querying & filtering', 0.35], ['Joins', 0.35], ['Aggregation & grouping', 0.3]],
    questions: [
      [0, 1, 'Which clause filters rows before they are returned?', 'WHERE', ['ORDER BY', 'GROUP BY', 'LIMIT']],
      [2, 1, 'Which function counts rows?', 'COUNT(*)', ['SUM(*)', 'TOTAL(*)', 'ROWS(*)']],
      [1, 2, 'Which join returns only rows that have matches in both tables?', 'INNER JOIN', ['LEFT JOIN', 'FULL OUTER JOIN', 'CROSS JOIN']],
      [2, 2, 'Which clause filters groups after GROUP BY?', 'HAVING', ['WHERE', 'FILTER', 'LIMIT']],
      [1, 3, 'A LEFT JOIN from customers to orders returns a customer with no orders. What do the order columns contain?', 'NULL', ['0', 'An empty string', 'The row is dropped']],
      [0, 3, 'What does SELECT DISTINCT city FROM users return?', 'Each different city once', ['Only the first city', 'The number of cities', 'All cities including duplicates']],
    ],
  },
  {
    skill: 'PostgreSQL',
    concepts: [['Data types & constraints', 0.35], ['Indexes & performance', 0.35], ['Transactions & features', 0.3]],
    questions: [
      [0, 1, 'Which constraint guarantees every row in a column has a different value?', 'UNIQUE', ['NOT NULL', 'CHECK', 'DEFAULT']],
      [0, 1, 'Which type creates an auto-incrementing integer column in PostgreSQL?', 'SERIAL', ['AUTO', 'COUNTER', 'SEQUENCE_ID']],
      [1, 2, 'What is an index mainly used for?', 'Speeding up lookups on a column', ['Encrypting a column', 'Backing up a table', 'Preventing deletes']],
      [2, 2, 'What does ROLLBACK do?', 'Undoes all changes made since BEGIN', ['Commits the changes', 'Saves a backup file', 'Deletes the table']],
      [2, 3, 'Which data type stores JSON and supports indexing?', 'JSONB', ['TEXT only', 'XML', 'ARRAY']],
      [1, 3, 'Why can an index on a column with very few distinct values (like a boolean) be a poor choice?', 'The planner often prefers a sequential scan because the index is not selective', ['Boolean columns cannot be indexed', 'Indexes only work on text', 'It makes the table read-only']],
    ],
  },
  {
    skill: 'REST APIs',
    concepts: [['HTTP methods & status codes', 0.4], ['Resource design', 0.3], ['Statelessness & versioning', 0.3]],
    questions: [
      [0, 1, 'Which HTTP method is normally used to create a new resource?', 'POST', ['GET', 'DELETE', 'HEAD']],
      [0, 1, 'Which status code means "resource not found"?', '404', ['200', '401', '500']],
      [1, 2, 'Which route follows REST naming conventions to get all users?', 'GET /users', ['GET /getAllUsers', 'POST /users/list', 'GET /user.php?all=1']],
      [0, 2, 'Which status code should a successful creation normally return?', '201 Created', ['204 No Content', '301 Moved Permanently', '400 Bad Request']],
      [2, 3, 'What does "stateless" mean in REST?', 'Each request carries everything the server needs; no session is stored between requests', ['The server has no database', 'The client cannot store data', 'Responses never change']],
      [0, 3, 'What is the difference between PUT and PATCH?', 'PUT replaces the whole resource; PATCH updates part of it', ['PUT deletes and PATCH creates', 'They are identical', 'PATCH is only for files']],
    ],
  },
  {
    skill: 'Authentication (JWT)',
    concepts: [['JWT structure', 0.35], ['Password security', 0.35], ['Token handling', 0.3]],
    questions: [
      [0, 1, 'How many parts does a JWT have?', 'Three: header, payload and signature', ['Two: key and value', 'Four: header, body, footer and id', 'One: a random string']],
      [1, 1, 'How should passwords be stored in the database?', 'As a salted hash (for example bcrypt)', ['In plain text', 'Encrypted with a key stored next to them', 'As base64']],
      [0, 2, 'What is the purpose of the JWT signature?', 'To verify the token was not tampered with', ['To encrypt the payload', 'To store the password', 'To set the expiry time']],
      [1, 2, 'Why is bcrypt preferred over plain SHA-256 for passwords?', 'It is deliberately slow and uses a salt', ['It produces shorter output', 'It can be decrypted when needed', 'It does not need a library']],
      [2, 3, 'Why is an httpOnly cookie safer than localStorage for storing a JWT?', 'JavaScript on the page cannot read it, so an XSS attack cannot steal it', ['It never expires', 'It is encrypted by the browser', 'It does not need HTTPS']],
      [2, 3, 'Where should the JWT secret key live?', 'In an environment variable on the server, never in the repository', ['In the frontend code', 'In the JWT payload', 'In a public config file']],
    ],
  },
];