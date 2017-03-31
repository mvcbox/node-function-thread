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
process.on('message', function(data) {
    if (___workerFunction) {
        ___workerFunction(data, function (result) {
            process.send({
                type: 'result',
                data: result
            });
        }, sendError);
    } else {
        eval('___workerFunction = ' + data);
    }
});
