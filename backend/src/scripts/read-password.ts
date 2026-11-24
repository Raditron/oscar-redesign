// How the scripts take the admin password: from standard input, never from an argument. The shell would keep an
// argument in its history, and other processes on the machine can see it. Typed at a terminal, the password stays
// hidden; piped in (`... | npm run <script> --silent`), it is read from the first line.
import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';

/**
 * The first line of standard input, without its line ending. When that is empty, or there is none, it says so on
 * standard error and gives undefined, so a script only has to stop.
 */
export async function readPassword(): Promise<string | undefined> {
  const password = await firstLineOfInput();
  if (password !== '') return password;
  console.error('No password given: type the admin password, then press Enter.');
  return undefined;
}

/** The first line of standard input, without its line ending; empty when there is none. */
async function firstLineOfInput(): Promise<string> {
  // A terminal Node can control. (Git Bash's own window isn't one: there, typing shows, unless Node is started
  // through `winpty`.)
  const typing = process.stdin.isTTY === true;
  // The prompt goes to standard error, so standard output carries the script's own result alone.
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
