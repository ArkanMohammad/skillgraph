/**
 * Concepts and questions: DevOps skills
 * Format of each question: [conceptIndex, difficulty, prompt, correct, [wrong1, wrong2, wrong3]]
 */
import { SkillQuestions } from './types';

export const devopsQuestions: SkillQuestions[] = [
  {
    skill: 'Bash Scripting',
    concepts: [['Variables & syntax', 0.35], ['Control flow', 0.35], ['Files & pipelines', 0.3]],
    questions: [
      [0, 1, 'What does the first line #!/bin/bash do?', 'Tells the system to run the script with bash', ['Starts a comment only', 'Imports a library', 'Creates a variable']],
      [0, 1, 'How do you read the value of a variable named name?', '$name', ['%name%', 'name$', '&name']],
      [1, 2, 'Which syntax tests whether a file exists?', 'if [ -f file.txt ]; then ... fi', ['if file.txt exists { }', 'if (file.txt) then end', 'when -f file.txt do']],
      [2, 2, 'What does cmd > out.txt do?', 'Writes the output of cmd to out.txt, replacing the old content', ['Appends to out.txt', 'Reads from out.txt', 'Deletes out.txt']],
      [1, 3, 'What does $? contain?', 'The exit status of the last command', ['The process ID', 'The number of arguments', 'The current directory']],
      [2, 3, 'What does set -e do in a script?', 'Exits immediately if a command fails', ['Enables echo', 'Sets an environment variable', 'Makes the script executable']],
    ],
  },
  {
    skill: 'Docker',
    concepts: [['Images & containers', 0.4], ['Dockerfile & builds', 0.35], ['Networking & volumes', 0.25]],
    questions: [
      [0, 1, 'What is a container?', 'A running, isolated instance of an image', ['A virtual machine with its own kernel', 'A source code file', 'A database']],
      [0, 1, 'Which command lists running containers?', 'docker ps', ['docker list', 'docker images', 'docker show']],
      [1, 2, 'What does the FROM instruction in a Dockerfile do?', 'Sets the base image', ['Copies files', 'Exposes a port', 'Runs a command at start']],
      [2, 2, 'Why use a volume?', 'To keep data outside the container\'s lifecycle', ['To speed up the CPU', 'To encrypt the image', 'To rename the container']],
      [1, 3, 'Why put COPY package.json before COPY . . in a Node Dockerfile?', 'To reuse the cached dependency layer when only the source code changes', ['To make the image smaller by default', 'Because Docker requires this order', 'To avoid using npm']],
      [2, 3, 'What does docker run -p 8080:80 do?', 'Maps host port 8080 to container port 80', ['Maps container port 8080 to host port 80', 'Runs two containers', 'Limits memory']],
    ],
  },
  {
    skill: 'CI/CD',
    concepts: [['Pipeline concepts', 0.4], ['Automation & testing', 0.35], ['Deployment strategies', 0.25]],
    questions: [
      [0, 1, 'What does CI stand for?', 'Continuous Integration', ['Code Inspection', 'Continuous Installation', 'Central Infrastructure']],
      [1, 1, 'What typically runs automatically in a CI pipeline on each push?', 'Build and tests', ['Manual approvals only', 'Database backups only', 'Office meetings']],
      [0, 2, 'What is the difference between continuous delivery and continuous deployment?', 'Delivery keeps code releasable with a manual release step; deployment releases automatically', ['They are identical', 'Deployment never runs tests', 'Delivery is only for mobile apps']],
      [1, 2, 'Why should the pipeline fail when tests fail?', 'To stop broken code from reaching production', ['To save disk space', 'To lock the repository', 'To rename branches']],
      [2, 3, 'What is a blue-green deployment?', 'Two identical environments where traffic switches from the old one to the new one', ['Deploying only at night', 'Deploying to blue servers only', 'Using two repositories']],
      [2, 3, 'What is a canary release?', 'Rolling out to a small share of users first to catch problems', ['Releasing only to testers', 'Releasing without tests', 'Deleting the old version']],
    ],
  },
  {
    skill: 'Cloud Basics',
    concepts: [['Service models', 0.35], ['Compute & storage', 0.35], ['Security & cost', 0.3]],
    questions: [
      [0, 1, 'What does IaaS provide?', 'Virtualized infrastructure such as servers and storage', ['Ready-made email apps', 'Only code editors', 'Only databases']],
      [1, 1, 'What is object storage (like Amazon S3) good for?', 'Storing files such as images, backups and logs', ['Running SQL joins', 'Compiling code', 'Sending email']],
      [0, 2, 'Which model gives you a platform to deploy code without managing servers?', 'PaaS', ['IaaS', 'On-premises', 'Bare metal']],
      [1, 2, 'What is auto-scaling?', 'Adding or removing instances automatically based on load', ['Resizing images', 'Scaling the UI', 'Encrypting traffic']],
      [2, 3, 'What does the shared responsibility model mean?', 'The provider secures the cloud itself; you secure what you put in it', ['The provider secures everything', 'You secure the hardware', 'Nobody is responsible']],
      [2, 3, 'Which practice helps control cloud cost?', 'Shutting down unused resources and setting budgets and alerts', ['Leaving all resources on', 'Always using the largest instances', 'Disabling billing']],
    ],
  },
  {
    skill: 'Kubernetes',
    concepts: [['Core objects', 0.4], ['Deployments & scaling', 0.35], ['Services & config', 0.25]],
    questions: [
      [0, 1, 'What is a Pod?', 'The smallest deployable unit, running one or more containers', ['A cloud region', 'A Docker image registry', 'A load balancer']],
      [0, 1, 'What is Kubernetes mainly used for?', 'Orchestrating containers at scale', ['Writing CSS', 'Editing images', 'Managing email']],
      [1, 2, 'What does a Deployment manage?', 'The desired number of Pod replicas and rolling updates', ['DNS records', 'Disk drives', 'User passwords']],
      [2, 2, 'What is a Service?', 'A stable network endpoint that routes traffic to a set of Pods', ['A type of container image', 'A node', 'A CPU limit']],
      [1, 3, 'What happens if a Pod managed by a Deployment crashes?', 'The controller creates a replacement to match the desired state', ['Nothing, it stays dead', 'The whole cluster shuts down', 'All Pods restart']],
      [2, 3, 'Where should non-secret configuration be stored for Pods?', 'ConfigMaps', ['Inside the image only', 'In Secrets for everything', 'In the Pod\'s name']],
    ],
  },
  {
    skill: 'Monitoring',
    concepts: [['Metrics, logs & traces', 0.4], ['Alerting', 0.35], ['SLIs & reliability', 0.25]],
    questions: [
      [0, 1, 'What is the purpose of monitoring?', 'Observe system health and detect problems', ['Write code', 'Design the UI', 'Manage meetings']],
      [0, 1, 'Which data would you check first to find the cause of an error?', 'Logs', ['The logo', 'Marketing emails', 'Meeting notes']],
      [1, 2, 'What makes a good alert?', 'It is actionable, tied to user impact and not noisy', ['It triggers on every small change', 'It is sent to nobody', 'It has no description']],
      [0, 2, 'What is a metric?', 'A numeric measurement over time, such as CPU usage', ['A log line', 'A code comment', 'A pull request']],
      [2, 3, 'What does an SLO describe?', 'A target level of reliability, such as 99.9% availability', ['A server brand', 'A log format', 'A password rule']],
      [1, 3, 'What is alert fatigue?', 'Ignoring alerts because too many are noisy or unimportant', ['A broken monitor', 'A slow network', 'A failed deploy']],
    ],
  },
];