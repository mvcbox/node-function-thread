'use strict';

const os = require('os');
const _ = require('lodash');
const spawn = require('threads').spawn;
const Bluebird = require('bluebird');
const genericPool = require('generic-pool');

/**
 * @param func
 * @param options
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
            Promise: Bluebird
        }
    }, options || {});

    if (options.usePool) {
        let pool = genericPool.createPool({
            create: function () {
                return new Bluebird(function(resolve){
                    let thread = spawn(func);
                    resolve(thread);
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
                let promise = new Bluebird(function (resolve, reject) {
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
        let thread = spawn(func);

        let promise = new Bluebird(function (resolve, reject) {
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
