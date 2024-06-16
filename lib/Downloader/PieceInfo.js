
module.exports = class PieceInfo {
    #pieceIndex;
    #triedPeers;

    constructor(pieceIndex) {
        this.#pieceIndex = pieceIndex;
        this.#triedPeers = new Set();
    }

    get pieceIndex() {
        return this.#pieceIndex;
    }

    hasTriedWithPeer(peerConfig) {
        return this.#triedPeers.has(peerConfig);
    }

    addPeer(peerConfig) {
        this.#triedPeers.add(peerConfig);
    }

    hasTriedAllPeers(peerConfigs) {
        return peerConfigs.every(peerConfig => this.#triedPeers.has(peerConfig));
    }

}