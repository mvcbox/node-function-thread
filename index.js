'use strict';

var os = require('os');
var fork = require('./fork');
var merge = require('merge');
var Promise = require('bluebird');
var genericPool = require('generic-pool');

/**
 * @param {Function}    func
 * @param {Object}      [options]
 * @param {Number}      [options.timeout]
 * @param {Boolean}     [options.usePool]
 * @param {Object}      [options.pool]
 * @param {Number}      [options.pool.max]
 * @param {Number}      [options.pool.min]
 * @param {Number}      [options.pool.maxWaitingClients]
 * @param {Boolean}     [options.pool.testOnBorrow]
 * @param {Number}      [options.pool.acquireTimeoutMillis]
 * @param {Boolean}     [options.pool.fifo]
 * @param {Number}      [options.pool.priorityRange]
 * @param {Boolean}     [options.pool.autostart]
 * @param {Number}      [options.pool.evictionRunIntervalMillis]
 * @param {Number}      [options.pool.numTestsPerRun]
 * @param {Number}      [options.pool.softIdleTimeoutMillis]
 * @param {Number}      [options.pool.idleTimeoutMillis]
 * @param {Function}    [options.pool.Promise]
 * @returns {Function}
 */
module.exports = function (func, options) {
    options = merge.recursive({
        timeout: 0,
        usePool: false,
        pool: {
            max: os.cpus().length * 2,
            min: os.cpus().length,
            testOnBorrow: true,
            fifo: false,
            idleTimeoutMillis: 3600000,
            softIdleTimeoutMillis: 600000,
            evictionRunIntervalMillis: 60000,
            numTestsPerRun: os.cpus().length,
            Promise: Promise
        }
    }, options || {});

    var getThread = function () {
        return Promise.resolve(fork(func));
    };
    var releaseThread = function (thread) {
        thread.kill();
    };
    var destroyThread = function (thread) {
        thread.kill();
    };

    if (options.usePool) {
        var pool = genericPool.createPool({
            create: function () {
                return new Promise(function(resolve){
                    resolve(fork(func));
                });
            },
            destroy: function (thread) {
                return new Promise(function(resolve) {
                    thread.kill();
                    resolve();
                });
            },
            validate: function (thread) {
                return thread.connected;
            }
        }, options.pool);

        getThread = pool.acquire.bind(pool);
        releaseThread = pool.release.bind(pool);
        destroyThread = pool.destroy.bind(pool);
    }

    /**
     * @param {*}       input
     * @param {Object}  [_options]
     * @param {Number}  [_options.timeout]
     */
    return function (input, _options) {
        _options = _options || {};
        var timeout = _options.timeout || options.timeout;

        return getThread().then(function(thread) {
            var promise = new Promise(function (resolve, reject) {
                thread.onResult(resolve).onError(reject).sendData(input);
            });

            if (timeout) {
                promise = promise.timeout(timeout);
            }

            return promise.tap(function () {
                releaseThread(thread);
            }).catch(function (err) {
                destroyThread(thread);
                return Promise.reject(err);
            });
        });
    };
};
