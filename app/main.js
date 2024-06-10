const CommandHandler = require("../lib");

const command = process.argv[2];
let arg = process.argv.slice(3);

if (command === "decode") {
  CommandHandler.decodeCommand(...arg);
} else if (command === "info") {
  CommandHandler.infoCommand(...arg);
} else if (command === "peers") {
  CommandHandler.peersCommand(...arg);
} else if (command === "handshake") {
  CommandHandler.handshakeCommand(...arg);
} else if (command === "download_piece") {
  arg = arg.slice(1);
  CommandHandler.downloadPieceCommand(...arg);
} else {
  throw new Error(`Unknown command ${command}`);
}

