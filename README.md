# node-function-thread

## Run the function in a separate thread

### Install:
```bash
npm install function-thread --save
```

### Function thread args:
- `func`: Function to run in a separate thread
- `options`: Options when creating a function (Object):
- `options.timeout`: Timeout (milliseconds) (Default: 0)
- `options.usePool`: Do I need to use a pool of workers (Bool) (Default: false)
- `options.pool`: Pool options (Object):
- `options.pool.max`: maximum number of resources to create at any given time. (Default: CPUs count * 2)
- `options.pool.min`: minimum number of resources to keep in pool at any given time. If this is set >= max, the pool will silently set the min to equal `max`. (Default: CPUs count)
- `options.pool.maxWaitingClients`: maximum number of queued requests allowed, additional `acquire` calls will be callback with an `err` in a future cycle of the event loop.
- `options.pool.testOnBorrow`: `boolean`: should the pool validate resources before giving them to clients. Requires that either `factory.validate` or `factory.validateAsync` to be specified (Default: true)
- `options.pool.acquireTimeoutMillis`: max milliseconds an `acquire` call will wait for a resource before timing out. (Default: no limit), if supplied should non-zero positive integer.
- `options.pool.fifo` : if true the oldest resources will be first to be allocated. If false the most recently released resources will be the first to be allocated. This in effect turns the pool's behaviour from a queue into a stack. `boolean`, (Default: false)
- `options.pool.priorityRange`: int between 1 and x - if set, borrowers can specify their relative priority in the queue if no resources are available.
                         see example.  (Default: 1)
- `options.pool.autostart`: boolean, should the pool start creating resources etc once the constructor is called, (Default: true)
- `options.pool.evictionRunIntervalMillis`: How often to run eviction checks. (Default: 60000)
- `options.pool.numTestsPerRun`: Number of resources to check each eviction run.  Default: (Default: CPUs count).
- `options.pool.softIdleTimeoutMillis`: amount of time an object may sit idle in the pool before it is eligible for eviction by the idle object evictor (if any), with the extra condition that at least "min idle" object instances remain in the pool. (Default: 600000)
- `options.pool.idleTimeoutMillis`: the minimum amount of time that an object may sit idle in the pool before it is eligible for eviction due to idle time. Supercedes `softIdleTimeoutMillis` (Default: 3600000)
- `options.pool.Promise`: Promise lib, a Promises/A+ implementation that the pool should use. Default: `options.pool.Promise = require('bluebird');`.


### Example:
```js
'use strict';

const functionThread = require('function-thread');

// Creating a function
const someFunction = functionThread(function (input, resolve, reject) {
    // input - Some data for calculations
    // Some heavy calculations, which usually block the thread
    resolve('Result...');
});

// Run the function in a separate thread
someFunction('Some data for calculations 1', {
    timeout: 500 // Custom timeout
}).then(function (result) {
    console.log(result);
}).catch(function (err) {
    console.error(err);
});

// Run the function in a separate thread
someFunction('Some data for calculations 2', {
    timeout: 1000 // Custom timeout
}).then(function (result) {
    console.log(result);
}).catch(function (err) {
    console.error(err);
});

// Run the function in a separate thread
someFunction('Some data for calculations 3', {
    timeout: 1500 // Custom timeout
}).then(function (result) {
    console.log(result);
}).catch(function (err) {
    console.error(err);
});
```
