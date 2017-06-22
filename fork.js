'use strict';

var fork = require('child_process').fork;
var path = require('path');

/**
 * @param func
 */
module.exports = function (func) {
    var thread = fork(path.join(__dirname, 'worker.js'));

    thread.send({
        type: 'function',
        data: func.toString()
    });

    thread.resultHandler = thread.errorHandler = thread.exitHandler = function () {};

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
