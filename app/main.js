const CommandHandler = require("../lib/CommandHandler");

const command = process.argv[2];

if (command === "decode") {
  CommandHandler.decodeCommand(process.argv[3]);
} else if (command === "info") {
  CommandHandler.infoCommand(process.argv[3]);
} else if (command === "peers") {
  CommandHandler.peersCommand(process.argv[3]);
} else {
  throw new Error(`Unknown command ${command}`);
}

