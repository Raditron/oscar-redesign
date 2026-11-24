// `npm run hash-password`: turns the admin password into the bcrypt hash that ADMIN_PASSWORD_HASH holds, so the
// password itself is never written down anywhere. The password is read from standard input (see read-password.ts);
// only the hash goes to standard output, so it can be copied or piped as it is.
//
// Like main.ts, this sits outside the four layers: a tool run by hand.
import bcrypt from 'bcryptjs';
import { readPassword } from './read-password.ts';

// Each step of bcrypt's cost doubles the work of checking one password. At 12, a login takes a fraction of a second:
// nothing to an Admin, and a slow crawl for anyone trying passwords one after another.
const COST = 12;

const password = await readPassword();
if (password === undefined) process.exitCode = 1;
else console.log(await bcrypt.hash(password, COST));
