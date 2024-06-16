const { AsyncResource } = require('async_hooks');

// Class is used to store the callback with the execution context
module.exports = class WorkerPoolTaskInfo extends AsyncResource {
    constructor(pieceInfo, callback) {
      super('WorkerPoolTaskInfo');
      this.pieceInfo = pieceInfo;
      this.callback = callback;
    }
  
    done(err, result) {
      this.runInAsyncScope(this.callback, null, err, result);
      this.emitDestroy();  // `TaskInfo`s are used only once.
    }
  }