// Reference: https://nodejs.org/api/async_context.html#using-asyncresource-for-a-worker-thread-pool

const path = require('path');
const { EventEmitter } = require('events');
const { Worker } = require('worker_threads');
const WorkerPoolTaskInfo = require('./WorkerPoolTaskInfo');

const kTaskInfo = Symbol('kTaskInfo');
const kWorkerFreedEvent = Symbol('kWorkerFreedEvent');
const kPeerConfig = Symbol('kPeerConfig');


// Class is used create worker for all the peerConfigs
class WorkerPool extends EventEmitter {
  constructor(peerConfigs, clientPeerId, clientTorrentInfo) {
    super();
    this.peerConfigs = peerConfigs;
    this.clientPeerId = clientPeerId;
    this.clientTorrentInfo = clientTorrentInfo;
    this.workers = [];
    this.freeWorkers = [];
    this.tasks = [];

    for (const peerConfig of peerConfigs) {
      this.addNewWorker(peerConfig);
    }

    // Any time the kWorkerFreedEvent is emitted, dispatch
    // the next task pending in the queue, if any.
    this.on(kWorkerFreedEvent, () => {
      if (this.tasks.length > 0) {
        const { pieceInfo, callback } = this.tasks.shift();
        this.runTask(pieceInfo, callback);
      }
    });
  }

  addNewWorker(peerConfig) {
    const worker = new Worker(path.resolve(__dirname, 'task_processor.js'),
                              { workerData: { 
                                peerConfig, 
                                clientPeerId: this.clientPeerId, 
                                clientTorrentInfo: this.clientTorrentInfo 
                            } 
                        });
    worker.on('message', (result) => {
      // In case of success: Call the callback that was passed to `runTask`,
      // remove the `TaskInfo` associated with the Worker, and mark it as free
      // again.
      const wrappedResult = {pieceIndex: worker[kTaskInfo].pieceInfo.pieceIndex, piece: result};
      worker[kTaskInfo].done(null, wrappedResult);
      worker[kTaskInfo] = null;
      this.freeWorkers.push(worker);
      this.emit(kWorkerFreedEvent);
    });
    worker.on('error', (err) => {
      // In case of an uncaught exception: Call the callback that was passed to
      // `runTask` with the error.
      if (worker[kTaskInfo]) {
        const pieceInfo = worker[kTaskInfo].pieceInfo;
        if(pieceInfo.hasTriedAllPeers(this.peerConfigs)) {
            console.log('All peers have been tried for piece:', pieceInfo.pieceIndex);
            worker[kTaskInfo].done(err, null);
        }
        else {
            console.log('Trying with new peer for piece:', pieceInfo.pieceIndex);
            this.runTask(pieceInfo, worker[kTaskInfo].callback);
        }
      } else {
        this.emit('error', err);
      }
      // Remove the worker from the list and start a new Worker to replace the
      // current one.
      this.workers.splice(this.workers.indexOf(worker), 1);
      this.addNewWorker(peerConfig);
    });

    worker[kPeerConfig] = peerConfig;
    this.workers.push(worker);
    this.freeWorkers.push(worker);
    this.emit(kWorkerFreedEvent);
  }

  runTask(pieceInfo, callback) {

    for(let i = 0; i < this.freeWorkers.length; i++) {
        if(!pieceInfo.hasTriedWithPeer(this.freeWorkers[i][kPeerConfig])) {
            const [worker] = this.freeWorkers.splice(i, 1);
            worker[kTaskInfo] = new WorkerPoolTaskInfo(pieceInfo, callback);
            pieceInfo.addPeer(worker[kPeerConfig]);
            worker.postMessage(pieceInfo.pieceIndex);
            return;
        }
    }

    this.tasks.push({ pieceInfo, callback });
  }

  close() {
    for (const worker of this.workers) worker.terminate();
  }
}

module.exports = WorkerPool;
