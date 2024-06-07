const BenDecoder = require('./BenDecoder');
const TorrentLoader = require('./TorrentLoader');
class CommandHandler {

    static decodeCommand(arg) {
        let [result, _] = BenDecoder.decode(arg);
        console.log(JSON.stringify(result));
    }

    static infoCommand(arg) {
        let torrentLoader = new TorrentLoader(arg);
        let data = torrentLoader.getDecodedTorrent();
        let infoHash = torrentLoader.getInfoHash();
        let pieceHashes = Buffer.from(data.info.pieces, "binary");

        console.log(`Tracker URL: ${data.announce}`);
        console.log(`Length: ${data.info.length}`);
        console.log(`Info Hash: ${infoHash}`);
        console.log(`Piece Length: ${data.info['piece length']}`);
        console.log('Piece Hashes:');
        for (let i = 0; i < pieceHashes.length; i += 20) {
            console.log(pieceHashes.subarray(i, i + 20).toString('hex'));
        }
    }

    static async peersCommand(arg) {
        let torrentLoader = new TorrentLoader(arg);
        let peers = await torrentLoader.getPeers();
        console.log(peers);
    }

    static handshakeCommand(arg1, arg2) {
        let torrentLoader = new TorrentLoader(arg1);
        let peer = {};
        [ peer.ip, peer.port ] = arg2.split(':');
        torrentLoader.handshake(peer);
    }
}

module.exports = CommandHandler;