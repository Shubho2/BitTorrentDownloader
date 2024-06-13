const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { Worker } = require('worker_threads');
const Peer = require('./Peer');

module.exports = class PeerCommunicationHandler {

    #peerConfigs;
    #clientPeerId;
    #clientTorrentInfo;

    constructor(peerConfigs, clientPeerId, clientTorrentInfo) {
        this.#peerConfigs = peerConfigs;
        this.#clientPeerId = clientPeerId;
        this.#clientTorrentInfo = clientTorrentInfo;    
    }

    async downloadPieceTo(filePath, pieceIndex, peerIndex = 0) {
        return new Promise ( (resolve, reject) => {
            const worker = this.#createWorker(pieceIndex, peerIndex);

            worker.on('message', ([pieceIndex, peerIndex, piece]) => {
                console.log(`Received piece ${pieceIndex} downloaded by peer ${peerIndex}`);
                this.#writePieceToFileSync(filePath, piece);
                resolve();
            });

            worker.on('error', (err) => {
                console.error(err);
                reject(err);
            });
        });
    }

    async downloadTo(filePath) {
        console.log('Downloading to:', filePath);
        return new Promise( async (resolve, reject) => {
            console.log('length:', this.#clientTorrentInfo.length);
            let numberOfPieces = Math.ceil(this.#clientTorrentInfo.length / this.#clientTorrentInfo['piece length']);
            console.log('Number of pieces:', numberOfPieces);
            let pieceIndex = 0;
            let buffer = Buffer.alloc(0);
            function dispatchWorkers() {
                let promises = [];
                for(let peerIndex=0; peerIndex < this.#peerConfigs.length; peerIndex++) {
                    const worker = this.#createWorker(pieceIndex, peerIndex);
                    
                    promises.push(new Promise((resolve, reject) => {
                            worker.on('message', ([pieceIndex, peerIndex, piece]) => {
                                console.log(`Received piece ${pieceIndex} downloaded by peer ${peerIndex}`);
                                resolve(piece);
                            });

                            worker.on('error', (err) => {
                                console.error(err);
                                reject(err);
                            });
                        })
                    );

                    pieceIndex++;
                    if(pieceIndex === numberOfPieces) {
                        break;
                    }
                }

                Promise.all(promises)
                .then((pieces) => {
                    console.log('Received a set of pieces: ', pieces.length);
                    buffer = Buffer.concat([buffer, ...pieces]);
                    if(pieceIndex < numberOfPieces) {
                        dispatchWorkers.call(this);
                    } else {
                        this.#writePieceToFileSync(filePath, buffer);
                        resolve();
                    }
                })
                .catch((err) => {
                    reject(err);
                });
            }

            dispatchWorkers.call(this);
        });
    }

    #writePieceToFileSync(filePath, buffer) {
        console.log('Writing to:', filePath);
        fs.writeFileSync(filePath, buffer, { flag: 'w' });
    }

    #createWorker(pieceIndex, peerIndex) {
        const pathToWorker = path.resolve(__dirname, 'worker.js');
        console.log("Path to worker:", pathToWorker);
        const worker = new Worker(pathToWorker, {
            workerData: {
                pieceIndex,
                peerIndex,
                clientTorrentInfo: this.#clientTorrentInfo,
                peerConfigs: this.#peerConfigs,
                clientPeerId: this.#clientPeerId
            }
        });
        console.log('Worker created for piece:', pieceIndex);
        return worker;
    }
}