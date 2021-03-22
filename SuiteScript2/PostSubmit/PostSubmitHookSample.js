/**
 *@NApiVersion 2.0
 */

 define([], function() {

    function samplePostSubmitHookTest(options) {
        var response = [];

        for(var i=0; options.responseData.length > i; i++){
            var clone = options.responseData[i];
            response.push({
                id: clone.id,
                statusCode: clone.statusCode,
                errors: clone.errors,
                dataURI: clone.dataURI
            });
        }
        try {
            logAudit('PostSubmitHook inputData', JSON.stringify(options));
            logDebug('PostSubmitHook responseData',JSON.stringify(response));
        } catch (error) {
            logError('PreSend Exception', error.name + ' ' + error.message);
            for (var i = 0; i < response.length; i++) {
                response[i].statusCode = 422;
                response[i].errors.push({
                    code : error.name,
                    message : error.message
                });
            }
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
    return{
        samplePostSubmitHook: samplePostSubmitHookTest
    }
});