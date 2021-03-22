/**
 *@NApiVersion 2.x
 */
 define(['N/record'], function(recordObj) {

    function setShipGroup(options){
        var response = [];

        for (var i = 0; i < options.postMapData.length; i++) {
            response.push({
                data : JSON.parse(JSON.stringify(options.postMapData[i])),
                errors : []
            });
        }

        for (var i = 0; i < response.length; i++) {
            try{
                logDebug('record: ' + i, JSON.stringify(response[i].data));
                var order = recordObj.load({
                    type: recordObj.Type.SALES_ORDER,
                    id: response[i].data.nlobjFieldIds['celigo_nlobjTransformId']
                });
                var shipGroup = order.getSublistValue( {
                    sublistId: 'item', 
                    fieldId: 'shipgroup', 
                    line: (response[i].data.nlobjSublistIds.item.lines[0]["line"]) || 1
                });
                response[i].data.nlobjFieldIds.initializeValues = {
                    "shipgroup":shipGroup
                };
                logDebug('after', JSON.stringify(response[i].data));
            }catch (e){
                response[i].data = null;
                response[i].errors.push({
                    code : e.name,
                    message : e.message
                });
            }
        }
        //Send the data to the submit step
        return response;
    }
function logDebug(title, message){
    log.debug({
        title: title,
        details: message
    });
}
    function logError(title, message){
        log.error({
            title: title,
            details: message
        });
    }
    function logAudit(title, message){
        log.audit({
            title: title,
            details: message
        });
    }
    return {
        setShipGroup: setShipGroup
    }

 });