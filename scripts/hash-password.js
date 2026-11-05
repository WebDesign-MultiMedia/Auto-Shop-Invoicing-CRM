#!/usr/bin/env node
// Usage: npm run hash-password
// Prompts for a password (not echoed), then prints the "salt:hash" string to
// paste into the STAFF_ACCOUNTS env var. The password itself is never
// printed or saved anywhere.

const MIN_LENGTH = 10;

function promptHidden(question) {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    process.stdout.write(question);

    // Non-interactive (piped) input: read one line.
    if (!stdin.isTTY) {
      let data = "";
      stdin.setEncoding("utf8");
      stdin.on("data", (chunk) => (data += chunk));
      stdin.on("end", () => {
        process.stdout.write("\n");
        resolve(data.split(/\r?\n/)[0]);
      });
      stdin.on("error", reject);
      return;
    }

    let value = "";
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    function onData(chunk) {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n" || ch === "\u0004") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener("data", onData);
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (ch === "\u0003") {
          stdin.setRawMode(false);
          process.stdout.write("\n");
          process.exit(130);
        }
        if (ch === "\u007f" || ch === "\b") {
          value = value.slice(0, -1);
        } else {
          value += ch;
        }
      }
    }
    stdin.on("data", onData);
  });
}

async function main() {
  const { hashPassword } = await import("../app/lib/password.mjs");

  const password = await promptHidden("New staff password: ");
  if (!password || password.length < MIN_LENGTH) {
    console.error(`Password must be at least ${MIN_LENGTH} characters.`);
    process.exit(1);
  }

  if (process.stdin.isTTY) {
    const confirm = await promptHidden("Confirm password: ");
    if (confirm !== password) {
      console.error("Passwords do not match.");
      process.exit(1);
    }
  }

  const hash = await hashPassword(password);
  console.log("\nPaste this value into STAFF_ACCOUNTS for the login, e.g.:");
  console.log(`{"owner@example.com":"${hash}"}`);
  console.log("\nHash only:");
  console.log(hash);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
