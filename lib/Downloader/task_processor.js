const crypto = require('crypto');
const { parentPort, workerData } = require('worker_threads');
const { Peer } = require('../PeerCommunication');

const { 
    peerConfig,
    clientPeerId,
    clientTorrentInfo
} = workerData;

function checkIntegrity(pieceIndex, piece) {
    const hash = crypto.createHash('sha1').update(piece).digest('hex');
    let pieceHashes = Buffer.from(clientTorrentInfo.pieces, "binary");
    const expectedHash = pieceHashes
                            .subarray(pieceIndex * 20, (pieceIndex + 1) * 20)
                            .toString('hex');
    if (hash === expectedHash) {
        return true;
    } else {
        return false;
    }
}

function createPeer() {
    const [ip, port] = peerConfig.split(':');
    return new Peer(ip, port, clientPeerId);
}

async function downloadPieceToBuffer(pieceIndex) {
    return new Promise ( (resolve, reject) => {
        console.log('Downloading piece:', pieceIndex);
        const length = clientTorrentInfo.length;
        let pieceLength = clientTorrentInfo['piece length'];
        console.log('Each Piece length:', pieceLength);
        if (pieceIndex === Math.ceil(length/pieceLength) - 1) {
            pieceLength = length % pieceLength;
        }
        console.log('length of whole file:', length);
        console.log(`Piece ${pieceIndex} length: ${pieceLength}`);
        let chunks = [];

        const peer = createPeer();
        let socket = peer.initiateHandshake(clientTorrentInfo.infoHash);
        socket.on('data', (data) => {
            peer.handleData(data, pieceIndex, pieceLength);
        });

        socket.on('end', () => {
            console.log('Connection closed');
            let piece = Buffer.concat(chunks);
            if(checkIntegrity(pieceIndex, piece)) {
                console.log(`Piece ${pieceIndex} downloaded successfully and is valid`);
                resolve(piece);
            } else {
                reject(new Error(`Piece ${pieceIndex} is not valid`));
            }
        });

        socket.on('error', (err) => {
            console.error("Socket Error: " ,err);
            reject(err);
        });

        peer.on('block', (pieceIndex, byteOffset, block) => {
            console.log('Received block');
            chunks.push(block);
        });

        peer.sendHandshakeMessage();
    });
}

function downloadPiece(pieceIndex) {
    console.log(`Download Piece ${pieceIndex} on peer: ${peerConfig}`);
    downloadPieceToBuffer(pieceIndex)
    .then((piece) => {
        parentPort.postMessage(piece);
    })
    .catch((err) => {
        console.error(err);
        throw err;
    });
}

parentPort.on('message', (pieceIndex) => {
    downloadPiece(pieceIndex);
});