const fs = require('fs');
const path = require('path');
const BenDecoder = require('./BenDecoder');

module.exports = class TorrentLoader {

    #torrentFileName;

    constructor(fileName) {
        this.#torrentFileName = fileName;
    }

    parseTorrentFile() {
        const torrentFileContent = fs.readFileSync(
                                        path.resolve(__dirname ,this.#torrentFileName)
                                    );
        const [decodedTorrent, _ ] = BenDecoder.decode(torrentFileContent.toString('binary'));
        // console.log('Decoded torrent:', decodedTorrent);
        return decodedTorrent;
    }

}