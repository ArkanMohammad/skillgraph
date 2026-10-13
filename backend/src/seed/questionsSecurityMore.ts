/**
 * More questions: security skills.
 * Each skill gets 5 more questions (2 easy, 1 medium, 2 hard), so the bank of every skill
 * has 15 questions: 5 easy, 5 medium, 5 hard. An assessment asks 10 of them.
 * Format: [conceptIndex, difficulty, prompt, correct, [wrong1, wrong2, wrong3]]
 */
import { ExtraQuestions } from './types';

export const securityMoreQuestions: ExtraQuestions[] = [
  {
    skill: 'Security Fundamentals',
    questions: [
      [1, 1, 'Which is a strong password practice?', 'Use a long, unique passphrase for each account', ['Reuse one easy password everywhere', 'Use your birthday', 'Share it with colleagues']],
      [0, 1, 'What does the "I" in the CIA triad stand for?', 'Integrity', ['Identity', 'Internet', 'Inspection']],
      [2, 2, 'Why are backups part of security?', 'They let you restore data after loss, corruption or ransomware', ['They prevent all attacks', 'They speed up the network', 'They encrypt the passwords']],
      [1, 3, 'What is social engineering?', 'Manipulating people into giving access or information', ['Breaking a router with brute force', 'A type of firewall', 'Writing secure code']],
      [2, 3, 'What does fail secure mean?', 'When a system fails, it ends in a safe, closed state', ['A failing system stays open', 'Failures are hidden from the logs', 'A failure always reboots the server']],
    ],
  },
  {
    skill: 'Networking Basics',
    questions: [
      [0, 1, 'What is a MAC address?', 'A hardware address of a network interface', ['A website address', 'An email address', 'A Wi-Fi password']],
      [1, 1, 'Which protocol is used to send email between servers?', 'SMTP', ['FTP', 'SSH', 'NTP']],
      [2, 2, 'Which DNS record maps a name to an IPv4 address?', 'A record', ['MX record', 'CNAME record', 'NS record']],
      [0, 3, 'What does NAT do?', 'Lets many private devices share one public IP address', ['Encrypts all traffic', 'Assigns MAC addresses', 'Blocks all inbound traffic forever']],
      [1, 3, 'What is the purpose of the TCP three-way handshake?', 'To establish a reliable connection before data is sent', ['To encrypt the data', 'To find the DNS server', 'To assign an IP address']],
    ],
  },
  {
    skill: 'Linux',
    questions: [
      [0, 1, 'Which command creates a new directory?', 'mkdir', ['newdir', 'mkfolder', 'dirmake']],
      [2, 1, 'Which command shows the manual page of another command?', 'man', ['guide', 'doc', 'helpme']],
      [1, 2, 'Which command changes the owner of a file?', 'chown', ['chperm', 'owner', 'setuser']],
      [0, 3, 'What does rm -r folder do?', 'Deletes the directory and everything inside it', ['Asks before deleting each file', 'Deletes only hidden files', 'Moves the folder to the trash']],
      [2, 3, 'What does 2>&1 do in a shell command?', 'Redirects error output to the same place as normal output', ['Runs the command twice', 'Reads input from a file', 'Sends output to two files']],
    ],
  },
  {
    skill: 'Cryptography',
    questions: [
      [0, 1, 'What is encryption?', 'Turning readable data into unreadable data using a key', ['Compressing a file to save space', 'Deleting a file permanently', 'Copying data to a backup']],
      [1, 1, 'What is the main purpose of publishing a hash next to a downloadable file?', 'To let users check that the file was not changed', ['To make the file smaller', 'To hide the file', 'To speed up the download']],
      [2, 2, 'What does the padlock in the browser address bar indicate?', 'The connection uses HTTPS with a valid certificate', ['The website is safe from all attacks', 'The website belongs to the government', 'The browser blocks ads']],
      [0, 3, 'Why is RSA usually used to protect a short symmetric key instead of a whole large file?', 'Asymmetric encryption is much slower than symmetric encryption', ['RSA cannot encrypt text', 'RSA keys expire after one use', 'Symmetric keys are public']],
      [2, 3, 'What is forward secrecy?', 'Past sessions stay protected even if the long-term key of the server is stolen later', ['Messages are sent before they are encrypted', 'Keys never expire', 'The server keeps all session keys forever']],
    ],
  },
  {
    skill: 'Web Security (OWASP)',
    questions: [
      [0, 1, 'What is input validation?', 'Checking that user input has the expected format before using it', ['Encrypting the input', 'Storing the input twice', 'Hiding the input fields']],
      [1, 1, 'Why use HTTPS on a login page?', 'It encrypts the credentials while they travel to the server', ['It makes the page load faster', 'It hides the page from search engines', 'It stops users from forgetting passwords']],
      [2, 2, 'Why should dependencies be updated regularly?', 'Old versions may contain known vulnerabilities', ['New versions are always faster', 'Old versions stop working', 'Updates remove all bugs']],
      [0, 3, 'Why is escaping output safer than only blocking the word "script"?', 'Attackers have many other payloads, while escaping shows any input as plain text', ['Escaping makes pages load faster', 'Blocking words is illegal', 'Escaping removes the need for HTTPS']],
      [1, 3, 'What is an IDOR vulnerability?', 'Reading the data of another user by changing an id in the request because ownership is not checked', ['A server that is too slow', 'A weak password policy', 'A missing HTTPS certificate']],
    ],
  },
  {
    skill: 'Network Security',
    questions: [
      [0, 1, 'What is a firewall rule?', 'An instruction that allows or blocks traffic by address, port or protocol', ['A password policy', 'A backup schedule', 'A DNS record']],
      [1, 1, 'What is a port scan?', 'Probing a host to find which ports are open', ['A virus that hides in ports', 'A VPN tunnel', 'A measurement of network speed']],
      [2, 2, 'Why use a VPN on public Wi-Fi?', 'It encrypts the traffic between your device and the VPN server', ['It makes the Wi-Fi faster', 'It blocks all malware', 'It hides you from the VPN provider']],
      [1, 3, 'What is ARP spoofing?', 'Sending fake ARP messages so the address of the attacker is linked to the IP of another host', ['Overloading a server with requests', 'Guessing Wi-Fi passwords', 'Encrypting traffic with a weak key']],
      [0, 3, 'Why place a database server in a private subnet?', 'It cannot be reached directly from the internet', ['It becomes faster', 'It no longer needs passwords', 'It does not need backups']],
    ],
  },
  {
    skill: 'Vulnerability Assessment',
    questions: [
      [0, 1, 'Why make an asset inventory before scanning?', 'To know which systems exist so none are missed', ['To make scans slower', 'To replace the scanner', 'To hide the assets from attackers']],
      [2, 1, 'What is remediation?', 'Fixing or reducing a vulnerability', ['Finding a vulnerability', 'Ignoring a vulnerability', 'Selling a vulnerability']],
      [1, 2, 'What does a CVE identifier represent?', 'A unique ID of a publicly known vulnerability', ['A type of firewall', 'A password policy', 'A backup file']],
      [0, 3, 'Why can an authenticated scan find more issues than an unauthenticated one?', 'It can inspect installed software and settings inside the system', ['It uses more network bandwidth', 'It skips the scoring', 'It only scans the internet-facing ports']],
      [2, 3, 'What is a compensating control?', 'A temporary measure that reduces risk when a fix cannot be applied yet', ['A fine paid after an incident', 'A scanner license', 'A permanent patch']],
    ],
  },
  {
    skill: 'Incident Response',
    questions: [
      [0, 1, 'What is an incident response plan?', 'A documented set of steps for handling security incidents', ['A list of passwords', 'A network diagram only', 'A software license']],
      [1, 1, 'What should you do with a suspicious email you received at work?', 'Report it to the security team without clicking any link', ['Forward it to everyone', 'Click the link to check it', 'Delete it and tell nobody']],
      [2, 2, 'What is the purpose of backups during recovery?', 'Restoring systems and data to a known good state', ['Finding the attacker', 'Blocking attackers', 'Scoring vulnerabilities']],
      [1, 3, 'Why is an infected machine usually isolated from the network before it is wiped?', 'Isolation stops the spread while the machine can still be investigated', ['Wiping is illegal', 'Isolation removes the malware', 'A network cable damages the evidence']],
      [0, 3, 'What does eradication mean in incident response?', 'Removing the cause of the incident, such as malware or compromised accounts', ['Telling the customers', 'Restoring from a backup', 'Buying new hardware']],
    ],
  },
];