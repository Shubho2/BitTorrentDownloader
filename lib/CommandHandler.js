const benDecoder = require('./BenDecoder');
const TorrentLoader = require('./TorrentLoader');
class CommandHandler {

    static decodeCommand(arg) {
        console.log(benDecoder.decode(arg));
    }

    static infoCommand(arg) {
        let torrentLoader = new TorrentLoader(arg);
        let data = torrentLoader.parseTorrentFile();
        console.log('Tracker URL:', data.announce);
        console.log('Length:', data.info.length);
    }
}

module.exports = CommandHandler;