import bcrypt from "bcryptjs";
import { stdin, stdout } from "node:process";
import readline from "node:readline/promises";

const rl = readline.createInterface({ input: stdin, output: stdout });
const password = await rl.question("Contraseña administrativa: ");
rl.close();
if (password.length < 12) {
  console.error("Use al menos 12 caracteres.");
  process.exit(1);
}
console.log(await bcrypt.hash(password, 12));
