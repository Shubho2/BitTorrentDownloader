const decoder = require('./Decoder');
class CommandHandler {

    static decodeCommand(value) {
        console.log(decoder.decode(value));
    }
}

module.exports = CommandHandler;