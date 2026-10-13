/**
 * Extra questions: security skills.
 * Each skill gets 4 more questions (1 easy, 2 medium, 1 hard) on top of its 6 base questions,
 * so the bank of every skill has 10 questions: 3 easy, 4 medium, 3 hard.
 * Format: [conceptIndex, difficulty, prompt, correct, [wrong1, wrong2, wrong3]]
 */
import { ExtraQuestions } from './types';

export const securityExtraQuestions: ExtraQuestions[] = [
  {
    skill: 'Security Fundamentals',
    questions: [
      [0, 1, 'What does the "A" in the CIA triad stand for?', 'Availability', ['Authentication', 'Authorization', 'Accountability']],
      [1, 2, 'What is malware?', 'Software designed to harm or exploit a system', ['A hardware part', 'A type of firewall', 'A secure password manager']],
      [0, 2, 'Which security goal does encrypting a file protect?', 'Confidentiality', ['Availability', 'Speed', 'Backup']],
      [2, 3, 'What is the difference between a threat and a vulnerability?', 'A threat is something that can cause harm; a vulnerability is a weakness it can exploit', ['They mean the same thing', 'A threat is a fix; a vulnerability is an attack', 'A threat is hardware; a vulnerability is software']],
    ],
  },
  {
    skill: 'Networking Basics',
    questions: [
      [1, 1, 'Which protocol loads web pages without encryption?', 'HTTP', ['SSH', 'SMTP', 'FTPS']],
      [0, 2, 'Which of these is a private IPv4 address?', '192.168.1.10', ['8.8.8.8', '1.1.1.1', '172.15.0.1']],
      [1, 2, 'Which port does SSH use by default?', '22', ['21', '23', '443']],
      [2, 3, 'What does DHCP do?', 'Automatically assigns IP addresses to devices on a network', ['Translates domain names', 'Encrypts traffic', 'Filters web content']],
    ],
  },
  {
    skill: 'Linux',
    questions: [
      [0, 1, 'Which command changes the current directory?', 'cd', ['mv', 'dir', 'go']],
      [1, 2, 'Which command runs another command with administrator privileges?', 'sudo', ['admin', 'root-run', 'makeroot']],
      [0, 2, 'Which command shows the content of a text file in the terminal?', 'cat file.txt', ['open file.txt', 'type-out file.txt', 'list file.txt']],
      [2, 3, 'What does kill -9 PID do?', 'Forcefully ends the process with that ID', ['Pauses the process politely', 'Restarts the process', 'Shows the memory of the process']],
    ],
  },
  {
    skill: 'Cryptography',
    questions: [
      [1, 1, 'Which of these is a hashing algorithm?', 'SHA-256', ['AES', 'RSA', 'TLS']],
      [0, 2, 'Which key does a sender use to create a digital signature?', 'Their own private key', ['Their own public key', 'The receiver public key', 'A shared password']],
      [2, 2, 'What does HTTPS add to HTTP?', 'Encryption and server authentication using TLS', ['Faster downloads', 'Larger pages', 'Free hosting']],
      [1, 3, 'Why is MD5 not recommended for password storage?', 'It is fast and has known weaknesses, so it is easy to attack', ['It is too slow', 'It encrypts passwords', 'It needs a private key']],
    ],
  },
  {
    skill: 'Web Security (OWASP)',
    questions: [
      [1, 1, 'Why should passwords never be stored in plain text?', 'If the database leaks, every password is exposed', ['It makes the site slower', 'Browsers forbid it', 'It uses more storage']],
      [0, 2, 'Which defense helps prevent XSS?', 'Escaping or encoding user input before displaying it', ['Using longer URLs', 'Using GET requests only', 'Compressing the page']],
      [1, 2, 'What is the purpose of rate limiting on a login endpoint?', 'It slows down brute-force password guessing', ['It makes passwords stronger', 'It encrypts the password', 'It removes the need for HTTPS']],
      [2, 3, 'What does the HttpOnly flag on a cookie do?', 'Prevents JavaScript from reading the cookie', ['Makes the cookie expire at once', 'Sends the cookie only to other sites', 'Encrypts the cookie value']],
    ],
  },
  {
    skill: 'Network Security',
    questions: [
      [0, 1, 'What is network segmentation?', 'Dividing a network into smaller parts to limit access and damage', ['Joining all devices in one network', 'Increasing bandwidth', 'Hiding the Wi-Fi name']],
      [1, 2, 'What is a man-in-the-middle attack?', 'An attacker secretly intercepts communication between two parties', ['Two servers exchanging backups', 'A firewall rule', 'A power failure']],
      [2, 2, 'What does SSH provide?', 'Encrypted remote access to a machine', ['A faster Wi-Fi connection', 'Email delivery', 'A DNS service']],
      [0, 3, 'What is the "default deny" firewall approach?', 'Block all traffic unless a rule explicitly allows it', ['Allow all traffic unless it is blocked', 'Only block email', 'Allow traffic from the internet only']],
    ],
  },
  {
    skill: 'Vulnerability Assessment',
    questions: [
      [2, 1, 'What is patching?', 'Installing updates that fix known vulnerabilities', ['Painting hardware', 'Deleting logs', 'Changing the network name']],
      [0, 2, 'What is a false positive in a vulnerability scan?', 'A reported issue that does not actually exist', ['A real issue the scanner missed', 'A fixed issue', 'A scan that never ends']],
      [1, 2, 'Why prioritize vulnerabilities on public-facing systems first?', 'They are exposed to more attackers', ['They are cheaper to fix', 'They have fewer users', 'They never change']],
      [2, 3, 'What should be done after applying a fix for a vulnerability?', 'Re-scan or retest to confirm it is really closed', ['Delete the report', 'Wait one year', 'Disable the scanner']],
    ],
  },
  {
    skill: 'Incident Response',
    questions: [
      [0, 1, 'Which phase comes right after containment?', 'Eradication', ['Preparation', 'Detection', 'Lessons learned']],
      [2, 2, 'What is the aim of the recovery phase?', 'Return systems to normal operation safely', ['Delete all evidence', 'Blame the user', 'Install new attack tools']],
      [1, 2, 'Why is a clear incident communication plan important?', 'The right people are informed quickly and consistently', ['It hides the incident forever', 'It replaces backups', 'It stops all attacks']],
      [1, 3, 'Which is a typical sign of ransomware?', 'Files become encrypted and a payment is demanded', ['The network becomes faster', 'Unused ports close', 'More emails arrive']],
    ],
  },
];