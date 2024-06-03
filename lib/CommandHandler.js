const benDecoder = require('./BenDecoder');
const TorrentLoader = require('./TorrentLoader');
const bencoder = require('./Bencoder');
const crypto = require('crypto');
class CommandHandler {

    static decodeCommand(arg) {
        console.log(benDecoder.decode(arg));
    }

    static infoCommand(arg) {
        let torrentLoader = new TorrentLoader(arg);
        let data = torrentLoader.parseTorrentFile();
        console.log('Tracker URL: ', data.announce);
        console.log('Length: ', data.info.length);
        let info = bencoder.encode(data.info);
        let hash = crypto.createHash('sha1').update(info).digest('hex');
        console.log('Info Hash: ', hash);
    }
}

module.exports = CommandHandler;