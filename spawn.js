var childProcess = require('child_process');
var path = require('path');

module.exports = function (func) {
    var thread = childProcess.fork(path.join(__dirname, 'worker.js'));
    thread.send(func.toString());
    thread.resultHandler = function () {};
    thread.errorHandler = function () {};
    thread.exitHandler = function () {};
    thread.sendData = function (data) {
        this.send(undefined === data ? null : data);
        return this;
    };
    thread.onResult = function (handler) {
        this.resultHandler = handler;
        return this;
    };
    thread.onError = function (handler) {
        this.errorHandler = handler;
        return this;
    };
    thread.onExit = function (handler) {
        this.exitHandler = handler;
        return this;
    };
    thread.on('message', function (data) {
        if (typeof data === 'object') {
            switch (data.type) {
                case 'result':
                    this.resultHandler(data.data);
                    break;
                case 'error':
                    this.errorHandler(data.data);
                    break;
                default:
                    // ...
            }
        }
    });
    thread.on('exit', thread.exitHandler);
    return thread;
};
