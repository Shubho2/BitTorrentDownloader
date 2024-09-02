# Introduction
A simple BitTorrent downloader to download a file using torrent information. This project implements Bencoder and BenDecoder for Bencoded torrent files. It also uses the NodeJS [worker threads](https://nodejs.org/api/worker_threads.html) to download multiple parts of a file simultaneously.

## How to build and run this project
* Ensure you have `node (18)` installed locally
* Run `./your_bittorrent.sh <command> <args>}` to run your program, which is implemented in
   `app/main.js`.
Note: Available commands: decode, info, peers, handshake, download
