const benDecoder = require('./BenDecoder');
const TorrentLoader = require('./TorrentLoader');
const bencoder = require('./Bencoder');
const crypto = require('crypto');
class CommandHandler {

    static decodeCommand(arg) {
        let [result, _] = benDecoder.decode(arg);
        console.log(JSON.stringify(result));
    }

    static infoCommand(arg) {
        let torrentLoader = new TorrentLoader(arg);
        let data = torrentLoader.parseTorrentFile();
        let tempBuffer = Buffer.from(bencoder.encode(data.info), "binary");
        let hash = crypto.createHash('sha1').update(tempBuffer).digest('hex');
        let pieceHashes = Buffer.from(data.info.pieces, "binary");

        console.log(`Tracker URL: ${data.announce}`);
        console.log(`Length: ${data.info.length}`);
        console.log(`Info Hash: ${hash}`);
        console.log(`Piece Length: ${data.info['piece length']}`);
        console.log('Piece Hashes:');
        for (let i = 0; i < pieceHashes.length; i += 20) {
            console.log(pieceHashes.subarray(i, i + 20).toString('hex'));
        }
    }
}

module.exports = CommandHandler;