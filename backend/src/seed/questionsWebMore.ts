/**
 * More questions: web skills.
 * Each skill gets 5 more questions (2 easy, 1 medium, 2 hard) on top of its 10 questions,
 * so the bank of every skill has 15 questions: 5 easy, 5 medium, 5 hard.
 * An assessment asks 10 of them, so two attempts rarely get the same set.
 * Format: [conceptIndex, difficulty, prompt, correct, [wrong1, wrong2, wrong3]]
 */
import { ExtraQuestions } from './types';

export const webMoreQuestions: ExtraQuestions[] = [
  {
    skill: 'HTML',
    questions: [
      [0, 1, 'Which element wraps all the visible content of an HTML page?', '<body>', ['<head>', '<title>', '<meta>']],
      [2, 1, 'Which element creates a clickable button?', '<button>', ['<btn>', '<action>', '<press>']],
      [1, 2, 'Which element groups introductory content or navigation aids at the top of a page or section?', '<header>', ['<footer>', '<aside>', '<section-top>']],
      [2, 3, 'What happens to a form input that has no name attribute when the form is submitted?', 'Its value is not included in the submitted data', ['It is submitted with an empty name', 'The browser adds a default name', 'The form refuses to submit']],
      [0, 3, 'What is the effect of a script tag without defer or async inside the head?', 'HTML parsing pauses until the script is downloaded and executed', ['The script runs after the page is fully displayed', 'The script is ignored', 'The script runs in parallel without blocking']],
    ],
  },
  {
    skill: 'CSS',
    questions: [
      [0, 1, 'Which symbol starts an id selector in CSS?', '#', ['.', '*', '&']],
      [1, 1, 'Which property rounds the corners of an element?', 'border-radius', ['corner-style', 'border-round', 'round-edge']],
      [2, 2, 'Which property sets the space between grid or flex items?', 'gap', ['spacing-between', 'margin-all', 'distance']],
      [0, 3, 'Which of these selectors has the lowest specificity?', 'An element selector such as p', ['A class selector such as .note', 'An id selector such as #note', 'An inline style attribute']],
      [1, 3, 'What is margin collapsing?', 'Vertical margins of adjacent block elements combine into the larger one', ['Horizontal margins are removed', 'Padding is added to the margins', 'Margins turn negative']],
    ],
  },
  {
    skill: 'Responsive Design',
    questions: [
      [0, 1, 'What does the @media rule do in CSS?', 'Applies styles only when conditions such as the screen width are true', ['Imports an audio or video file', 'Plays media automatically', 'Defines a color theme name']],
      [2, 1, 'Which viewport value makes the layout width equal to the device width?', 'width=device-width', ['width=100px', 'width=screen-max', 'device=mobile']],
      [1, 2, 'Why are percentage widths useful in fluid layouts?', 'They scale with the size of the parent element', ['They stay the same at every screen size', 'They only work on mobile', 'They disable wrapping']],
      [0, 3, 'What does the condition (max-width: 600px) mean in a media query?', 'The styles apply when the viewport is 600px wide or narrower', ['The styles apply when the viewport is 600px wide or wider', 'The styles apply only at exactly 600px', 'No element may be wider than 600px']],
      [1, 3, 'Which attribute lets the browser choose between several image files depending on the screen?', 'srcset', ['altset', 'responsive', 'media-src']],
    ],
  },
  {
    skill: 'JavaScript',
    questions: [
      [0, 1, 'Which method converts a JSON string into a JavaScript object?', 'JSON.parse()', ['JSON.stringify()', 'JSON.object()', 'Object.parse()']],
      [1, 1, 'Which keyword sends a value back from a function?', 'return', ['give', 'output', 'respond']],
      [2, 2, 'What does event.preventDefault() do?', 'Stops the default browser action of the event, such as submitting a form', ['Stops the event from reaching parent elements', 'Removes the event listener', 'Deletes the element']],
      [0, 3, 'What does NaN === NaN return?', 'false', ['true', 'undefined', 'It throws an error']],
      [1, 3, 'What does this refer to inside an arrow function?', 'The this of the surrounding scope where the arrow function was defined', ['The global window object always', 'The arrow function itself', 'It is always undefined']],
    ],
  },
  {
    skill: 'Git',
    questions: [
      [0, 1, 'Which command creates a new empty Git repository?', 'git init', ['git start', 'git new', 'git create']],
      [2, 1, 'Which command downloads a full copy of a remote repository?', 'git clone', ['git copy', 'git download', 'git duplicate']],
      [1, 2, 'What does git stash do?', 'Temporarily saves uncommitted changes so you can switch tasks', ['Deletes all uncommitted changes forever', 'Uploads the changes to the remote', 'Squashes the last two commits']],
      [0, 3, 'What does git reset --hard do?', 'Discards uncommitted changes and moves the branch to the chosen commit', ['Only unstages the files', 'Creates a backup branch', 'Pushes the changes to the remote']],
      [1, 3, 'What is a fast-forward merge?', 'The branch pointer simply moves forward because there are no diverging commits', ['A merge that always creates a new merge commit', 'A merge that deletes the source branch', 'A merge that skips conflict checks']],
    ],
  },
  {
    skill: 'TypeScript',
    questions: [
      [0, 1, 'Which type is used for true or false values?', 'boolean', ['bool', 'bit', 'truefalse']],
      [0, 1, 'Which command compiles a TypeScript file to JavaScript?', 'tsc', ['tsrun', 'jsc', 'typec']],
      [1, 2, 'Which line creates a type alias that allows only the strings "yes" or "no"?', 'type Answer = "yes" | "no"', ['type Answer = "yes" & "no"', 'type Answer = ("yes", "no")', 'type Answer: "yes" or "no"']],
      [2, 3, 'What does the constraint T extends { id: number } mean?', 'T must be a type that has at least an id property of type number', ['T must be exactly the type { id: number }', 'T can be any type', 'T is always a number']],
      [0, 3, 'What does the never type represent?', 'A value that never occurs, for example the result of a function that always throws', ['A value that can be null or undefined', 'A value of any type', 'An empty string']],
    ],
  },
  {
    skill: 'React',
    questions: [
      [0, 1, 'Which JSX attribute sets a CSS class on an element?', 'className', ['cssClass', 'styleClass', 'classRef']],
      [1, 1, 'What are props in React?', 'Inputs passed from a parent component to a child component', ['The internal state of a component', 'CSS styles', 'Browser events']],
      [2, 2, 'What is the dependency array of useEffect used for?', 'It lists the values that make the effect run again when they change', ['It lists the components to render', 'It stores the result of the effect', 'It limits the effect to once per second']],
      [2, 3, 'What is the function returned from useEffect used for?', 'Cleaning up timers or subscriptions before the effect runs again or the component unmounts', ['Resetting the state of the component', 'Skipping the next render', 'Caching the result of the effect']],
      [1, 3, 'Why does calling setCount(count + 1) three times in one event handler increase the count by only 1?', 'Each call uses the same count value from that render', ['React ignores the second and third call on purpose', 'State can only change once per second', 'setCount only works with objects']],
    ],
  },
  {
    skill: 'State Management (Redux)',
    questions: [
      [0, 1, 'How many stores does a typical Redux application have?', 'One', ['One per component', 'One per reducer', 'One per page']],
      [1, 1, 'What does dispatch do in Redux?', 'Sends an action to the store', ['Reads the current state', 'Creates a new store', 'Deletes a reducer']],
      [1, 2, 'What does the payload of an action usually contain?', 'The data needed to perform the update', ['The previous state', 'The reducer function', 'The store itself']],
      [2, 3, 'Why should a selector return only the data a component needs?', 'The component re-renders only when that data changes', ['The store uses less disk space', 'Reducers run faster', 'Actions are dispatched less often']],
      [0, 3, 'Why should the state kept in the Redux store be serializable?', 'Tools such as the DevTools and persistence rely on plain data', ['JavaScript cannot store functions at all', 'Redux sends the state to a server', 'Reducers only accept strings']],
    ],
  },
  {
    skill: 'Web Accessibility',
    questions: [
      [2, 1, 'What should the alt attribute of a purely decorative image be?', 'Empty: alt=""', ['A long description of the image', 'The file name', 'The word image']],
      [1, 1, 'Which keys usually activate a focused button?', 'Enter or Space', ['Escape', 'Tab only', 'Delete']],
      [0, 2, 'Why should every form input have a label?', 'It tells all users, including screen reader users, what the field is for', ['Browsers refuse inputs without a label', 'Labels make the form submit faster', 'Labels are needed for the input to be visible']],
      [1, 3, 'What does tabindex="0" do?', 'Makes an element focusable in the natural tab order', ['Removes the element from the tab order', 'Makes it the first element to receive focus', 'Disables keyboard focus inside it']],
      [2, 3, 'Why should information never be shown by color alone?', 'People with color blindness may not see the difference', ['Colors slow the page down', 'Browsers remove colors in dark mode', 'WCAG forbids all colors']],
    ],
  },
  {
    skill: 'Node.js',
    questions: [
      [0, 1, 'Which command runs the file app.js with Node.js?', 'node app.js', ['run app.js', 'js app.js', 'npm app.js']],
      [2, 1, 'Which command creates a package.json with default answers?', 'npm init -y', ['npm start -y', 'npm create json', 'node init']],
      [1, 2, 'What does require("fs") give you?', 'The built-in file system module', ['A package downloaded from npm', 'A database driver', 'The HTTP server']],
      [2, 3, 'What is the difference between dependencies and devDependencies?', 'devDependencies are needed only during development, such as test or build tools', ['devDependencies are installed only on production servers', 'dependencies are only for testing', 'There is no difference in behavior']],
      [1, 3, 'What does an unhandled promise rejection warning mean?', 'A promise failed and no catch or try/catch handled the error', ['A promise took too long', 'A promise was resolved twice', 'A promise returned undefined']],
    ],
  },
  {
    skill: 'Express',
    questions: [
      [0, 1, 'Which method starts an Express server on a port?', 'app.listen()', ['app.start()', 'app.run()', 'app.open()']],
      [2, 1, 'Which method redirects the client to another URL?', 'res.redirect()', ['res.goto()', 'res.move()', 'res.forward()']],
      [1, 2, 'What does app.use(express.static("public")) do?', 'Serves the files of the public folder directly', ['Hides the public folder', 'Uploads the files to a database', 'Compiles the public folder']],
      [0, 3, 'Why must app.get("/users/me") be defined before app.get("/users/:id")?', 'The first matching route handles the request, so :id would catch "me" otherwise', ['Express always picks the most specific route', 'Routes are sorted alphabetically', 'Only the last route is used']],
      [1, 3, 'What happens if a handler never sends a response and never calls next()?', 'The request hangs until the client times out', ['Express sends a 200 automatically', 'Express sends a 404', 'The server restarts']],
    ],
  },
  {
    skill: 'SQL',
    questions: [
      [0, 1, 'Which keyword limits the number of returned rows?', 'LIMIT', ['MAXROWS', 'ROWNUM', 'STOP']],
      [2, 1, 'Which function returns the largest value in a column?', 'MAX', ['TOP', 'BIGGEST', 'HIGH']],
      [1, 2, 'Which join keeps all rows from both tables, even without a match?', 'FULL OUTER JOIN', ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN']],
      [0, 3, 'Why does WHERE email = NULL return no rows?', 'A comparison with NULL is never true, so IS NULL must be used', ['NULL is the same as an empty string', 'The column cannot be compared with text', 'The equals sign only works with numbers']],
      [2, 3, 'What does SELECT dept, COUNT(*) FROM staff GROUP BY dept HAVING COUNT(*) > 5 return?', 'Departments with more than five staff members and their counts', ['All departments with a count of 5', 'Staff members older than five', 'Departments with exactly five rows']],
    ],
  },
  {
    skill: 'PostgreSQL',
    questions: [
      [0, 1, 'Which type stores true or false in PostgreSQL?', 'BOOLEAN', ['BIT STRING', 'BYTE', 'LOGIC']],
      [2, 1, 'Which command starts a transaction?', 'BEGIN', ['OPEN', 'START-TX', 'LOCK']],
      [1, 2, 'What does a UNIQUE index guarantee?', 'No two rows have the same value in the indexed columns', ['All values are sorted forever', 'The table becomes read-only', 'Duplicate values are silently merged']],
      [0, 3, 'What does ON DELETE CASCADE do on a foreign key?', 'Deleting the parent row also deletes the rows that reference it', ['It blocks deleting the parent row', 'It sets the child values to NULL', 'It copies the child rows to a backup table']],
      [1, 3, 'When can PostgreSQL ignore an index and scan the whole table?', 'When the planner estimates a full scan is cheaper, for example when most rows match', ['Never, indexes are always used', 'Only when the table has no primary key', 'Only inside transactions']],
    ],
  },
  {
    skill: 'REST APIs',
    questions: [
      [0, 1, 'Which HTTP method is normally used to delete a resource?', 'DELETE', ['REMOVE', 'DROP', 'ERASE']],
      [1, 1, 'Which data format do most REST APIs use?', 'JSON', ['BMP', 'EXE', 'MP4']],
      [0, 2, 'What is the Content-Type header used for?', 'It tells the receiver the format of the body, such as application/json', ['It sets the size of the response', 'It stores the login of the user', 'It chooses the HTTP method']],
      [0, 3, 'What does it mean that a PUT or DELETE request is idempotent?', 'Sending it several times has the same effect as sending it once', ['It can only be sent once', 'It always returns 200', 'It never changes any data']],
      [1, 3, 'Why is pagination useful for GET /posts?', 'It limits the amount of data sent in one response', ['It encrypts the response', 'It removes the need for authentication', 'It converts JSON to XML']],
    ],
  },
  {
    skill: 'Authentication (JWT)',
    questions: [
      [2, 1, 'What does authentication mean?', 'Checking who the user is', ['Checking what the user may do', 'Encrypting the database', 'Logging the errors of the server']],
      [0, 1, 'Is the payload of a normal signed JWT encrypted?', 'No, it is only Base64URL encoded and can be read by anyone', ['Yes, with AES', 'Yes, with the signature', 'Only the header can be read']],
      [1, 2, 'What is a salt in password hashing?', 'A random value added to each password before hashing', ['A second password', 'A secret key shared with the user', 'A hashing algorithm']],
      [2, 3, 'Why do access tokens usually have a short lifetime?', 'A stolen token is useful for a short time only', ['Short tokens are faster to sign', 'Browsers delete long tokens', 'The signature breaks after one hour']],
      [0, 3, 'Why must the server verify the signature before trusting a JWT?', 'Anyone can create a token with any payload, only the signature proves the server issued it', ['Signatures compress the token', 'Verification decrypts the payload', 'Without it the token expires immediately']],
    ],
  },
];