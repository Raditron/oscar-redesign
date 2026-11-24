// `npm run hash-password`: turns the admin password into the bcrypt hash that ADMIN_PASSWORD_HASH holds, so the
// password itself is never written down anywhere. It reads the password from standard input, never from an
// argument: the shell would keep an argument in its history, and other processes on the machine can see it.
//
// Typed at a terminal, the password stays hidden. Piped in (`... | npm run hash-password --silent`), it is read
// from the first line. Only the hash goes to standard output, so it can be copied or piped as it is.
//
// Like main.ts, this sits outside the four layers: a tool the owner runs by hand.
import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';
import bcrypt from 'bcryptjs';

// Each step of bcrypt's cost doubles the work of checking one password. At 12, a login takes a fraction of a second:
// nothing to an Admin, and a slow crawl for anyone trying passwords one after another.
const COST = 12;

const password = await readPassword();
if (password === '') {
  console.error('No password given: type the admin password, then press Enter.');
  process.exitCode = 1;
} else {
  console.log(await bcrypt.hash(password, COST));
}

/** The first line of standard input, without its line ending; empty when there is none. */
async function readPassword(): Promise<string> {
  // A terminal Node can control. (Git Bash's own window isn't one: there, typing shows, unless Node is started
  // through `winpty`.)
  const typing = process.stdin.isTTY === true;
  // The prompt goes to standard error, so standard output carries the hash alone.
  process.stderr.write(typing ? 'Admin password (hidden as you type): ' : 'Admin password: ');
  const lines = createInterface({
    input: process.stdin,
    // At a terminal, readline echoes each key to its output; an output that discards everything hides the password.
    output: new Writable({ write: (_chunk, _encoding, done) => done() }),
    terminal: typing,
    crlfDelay: Infinity,
  });
  // The terminal is in raw mode while readline reads, so Ctrl+C arrives here as a key, not as a signal.
  lines.on('SIGINT', () => process.exit(130));
  try {
    for await (const line of lines) return line;
    return '';
  } finally {
    process.stderr.write('\n');
  }
}
