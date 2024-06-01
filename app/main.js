const commandHandler = require("../lib/CommandHandler");

const command = process.argv[2];

if (command === "decode") {
  commandHandler.decodeCommand(process.argv[3]);
} else {
  throw new Error(`Unknown command ${command}`);
}

