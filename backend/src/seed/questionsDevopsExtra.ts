/**
 * Extra questions: DevOps skills.
 * Each skill gets 4 more questions (1 easy, 2 medium, 1 hard) on top of its 6 base questions,
 * so the bank of every skill has 10 questions: 3 easy, 4 medium, 3 hard.
 * Format: [conceptIndex, difficulty, prompt, correct, [wrong1, wrong2, wrong3]]
 */
import { ExtraQuestions } from './types';

export const devopsExtraQuestions: ExtraQuestions[] = [
  {
    skill: 'Bash Scripting',
    questions: [
      [2, 1, 'Which command prints text to the terminal?', 'echo', ['print-text', 'say', 'out']],
      [1, 2, 'Which loop runs once for each item in a list?', 'for item in a b c; do ... done', ['while item in list { }', 'loop (a, b, c) ... end', 'foreach(a, b, c) ...']],
      [2, 2, 'What does cmd >> log.txt do?', 'Appends the output of cmd to log.txt', ['Replaces log.txt', 'Reads from log.txt', 'Deletes log.txt']],
      [0, 3, 'What is the difference between double quotes and single quotes around $name in bash?', 'Double quotes expand the variable; single quotes keep the text literal', ['There is no difference', 'Single quotes expand variables', 'Double quotes delete the variable']],
    ],
  },
  {
    skill: 'Docker',
    questions: [
      [2, 1, 'Which command builds an image from a Dockerfile?', 'docker build', ['docker make', 'docker create-image', 'docker compile']],
      [0, 2, 'What is a Docker image?', 'A read-only template used to create containers', ['A running process', 'A screenshot', 'A virtual network']],
      [1, 2, 'What does the CMD instruction in a Dockerfile define?', 'The default command that runs when the container starts', ['The base image', 'The build cache', 'The exposed port only']],
      [2, 3, 'Why use Docker Compose?', 'To define and run several containers together with one file', ['To compile code faster', 'To replace images', 'To encrypt volumes']],
    ],
  },
  {
    skill: 'CI/CD',
    questions: [
      [1, 1, 'Where is a GitHub Actions workflow usually defined?', 'In a YAML file inside .github/workflows', ['In package.json only', 'In the Dockerfile only', 'In README.md']],
      [0, 2, 'What is a build artifact?', 'A file produced by the build, such as a compiled app or package', ['A bug report', 'A meeting note', 'A source code comment']],
      [1, 2, 'Why should secrets such as API keys be stored in the CI secret store?', 'They stay out of the repository and the logs', ['It makes tests faster', 'CI cannot read files', 'They are then public']],
      [2, 3, 'What is a rollback?', 'Returning to the previous working version after a bad release', ['Deploying twice', 'Deleting the pipeline', 'Speeding up the build']],
    ],
  },
  {
    skill: 'Cloud Basics',
    questions: [
      [0, 1, 'What does SaaS provide?', 'Ready-to-use software delivered over the internet', ['Raw servers only', 'A programming language', 'A local database file']],
      [1, 2, 'Which service runs code without managing servers and bills per execution?', 'Serverless functions', ['A dedicated rack', 'A USB drive', 'A local virtual machine']],
      [2, 2, 'What is a cloud region?', 'A geographic area where the provider has data centers', ['A pricing plan', 'A user role', 'A backup file']],
      [2, 3, 'Why use multiple availability zones for an application?', 'The app keeps running if one data center fails', ['It always makes the bill smaller', 'It removes the need for backups', 'It encrypts the app']],
    ],
  },
  {
    skill: 'Kubernetes',
    questions: [
      [0, 1, 'Which command-line tool manages a Kubernetes cluster?', 'kubectl', ['kubebuild', 'k8scli', 'kubepod']],
      [1, 2, 'What does a ReplicaSet make sure of?', 'That the specified number of identical Pods is running', ['That images are signed', 'That logs are deleted', 'That DNS is encrypted']],
      [2, 2, 'Which object stores sensitive data such as passwords for Pods?', 'Secret', ['Namespace', 'Node', 'ReplicaSet']],
      [0, 3, 'What is a Namespace used for?', 'Separating the resources of one cluster into logical groups', ['Storing images', 'Running one Pod only', 'Encrypting traffic']],
    ],
  },
  {
    skill: 'Monitoring',
    questions: [
      [0, 1, 'What is a log?', 'A time-stamped record of an event in a system', ['A chart color', 'A load balancer', 'A password']],
      [2, 2, 'Roughly how much downtime per month does an uptime of 99.9% allow?', 'About 43 minutes', ['About 7 hours', 'About 3 days', 'None at all']],
      [1, 2, 'Which of these is the better alert?', '"Checkout error rate above 5% for 5 minutes"', ['"Something is wrong"', '"CPU is 1% higher than yesterday"', '"The server exists"']],
      [0, 3, 'What do distributed traces help with?', 'Following one request through many services to find the slow part', ['Encrypting logs', 'Counting users', 'Changing the server size']],
    ],
  },
];