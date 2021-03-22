/**
 *@NApiVersion 2.0
 */

 define([], function() {

    function samplePostMapHookTest(options) {
        
        var response = [];

        for(var i=0; options.postMapData.length > i; i++){
            //if(options.postMapData[i].nlobjFieldIds.internalid == "14535"){
                // options.postMapData[i].nlobjFieldIds.memo = "TestMemo_postMapData";
           // }
            response.push({
                data : options.postMapData[i],
                errors: []
            });
        }
        try {
            logAudit('PostMaphook inputData',JSON.stringify(options));
            logDebug('PostMaphook responseData', JSON.stringify(response));

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
        samplePostMapHook: samplePostMapHookTest
    }
});
