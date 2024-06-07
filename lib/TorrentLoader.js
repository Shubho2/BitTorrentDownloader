const fs = require('fs');
const crypto = require('crypto');
const net = require('net');
const path = require('path');
const BenDecoder = require('./BenDecoder');
const Bencoder = require('./Bencoder');

module.exports = class TorrentLoader {

    #torrentFileName;
    #decodedTorrent;
    #peerId;

    constructor(fileName) {
        this.#torrentFileName = fileName;
        this.#peerId = crypto.randomBytes(10).toString("hex");
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

    /**
     * Useful Link: https://www.w3schools.com/tags/ref_urlencode.ASP
     * @param {string} hash the hexadecimal encoded hash of the torrent.info 
     * @returns percent encoded binary string
     */
    getBinaryEncodedURIComponent(hash) {
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
                'peer_id' : this.#peerId,
                'port' : '6881',
                'uploaded' : '0',
                'downloaded' : '0',
                'left' : this.#decodedTorrent.info.length,
                'compact' : '1'
            }
        );
        url.search = searchParams.toString();
        // console.log('Hash:', this.getInfoHash());
        url = url.toString() + `&info_hash=${this.getBinaryEncodedURIComponent(this.getInfoHash())}`;
        return url;
    }

    /**
     * Useful Links: https://developer.mozilla.org/en-US/docs/Web/API/Response/arrayBuffer
     *               https://nodejs.org/api/buffer.html#buffers-and-character-encodings
     * @returns an array of strings representing the peers
     */
    async getPeers() {
        let url = this.getTrackerURL();
        let response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        console.log('ArrayBuffer:', arrayBuffer);
        const string = Buffer.from(arrayBuffer).toString('binary');
        console.log('String:', string);
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

    handshake(peer) {

        const protocolString = "BitTorrent protocol";
        const lengthBuffer = Buffer.from([protocolString.length]);
        const protocolBuffer = Buffer.from(protocolString);
        const reservedBytes = Buffer.alloc(8);
        const infoHash = this.getInfoHash();
        const peerId = Buffer.from(this.#peerId, "binary");
        const handshakeMessage = Buffer.concat([lengthBuffer, protocolBuffer, reservedBytes, 
                                                            Buffer.from(infoHash, "hex"), peerId]);

        const socket = net.createConnection(parseInt(peer.port), peer.ip, () => {
            socket.write(handshakeMessage);
        });

        socket.on('data', (data) => {
            let peerId = data.subarray(data.length - 20).toString('hex');
            console.log('Peer ID:', peerId);
        });

        socket.on('end', () => {
            console.log('Connection closed');
        });

        return handshakeMessage;
    }
}