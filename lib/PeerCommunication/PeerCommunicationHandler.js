const fs = require('fs');
const crypto = require('crypto');
const Peer = require('./Peer');

module.exports = class PeerCommunicationHandler {

    #peerConfigs;
    #clientPeerId;
    #clientTorrentInfo;
    #chunks;
    

    constructor(peerConfigs, clientPeerId, clientTorrentInfo) {
        this.#peerConfigs = peerConfigs;
        this.#clientPeerId = clientPeerId;
        this.#clientTorrentInfo = clientTorrentInfo;
        this.#chunks = [];
    }

    async downloadPieceTo(filePath, pieceIndex, peerIndex = 0) {
        return new Promise ((resolve, reject) => {
            console.log('Downloading piece:', pieceIndex);
            const length = this.#clientTorrentInfo.length;
            let pieceLength = this.#clientTorrentInfo['piece length'];
            console.log('Each Piece length:', pieceLength);
            if (pieceIndex === Math.ceil(length/pieceLength) - 1) {
                pieceLength = length % pieceLength;
            }
            console.log('length of whole file:', length);
            console.log(`Piece ${pieceIndex} length: ${pieceLength}`);
            const [ip, port] = this.#peerConfigs[peerIndex].split(':');
            let peer = new Peer(ip, port, this.#clientPeerId);
    
            let socket = peer.initiateHandshake(this.#clientTorrentInfo.infoHash);
            socket.on('data', (data) => {
                peer.handleData(data, pieceIndex, pieceLength);
            });
    
            socket.on('end', () => {
                console.log('Connection closed');
                if (this.#chunks.length > 0) {
                    let piece = Buffer.concat(this.#chunks);
                    this.#checkIntegrity(piece, pieceIndex);
                    this.#writePieceToFileSync(filePath, piece);
                }
                resolve();
                return;
            });
    
            socket.on('error', (err) => {
                console.error(err);
                reject(err);
            });
    
            peer.on('block', (pieceIndex, byteOffset, block) => {
                console.log('Received block');
                this.#chunks.push(block);
            });
    
            peer.sendHandshakeMessage();
        });
    }

    #writePieceToFileSync(filePath, piece) {
        fs.writeFileSync(filePath, piece, { flag: 'w' });
    }

    #checkIntegrity(piece, pieceIndex) {
        const hash = crypto.createHash('sha1').update(piece).digest('hex');
        let pieceHashes = Buffer.from(this.#clientTorrentInfo.pieces, "binary");
        const expectedHash = pieceHashes
                                .subarray(pieceIndex * 20, (pieceIndex + 1) * 20)
                                .toString('hex');
        if (hash === expectedHash) {
            console.log('Piece is valid');
        } else {
            console.error('Piece is not valid');
        }
    }
}