/**
 * More questions: DevOps skills.
 * Each skill gets 5 more questions (2 easy, 1 medium, 2 hard), so the bank of every skill
 * has 15 questions: 5 easy, 5 medium, 5 hard. An assessment asks 10 of them.
 * Format: [conceptIndex, difficulty, prompt, correct, [wrong1, wrong2, wrong3]]
 */
import { ExtraQuestions } from './types';

export const devopsMoreQuestions: ExtraQuestions[] = [
  {
    skill: 'Bash Scripting',
    questions: [
      [0, 1, 'How do you make a script file executable?', 'chmod +x script.sh', ['exec script.sh', 'run +x script.sh', 'touch script.sh']],
      [2, 1, 'Which command prints the number of lines of a file?', 'wc -l file', ['count file', 'len file', 'lines file']],
      [1, 2, 'What does [ -z "$name" ] test?', 'Whether the variable is empty', ['Whether the file exists', 'Whether the value equals zero', 'Whether the value is a number']],
      [0, 3, 'Why should variables be quoted, like "$file", in scripts?', 'To avoid word splitting when the value contains spaces', ['To make them uppercase', 'To make them faster', 'To turn them into numbers']],
      [1, 3, 'What does cmd1 && cmd2 do?', 'Runs cmd2 only if cmd1 succeeds', ['Runs both at the same time', 'Runs cmd2 only if cmd1 fails', 'Pipes the output of cmd1 to cmd2']],
    ],
  },
  {
    skill: 'Docker',
    questions: [
      [0, 1, 'Which command downloads an image from a registry?', 'docker pull', ['docker get', 'docker fetch', 'docker install']],
      [2, 1, 'Which command stops a running container?', 'docker stop', ['docker end', 'docker close', 'docker down-one']],
      [1, 2, 'What does the EXPOSE instruction in a Dockerfile do?', 'Documents the port the container listens on', ['Publishes the port to the host automatically', 'Opens the firewall of the host', 'Installs a web server']],
      [0, 3, 'What happens to data written inside the filesystem of a container when the container is removed?', 'It is lost unless it was stored in a volume', ['It is saved into the image', 'It is uploaded to the registry', 'It moves to the host automatically']],
      [2, 3, 'Why do containers in Docker Compose reach a database with its service name instead of localhost?', 'Each container has its own localhost, and Compose provides DNS names for the services', ['localhost is blocked by Docker', 'Databases only accept names', 'Compose merges all localhost addresses']],
    ],
  },
  {
    skill: 'CI/CD',
    questions: [
      [0, 1, 'What does CD stand for in CI/CD?', 'Continuous Delivery or Continuous Deployment', ['Code Debugging', 'Central Database', 'Command Deck']],
      [1, 1, 'What is a unit test?', 'A test of one small piece of code in isolation', ['A test of the whole product by real users', 'A speed test of the network', 'A test of the hosting company']],
      [2, 2, 'Why deploy to a staging environment first?', 'To test the release in a production-like place before real users see it', ['To skip the tests', 'To save money on production', 'To avoid version control']],
      [1, 3, 'What is a flaky test?', 'A test that sometimes passes and sometimes fails without any code change', ['A test that always fails', 'A test that takes no time', 'A test that has no assertions']],
      [0, 3, 'Why should a pipeline be fast?', 'Developers get feedback quickly and fix problems while the change is fresh', ['Fast pipelines skip the tests', 'Slow pipelines are not allowed', 'It reduces the number of commits']],
    ],
  },
  {
    skill: 'Cloud Basics',
    questions: [
      [0, 1, 'What is cloud computing?', 'Using computing resources over the internet on demand', ['Storing files only on your own computer', 'A type of antivirus', 'A kind of programming language']],
      [1, 1, 'What is a virtual machine?', 'A software-based computer running on physical hardware', ['A physical server', 'A web browser', 'A database table']],
      [2, 2, 'Why enable MFA on a cloud account?', 'It protects the account even if the password is stolen', ['It makes the cloud cheaper', 'It increases the storage', 'It speeds up the instances']],
      [1, 3, 'What is the difference between vertical and horizontal scaling?', 'Vertical adds power to one machine, horizontal adds more machines', ['Vertical adds machines, horizontal adds power', 'They are the same', 'Vertical scaling is only for storage']],
      [2, 3, 'Why is a budget alert useful in the cloud?', 'It warns you before costs grow unexpectedly', ['It lowers the price of services', 'It deletes unused accounts', 'It adds more storage']],
    ],
  },
  {
    skill: 'Kubernetes',
    questions: [
      [0, 1, 'What is a cluster in Kubernetes?', 'A set of machines (nodes) that run containerized applications', ['A single container', 'A type of Pod', 'A Docker image']],
      [2, 1, 'Which format are Kubernetes manifests usually written in?', 'YAML', ['BMP', 'CSV', 'PNG']],
      [1, 2, 'Which command scales the Deployment named app to 5 replicas?', 'kubectl scale deployment app --replicas=5', ['kubectl grow app 5', 'kubectl set size app 5', 'kubectl add replicas app 5']],
      [2, 3, 'Why do applications not use Pod IP addresses directly?', 'Pod IPs change when Pods are recreated, so a Service gives a stable address', ['Pods have no IP addresses', 'Pod IPs are always public', 'Kubernetes blocks IP addresses']],
      [0, 3, 'What is the role of the kubelet?', 'It runs on every node and makes sure the containers of the Pods are running', ['It stores the secrets of the cluster', 'It builds container images', 'It balances external traffic']],
    ],
  },
  {
    skill: 'Monitoring',
    questions: [
      [0, 1, 'What does CPU usage measure?', 'How busy the processor is', ['How much disk space is free', 'How many users are online', 'The speed of the network']],
      [1, 1, 'What is the purpose of an on-call rotation?', 'Someone is always available to respond to alerts', ['Everyone is woken up at night', 'Alerts are disabled', 'Only managers respond']],
      [2, 2, 'What is an SLI?', 'A measured indicator of service quality, such as the share of successful requests', ['A legal contract with customers', 'A type of alert', 'A server model']],
      [0, 3, 'Why do structured logs, for example in JSON, help?', 'They are easy to search and filter by field', ['They always use less disk space', 'They do not need a log server', 'They remove sensitive data automatically']],
      [1, 3, 'Why alert on symptoms such as a high error rate and not only on causes such as high CPU?', 'Symptoms show real impact on users, while a cause may not hurt anyone', ['Causes cannot be measured', 'Symptoms are easier to ignore', 'Alerting on causes is impossible']],
    ],
  },
];