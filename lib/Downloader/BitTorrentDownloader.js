const fs = require('fs');
const PieceInfo = require('./PieceInfo');
const WorkerPool = require('./WorkerPool');


// Note: Codecrafters peer can have only one connecton with client at a time. 
// Tried to create multiple connection with same peer to download pieces in parallel but it was not working.
// So, we are only creating worker threads for each peer to download pieces in parallel.
module.exports = class BitTorrentDownloader {
    
    #peerConfigs;
    #clientPeerId;
    #clientTorrentInfo;

    constructor(peerConfigs, clientPeerId, clientTorrentInfo) {
        this.#peerConfigs = peerConfigs;
        this.#clientPeerId = clientPeerId;
        this.#clientTorrentInfo = clientTorrentInfo;
    }

    async downloadTo(filePath) {

        let numberOfPieces = Math.ceil(this.#clientTorrentInfo.length / this.#clientTorrentInfo['piece length']);
        console.log('Number of pieces:', numberOfPieces);
        
        const pieceInfos = [];
        let pieces = new Array(numberOfPieces);

        for(let pieceIndex=0; pieceIndex < numberOfPieces; pieceIndex++) {
            pieceInfos.push(new PieceInfo(pieceIndex));
        }

        const workerPool = new WorkerPool(
                                            this.#peerConfigs, 
                                            this.#clientPeerId, 
                                            this.#clientTorrentInfo
                                        );
        
        return new Promise( (resolve, reject) => {

            for(let pieceInfo of pieceInfos) {
                workerPool.runTask(pieceInfo, (err, result) => {
                    if(err) {
                        console.error('All peer have failed to download the piece');
                        reject(err);
                    }
                    pieces[result.pieceIndex] = result.piece;
                    if(this.#areAllPiecesDownloaded(pieces)) {
                        console.log('All pieces downloaded');
                        workerPool.close();
                        this.#writePieceToFileSync(filePath, Buffer.concat(pieces));
                        resolve();
                    }
                });
            }
        });
    }

    async downloadPieceTo(filePath, pieceIndex) {
        const workerPool = new WorkerPool(
            this.#peerConfigs, 
            this.#clientPeerId, 
            this.#clientTorrentInfo
        );

        return new Promise( (resolve, reject) => {
            let pieceInfo = new PieceInfo(pieceIndex);

            workerPool.runTask(pieceInfo, (err, result) => {
                if(err) {
                    console.error(err);
                    reject(err);
                }

                console.log('Piece downloaded:', result.pieceIndex);
                workerPool.close();
                this.#writePieceToFileSync(filePath, result.piece);
                resolve();
            });
        });
    }

    #writePieceToFileSync(filePath, buffer) {
        console.log('Writing to:', filePath);
        fs.writeFileSync(filePath, buffer, { flag: 'w' });
    }

    #areAllPiecesDownloaded(pieces) {
        console.log('Pieces:', pieces);
        return !pieces.includes(undefined);
    }

}