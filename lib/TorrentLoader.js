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
                                path.resolve(__dirname ,this.#torrentFileName), 
                                {encoding: 'ascii', flag: 'r'}
                            ).trim();
        const decodedTorrent = BenDecoder.decode(torrentFileContent);
        console.log('Decoded torrent:', decodedTorrent);
        return JSON.parse(decodedTorrent);
    }

}