const { parentPort, workerData } = require('worker_threads');
const crypto = require('crypto');
const Peer = require('./Peer');

let { 
    pieceIndex, 
    peerIndex, 
    clientTorrentInfo,
    peerConfigs,
    clientPeerId
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

async function downloadPieceToBuffer(pieceIndex, peerIndex = 0) {
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
        const [ip, port] = peerConfigs[peerIndex].split(':');
        let peer = new Peer(ip, port, clientPeerId);
        let chunks = [];

        let socket = peer.initiateHandshake(clientTorrentInfo.infoHash);
        socket.on('data', (data) => {
            peer.handleData(data, pieceIndex, pieceLength);
        });

        socket.on('end', () => {
            console.log('Connection closed');
            let piece = Buffer.concat(chunks);
            if(checkIntegrity(pieceIndex, piece)) {
                console.log('Piece downloaded successfully and is valid');
                resolve(piece);
            } else {
                reject(new Error(`Piece ${pieceIndex} is not valid`));
            }
        });

        socket.on('error', (err) => {
            console.error(err);
            reject(err);
        });

        peer.on('block', (pieceIndex, byteOffset, block) => {
            console.log('Received block');
            chunks.push(block);
        });

        peer.sendHandshakeMessage();
    });
}

let count = 0;

function downloadPiece(pieceIndex, peerIndex) {
    console.log(`Download Piece ${pieceIndex} on peer: ${peerIndex}`);
    count++;
    downloadPieceToBuffer(pieceIndex, peerIndex)
    .then((piece) => {
        parentPort.postMessage([pieceIndex, peerIndex, piece]);
    })
    .catch((err) => {
        console.error(err);
        if(count === peerConfigs.length) {
            throw new Error('All peers failed to download piece');
        }
        peerIndex = (peerIndex + 1) % peerConfigs.length;
        downloadPiece(pieceIndex, peerIndex);
    });
}

downloadPiece(pieceIndex, peerIndex);