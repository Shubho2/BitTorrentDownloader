const { BenDecoder } = require('./Bencoding');
const TorrentLoader = require('./TorrentFileHandler');
const { Peer } = require('./PeerCommunication');
const { BitTorrentDownloader } = require('./Downloader');
class CommandHandler {

    static decodeCommand(arg) {
        // console.log('Decode command called with argument:', arg);
        let [result, _] = BenDecoder.decode(arg);
        console.log(JSON.stringify(result));
    }

    static infoCommand(arg) {
        console.log('Info command called with argument:', arg);
        let torrentLoader = new TorrentLoader(arg);
        let data = torrentLoader.decodedTorrent;
        let infoHash = torrentLoader.infoHash;
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
        console.log('Peers command called with argument:', arg);
        let torrentLoader = new TorrentLoader(arg);
        let peers = await torrentLoader.getPeers();
        console.log(peers);
    }

    static handshakeCommand(arg1, arg2) {
        console.log('Handshake command called with arguments:', arg1, arg2);
        const torrentLoader = new TorrentLoader(arg1);
        const peer = new Peer(...arg2.split(':'), torrentLoader.peerId);

        const socket = peer.initiateHandshake(torrentLoader.infoHash);

        socket.on('data', (data) => {
            if (data.length < 68) {
                throw new Error("Handshake failed");
            }
            console.log('Handshake successful');
            let peerId = data.subarray(48, 68).toString('hex');
            console.log('Peer ID:', peerId);
        });

        socket.on('end', () => {
            console.log('Connection closed');
        });

        socket.on('error', (err) => {
            console.error(err);
        });

        peer.sendHandshakeMessage();
    }

    static async downloadPieceCommand(arg1, arg2, arg3) {
        console.log('Download piece command called with arguments:', arg1, arg2, arg3);
        const torrentLoader = new TorrentLoader(arg2);
        const filePath = arg1;
        const pieceIndex = parseInt(arg3);
        let peers = await torrentLoader.getPeers();
        torrentLoader.decodedTorrent.info.infoHash = torrentLoader.infoHash;
        const bitTorrentDownloader = new BitTorrentDownloader(
                                                peers,
                                                torrentLoader.peerId,
                                                torrentLoader.decodedTorrent.info
                                            );
        bitTorrentDownloader.downloadPieceTo(filePath, pieceIndex)
        .then(() => {
            console.log(`Piece ${pieceIndex} downloaded to ${filePath}.`);
        })
        .catch((err) => {
            console.error(err);
        });
    }

    static async downloadCommand(arg1, arg2) {
        console.log('Download command called with arguments:', arg1, arg2);
        const torrentLoader = new TorrentLoader(arg2);
        const filePath = arg1;
        let peers = await torrentLoader.getPeers();
        torrentLoader.decodedTorrent.info.infoHash = torrentLoader.infoHash;
        const bitTorrentDownloader = new BitTorrentDownloader(
                                                peers,
                                                torrentLoader.peerId,
                                                torrentLoader.decodedTorrent.info
                                            );
        bitTorrentDownloader.downloadTo(filePath)
        .then(() => {
            console.log(`Downloaded ${arg2} to ${filePath}.`);
        })
        .catch((err) => {
            console.error(err);
        });
    }
}

module.exports = CommandHandler;