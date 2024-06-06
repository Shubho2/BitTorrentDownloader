const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const BenDecoder = require('./BenDecoder');
const Bencoder = require('./Bencoder');

module.exports = class TorrentLoader {

    #torrentFileName;
    #decodedTorrent;

    constructor(fileName) {
        this.#torrentFileName = fileName;
    }

    getDecodedTorrent() {
        const torrentFileContent = fs.readFileSync(
                                        path.resolve(__dirname ,this.#torrentFileName)
                                    );
        this.#decodedTorrent = BenDecoder.decode(
                                    torrentFileContent.toString('binary')
                                )[0];
        // console.log('Decoded torrent:', this.#decodedTorrent);
        return this.#decodedTorrent;
    }

    getInfoHash() {
        if(!this.#decodedTorrent) {
            this.#decodedTorrent = this.getDecodedTorrent();
        }
        const tempBuffer = Buffer.from(Bencoder.encode(this.#decodedTorrent.info), "binary");
        const hash = crypto.createHash('sha1').update(tempBuffer).digest('hex');
        return hash;
    }

    getId() {
        return crypto.randomBytes(10).toString("hex");
    }

    /**
     * Useful Link: https://www.w3schools.com/tags/ref_urlencode.ASP
     * @param {string} hash the hexadecimal encoded hash of the torrent.info 
     * @returns percent encoded binary string
     */
    getBinaryUrlEncode(hash) {
        return hash
            .split("")
            .map((char, index) => {
                if (index % 2 === 0) return `%${char}`;
                return char;
            })
            .join("");
    }

    getTrackerURL() {
        if(!this.#decodedTorrent) {
            this.#decodedTorrent = this.getDecodedTorrent();
        }
        let url = new URL(this.#decodedTorrent.announce);
        let searchParams = new URLSearchParams({
                'peer_id' : this.getId(),
                'port' : '6881',
                'uploaded' : '0',
                'downloaded' : '0',
                'left' : this.#decodedTorrent.info.length,
                'compact' : '1'
            }
        );
        url.search = searchParams.toString();
        console.log('Hash:', this.getInfoHash());
        url = url.toString() + `&info_hash=${this.getBinaryUrlEncode(this.getInfoHash())}`;
        return url;
    }

    async getPeers() {
        let url = this.getTrackerURL();
        let response = await fetch(url);
        // console.log('Response:', response);
        const arrayBuffer = await response.arrayBuffer();
        const s = Buffer.from(arrayBuffer).toString("binary");
        const body = BenDecoder.decode(s)[0];
        const peers = Buffer.from(body.peers, "binary");
        const output = [];
        for (let i = 0; i < peers.length; i += 6) {
            const ip = `${peers[i]}.${peers[i + 1]}.${peers[i + 2]}.${peers[i + 3]
                }`;
            const port = peers[i + 4] * 256 + peers[i + 5];
            output.push(`${ip}:${port}`);
        }
        return output;
    }
}