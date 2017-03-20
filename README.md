# node-function-thread

## Run the function in a separate thread

### Install:
```bash
npm install function-thread --save
```

### Function thread args:
```
 func - Function to run in a separate thread
```

```
options - Options when creating a function
```
```
options.timeout - Timeout (milliseconds) [Default: 0]
```
```
options.usePool - Do I need to use a pool of workers (bool) [Default: false]
```
```
options.pool - Pool options (object). Details - https://github.com/coopernurse/node-pool/blob/master/README.md
```

### Example:
```js
'use strict';

const functionThread = require('function-thread');

// Creating a function
const someFunction = functionThread(function (input, done) {
    // input - Some data for calculations
    // Some heavy calculations, which usually block the thread
    done('Result...');
});

// Run the function in a separate thread
someFunction('Some data for calculations 1').then(function (result) {
    console.log(result);
}).catch(function (err) {
    console.error(err);
});

// Run the function in a separate thread
someFunction('Some data for calculations 2').then(function (result) {
    console.log(result);
}).catch(function (err) {
    console.error(err);
});

// Run the function in a separate thread
someFunction('Some data for calculations 3').then(function (result) {
    console.log(result);
}).catch(function (err) {
    console.error(err);
});
```
