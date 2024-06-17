const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { Bencoder, BenDecoder } = require('../Bencoding');

module.exports = class TorrentLoader {

    #torrentFileName;
    #decodedTorrent;
    #peerId;
    #infoHash;

    constructor(fileName) {
        this.#torrentFileName = fileName;
        this.#peerId = crypto.randomBytes(10).toString("hex");
    }

    get decodedTorrent() {
        if(this.#decodedTorrent) {
            return this.#decodedTorrent;
        }
        const torrentFileContent = fs.readFileSync(
                                        path.resolve(__dirname ,this.#torrentFileName)
                                    );
        this.#decodedTorrent = BenDecoder.decode(
                                    torrentFileContent.toString('binary')
                                )[0];
        // console.log('Decoded torrent:', this.#decodedTorrent);
        return this.#decodedTorrent;
    }

    get peerId() {
        return this.#peerId;
    }

    get infoHash() {
        if(this.#infoHash) {
            return this.#infoHash;
        }
        const tempBuffer = Buffer.from(Bencoder.encode(this.decodedTorrent.info), "binary");
        this.#infoHash = crypto.createHash('sha1').update(tempBuffer).digest('hex');
        return this.#infoHash;
    }

    /**
     * Useful Links: https://developer.mozilla.org/en-US/docs/Web/API/Response/arrayBuffer
     *               https://nodejs.org/api/buffer.html#buffers-and-character-encodings
     * @returns an array of strings representing the peers
     */
    async getPeers() {
        let url = this.#getTrackerURL();
        let response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        // console.log('ArrayBuffer:', arrayBuffer);
        const string = Buffer.from(arrayBuffer).toString('binary');
        // console.log('String:', string);
        const body = BenDecoder.decode(string)[0];
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

    ///******* Private Methods ******///

    #getTrackerURL() {
        let url = new URL(this.decodedTorrent.announce);
        let searchParams = new URLSearchParams({
            'peer_id' : this.#peerId,
            'port' : '6881',
            'uploaded' : '0',
            'downloaded' : '0',
            'left' : this.decodedTorrent.info.length,
            'compact' : '1'
        });
        url.search = searchParams.toString();
        // console.log('Hash:', this.getInfoHash());
        url = url.toString() + `&info_hash=${this.#getBinaryEncodedURIComponent(this.infoHash)}`;
        return url;
    }

    /**
     * Useful Link: https://www.w3schools.com/tags/ref_urlencode.ASP
     *              https://en.wikipedia.org/wiki/Percent-encoding
     * 
     * Since the publication of RFC 1738 in 1994 it has been specified that schemes that provide 
     * for the representation of binary data in a URI must divide the data into 8-bit bytes and 
     * percent-encode each byte. Byte value 0x0F, for example, should be represented by %0F, but 
     * byte value 0x41 can be represented by A, or %41. The use of unencoded characters for alphanumeric 
     * and other unreserved characters is typically preferred, as it results in shorter URLs.
     * 
     * @param {string} hash the hexadecimal encoded hash of the torrent.info 
     * @returns percent encoded binary string
     */
    #getBinaryEncodedURIComponent(hash) {
        return hash
            .split("")
            .map((char, index) => {
                if (index % 2 === 0) return `%${char}`;
                return char;
            })
            .join("");
    }
}