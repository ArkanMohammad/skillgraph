/**
 * Concepts and questions: cybersecurity skills
 * Format of each question: [conceptIndex, difficulty, prompt, correct, [wrong1, wrong2, wrong3]]
 */
import { SkillQuestions } from './types';

export const securityQuestions: SkillQuestions[] = [
  {
    skill: 'Security Fundamentals',
    concepts: [['CIA triad & principles', 0.4], ['Threats & attacks', 0.35], ['Risk & controls', 0.25]],
    questions: [
      [0, 1, 'What does the "C" in the CIA triad stand for?', 'Confidentiality', ['Compliance', 'Control', 'Cryptography']],
      [1, 1, 'What is phishing?', 'Tricking people into giving up information through fake messages', ['Overloading a server with traffic', 'Guessing passwords with a program', 'Encrypting files for ransom']],
      [0, 2, 'Which principle says users should have only the access they need?', 'Least privilege', ['Defense in depth', 'Security by obscurity', 'Open design']],
      [1, 2, 'What does multi-factor authentication add?', 'A second proof of identity beyond the password', ['A longer password', 'A faster login', 'A backup of the account']],
      [2, 3, 'Risk is often described as:', 'Likelihood x impact', ['Threat only', 'Vulnerability only', 'The cost of the firewall']],
      [2, 3, 'What does "defense in depth" mean?', 'Using several layers of controls so one failure does not expose everything', ['Using one very strong firewall', 'Hiding the system name', 'Backing up data weekly']],
    ],
  },
  {
    skill: 'Networking Basics',
    concepts: [['IP & addressing', 0.35], ['Protocols & ports', 0.35], ['Devices & DNS', 0.3]],
    questions: [
      [0, 1, 'What does an IP address identify?', 'A device on a network', ['A website theme', 'A user\'s password', 'A file name']],
      [2, 1, 'What does DNS do?', 'Translates domain names into IP addresses', ['Encrypts web traffic', 'Assigns passwords', 'Blocks viruses']],
      [1, 2, 'Which port does HTTPS use by default?', '443', ['80', '22', '25']],
      [2, 2, 'Which device forwards traffic between different networks?', 'Router', ['Hub', 'Monitor', 'Repeater']],
      [1, 3, 'What is the difference between TCP and UDP?', 'TCP is reliable and connection-oriented; UDP is faster with no delivery guarantee', ['UDP is encrypted and TCP is not', 'TCP is only for email', 'They are identical']],
      [0, 3, 'How many usable host addresses are in a /24 IPv4 network?', '254', ['256', '255', '24']],
    ],
  },
  {
    skill: 'Linux',
    concepts: [['Files & navigation', 0.35], ['Permissions & users', 0.35], ['Processes & shell', 0.3]],
    questions: [
      [0, 1, 'Which command lists the files in a directory?', 'ls', ['show', 'cat', 'where']],
      [0, 1, 'Which command prints the current directory?', 'pwd', ['cd', 'whoami', 'where']],
      [1, 2, 'What does chmod 755 file give the owner?', 'Read, write and execute', ['Read only', 'Write only', 'No permissions']],
      [2, 2, 'Which command shows running processes?', 'ps', ['ls', 'cat', 'cp']],
      [1, 3, 'What does the permission string -rw-r----- mean?', 'Owner can read and write, group can read, others have no access', ['Everyone can read and write', 'Owner can only read', 'Others can write']],
      [2, 3, 'What does the pipe in cmd1 | cmd2 do?', 'Sends the output of cmd1 as the input of cmd2', ['Saves output to a file', 'Runs cmd2 only if cmd1 fails', 'Runs both commands in separate terminals']],
    ],
  },
  {
    skill: 'Cryptography',
    concepts: [['Symmetric & asymmetric', 0.4], ['Hashing', 0.35], ['TLS & PKI', 0.25]],
    questions: [
      [0, 1, 'Which type of encryption uses the same key to encrypt and decrypt?', 'Symmetric', ['Asymmetric', 'Hash', 'Digital signature']],
      [1, 1, 'Can a cryptographic hash be reversed to get the original data?', 'No, it is a one-way function', ['Yes, with the right key', 'Yes, always', 'Only on Linux']],
      [0, 2, 'In public-key cryptography, which key do you share with others?', 'The public key', ['The private key', 'Both keys', 'Neither']],
      [1, 2, 'Why add a salt before hashing passwords?', 'So identical passwords produce different hashes', ['To make hashing faster', 'To encrypt the hash', 'To shorten the hash']],
      [2, 3, 'What does a certificate authority (CA) do in TLS?', 'Vouches that a public key belongs to a specific domain', ['Encrypts the traffic itself', 'Stores user passwords', 'Blocks malicious sites']],
      [0, 3, 'Which algorithm is a modern symmetric encryption standard?', 'AES', ['MD5', 'RSA-1024', 'ROT13']],
    ],
  },
  {
    skill: 'Web Security (OWASP)',
    concepts: [['Injection & XSS', 0.4], ['Auth & access control', 0.35], ['Misconfiguration & data', 0.25]],
    questions: [
      [0, 1, 'What is SQL injection?', 'Inserting malicious SQL through user input', ['Slowing a database with traffic', 'Stealing a backup file physically', 'Changing the SQL language version']],
      [0, 1, 'What does XSS let an attacker do?', 'Run malicious scripts in another user\'s browser', ['Install software on the server', 'Change DNS records', 'Read the user\'s hard drive']],
      [0, 2, 'How do you prevent SQL injection?', 'Use parameterized queries', ['Hide the database name', 'Use longer table names', 'Only allow GET requests']],
      [1, 2, 'What is broken access control?', 'Users can access data or actions they should not', ['The login page is slow', 'Passwords are too short', 'The server is offline']],
      [2, 3, 'Why should detailed error messages not be shown to users in production?', 'They can reveal internals that help attackers', ['They slow down the page', 'They break caching', 'They are not allowed by HTTP']],
      [1, 3, 'What is CSRF?', 'Tricking a logged-in user\'s browser into sending an unwanted request', ['Cracking a password offline', 'Sniffing Wi-Fi traffic', 'Flooding a server']],
    ],
  },
  {
    skill: 'Network Security',
    concepts: [['Firewalls & segmentation', 0.35], ['Attacks & detection', 0.35], ['Secure access', 0.3]],
    questions: [
      [0, 1, 'What does a firewall do?', 'Filters traffic based on rules', ['Speeds up the connection', 'Stores passwords', 'Compresses files']],
      [2, 1, 'What does a VPN provide?', 'An encrypted tunnel over a public network', ['Faster internet', 'A new internet provider', 'Antivirus scanning']],
      [1, 2, 'What is a DDoS attack?', 'Overwhelming a service with traffic from many sources', ['Stealing a password', 'Reading someone\'s email', 'Installing a keylogger']],
      [0, 2, 'What is a DMZ in network design?', 'A separate zone for public-facing servers', ['A backup server', 'A type of VPN', 'An antivirus rule']],
      [1, 3, 'What is the difference between an IDS and an IPS?', 'An IDS detects and alerts; an IPS can also block the traffic', ['An IDS blocks and an IPS only logs', 'They are the same', 'An IPS only works on Wi-Fi']],
      [2, 3, 'Why is WPA3 preferred over WEP for Wi-Fi?', 'WEP is easily broken, while WPA3 uses modern encryption', ['WEP is newer', 'WPA3 is only faster', 'There is no difference']],
    ],
  },
  {
    skill: 'Vulnerability Assessment',
    concepts: [['Scanning & discovery', 0.35], ['Scoring & prioritizing', 0.35], ['Remediation & reporting', 0.3]],
    questions: [
      [0, 1, 'What is a vulnerability?', 'A weakness that can be exploited', ['A firewall rule', 'A type of malware', 'A backup']],
      [0, 1, 'Which tool is widely used to discover open ports on hosts?', 'Nmap', ['Excel', 'Figma', 'Docker']],
      [1, 2, 'What does CVSS provide?', 'A standard severity score for vulnerabilities', ['A password list', 'A firewall rule set', 'A network map']],
      [1, 2, 'Which vulnerability should usually be fixed first?', 'A critical one that is actively exploited', ['The oldest one', 'The easiest one to describe', 'One on a test machine with no data']],
      [0, 3, 'What is the difference between a vulnerability scan and a penetration test?', 'A scan finds known weaknesses automatically; a pen test actively tries to exploit them', ['They are the same', 'A pen test only reads logs', 'A scan is always manual']],
      [2, 3, 'What should a good vulnerability report include?', 'Findings, risk level, evidence and recommended fixes', ['Only the list of tools used', 'Only screenshots', 'The attacker\'s name']],
    ],
  },
  {
    skill: 'Incident Response',
    concepts: [['Phases & process', 0.4], ['Detection & containment', 0.35], ['Recovery & lessons', 0.25]],
    questions: [
      [0, 1, 'What is the first step when you suspect a security incident?', 'Identify it and report it to the right team', ['Delete all logs', 'Ignore it until it is confirmed', 'Reboot every server']],
      [1, 1, 'What is the goal of containment?', 'Stop the incident from spreading', ['Find someone to blame', 'Erase the evidence', 'Announce it publicly']],
      [0, 2, 'Which is the usual order of the incident response phases?', 'Preparation, detection, containment, eradication, recovery, lessons learned', ['Recovery, detection, preparation, containment', 'Containment, preparation, lessons, detection', 'Detection, lessons learned, recovery, preparation']],
      [1, 2, 'Why preserve logs and disk evidence during an incident?', 'They are needed for analysis and possible legal action', ['They make the system faster', 'They are not needed after containment', 'To free disk space']],
      [1, 3, 'What is an IoC (indicator of compromise)?', 'Evidence such as a malicious IP, hash or domain that shows a system may be compromised', ['A type of firewall', 'A user\'s password', 'An antivirus subscription']],
      [2, 3, 'What is the purpose of a post-incident review?', 'Learn what happened and improve processes to prevent a repeat', ['Assign punishment', 'Delete incident records', 'Close the ticket quickly']],
    ],
  },
];