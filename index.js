'use strict';

const os = require('os');
const _ = require('lodash');
const spawn = require('threads').spawn;
const Bluebird = require('bluebird');
const genericPool = require('generic-pool');

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
    options = _.merge({
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
            Promise: Bluebird
        }
    }, options || {});

    if (options.usePool) {
        var pool = genericPool.createPool({
            create: function () {
                return new Bluebird(function(resolve){
                    resolve(spawn(func));
                });
            },
            destroy: function (thread) {
                return new Bluebird(function(resolve) {
                    thread.kill();
                    resolve();
                });
            },
            validate: function (thread) {
                return thread.slave.connected;
            }
        }, options.pool);

        return function (input) {
            return pool.acquire().then(function(thread) {
                var promise = new Bluebird(function (resolve, reject) {
                    thread.send(input).on('message', resolve).on('error', reject);
                });

                if (options.timeout) {
                    promise = promise.timeout(options.timeout);
                }

                return promise.tap(function () {
                    pool.release(thread);
                }).catch(function (err) {
                    pool.destroy(thread);
                    return Bluebird.reject(err);
                });
            });
        };
    }

    return function (input) {
        var thread = spawn(func);
        var promise = new Bluebird(function (resolve, reject) {
            thread.send(input).on('message', resolve).on('error', reject);
        });

        if (options.timeout) {
            promise = promise.timeout(options.timeout);
        }

        return promise.tap(function () {
            thread.kill();
        }).catch(function (err) {
            thread.kill();
            return Bluebird.reject(err);
        });
    };
};
