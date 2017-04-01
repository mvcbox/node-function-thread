'use strict';
var childProcess = require('child_process');
var path = require('path');
/**
 * @param func
 * @returns {ChildProcess}
 */
module.exports = function (func) {
    var thread = childProcess.fork(path.join(__dirname, 'worker.js'));
    thread.send({
        type: 'function',
        data: func.toString()
    });
    thread.resultHandler = function () {};
    thread.errorHandler = function () {};
    thread.exitHandler = function () {};
    thread.sendData = function (data) {
        this.send({
            type: 'input',
            data: data
        });
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
    thread.on('message', function (message) {
        switch (message.type) {
            case 'result':
                this.resultHandler(message.data);
                break;
            case 'error':
                this.errorHandler(message.data);
                break;
            default:
                // ...
        }
    });
    thread.on('exit', thread.exitHandler);
    return thread;
};
