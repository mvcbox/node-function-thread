'use strict';

/**
 * @param {*} err
 */
function sendError(err) {
    if (typeof err === 'object' && 'message' in err && 'stack' in err) {
        err = {
            message: err.message,
            stack: err.stack
        };
    }

    process.send({
        type: 'error',
        data: err
    });
}

var ___workerFunction;

process.on('uncaughtException', sendError);
process.on('unhandledRejection', sendError);

process.on('message', function(message) {
    switch (message.type) {
        case 'input':
            ___workerFunction(message.data, function (result) {
                process.send({
                    type: 'result',
                    data: result
                });
            }, sendError);
            break;
        case 'function':
            eval('___workerFunction = ' + message.data);
            break;
        default:
            // ...
    }
});
