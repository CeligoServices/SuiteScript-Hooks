/**
 *@NApiVersion 2.x
 */
 define(['N/record'], function(recordObj) {

    function updateCustomerOnRecord(){
        var checkboxField = 'custentity_has_imported_order';
        var customerField = 'custrecord1411';
        var response = [];
        logAudit('PostMap Inputdata',JSON.stringify(options));
        for (var i = 0; i < options.postMapData.length; i++) {
            response.push({
                data : JSON.parse(JSON.stringify(options.postMapData[i])),
                errors : []
            });
        }
        try {
            logAudit('PostMap Response', JSON.stringify(response));
            for (var i = 0; i < response.length; i++) {
                var record = response[i].data;
                var errors = response[i].errors;
                if (!record.nlobjFieldIds[customerField]) {
                    response[i].data = null;
                    errors.push({
                        code : 'NO_Customer',
                        message : 'The order doesnt contain an user.  Please check your mappings.'
                    });
                    continue;
                }
                try{
                    recordObj.submitFields({
                        type: record.Type.CUSTOMER,
                        id: record.nlobjFieldIds[customerField],
                        values: {
                            checkboxField: 'T'
                        }
                    });
                }catch (e){
                    logError('ERROR', e.name + ' ' + e.message);
                    response[i].data = null;
                    response[i].errors.push({
                        code : e.name,
                        message : e.message
                    });				
                }
            }
        } catch (e) {
            logError('ERROR', e.name +  '  ' + e.message);
            for (var i = 0; i < response.length; i++) {
                response[i].data = null;
                response[i].errors.push({
                    code : e.name,
                    message : e.message
                });
            }
        }
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
        updateCustomerOnRecord: updateCustomerOnRecord
    }

 });