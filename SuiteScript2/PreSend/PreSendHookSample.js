/**
 *@NApiVersion 2.0
 */
define(['N/runtime'], function(runtime) {

    function samplePreSendHookTest(options) {

        var executionContext = runtime.executionContext; // executionContext is a Property
        log.debug({
            title: 'PreSend_executionConext Value',
            details: executionContext
        });

        // if (executionContext === 'scheduled') {
        //     data = [ options.data ];
        // } else {
        //     data = options.data;
        // }

        var response = {
            data : options.data,
            errors : []
        };
        try {
           logAudit('PreSend inputData', JSON.stringify(options));
           logDebug('PreSend responseData', JSON.stringify(response));
        } catch (error) {
            logError('PreSend Exception', error.name + ' ' + error.message);
            response.data = [];
            response.errors.push({
                code : error.name,
                message : error.message
            });
        }
        return response;
    }

    function logError(title, errorMessage){
        log.error({
            title: title,
            details: errorMessage
        });
    }
    function logAudit(title, details){
        log.audit({
            title: title,
            details: details
        });
    }
    function logDebug(title, details){
        log.debug({
            title: title,
            details: details
        });
    }

    return {
        samplePreSendHook: samplePreSendHookTest
    }
});
