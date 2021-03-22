/**
 *@NApiVersion 2.x
 */
 define(['N/record'], function(record) {

    function getSubscriptionPrice(options) {

        // The object that will be returned from this hook
        var response = {};
            response.data = [];
            response.errors = [];

            for (var i = 0; i < options.data.length; i++) {
                /*
                 * The response object contains of a data array and an errors array The data
                 * array is the elements that will be processed by integrator.io The errors
                 * array will show up as failed records on the integrator.io dashboard. Each
                 * element in the array may consist of one or more errors
                 */
                response.data.push(options.data[i]);
            }
            try {
                for(var r =0; r<response.data.length; r++){

                    var subscription = record.load({
                        type: record.Type.SUBSCRIPTION, 
                        id: response.data[r][0].id
                    });
                    if(!subscription)
                        continue;

                    //objRecord.getSublists();
                    for(var l = 1; l<= subscription.getLineCount({ 'sublistId':'priceinterval'}); l++){
                        for(var k =0; k<response.data[r].length; k++){
                            if(response.data[r][k]['Line Number'] != subscription.getSublistValue({'sublistId': 'priceinterval','fieldId': 'linenumber', 'line':l}))
                                continue;
        
                            if(!response.data[r][k].intervals)
                                response.data[r][k].intervals = [];
        
                            response.data[r][k].intervals.push({
                                'frequency': subscription.getSublistText({'sublistId': 'priceinterval','fieldId': 'frequency', 'line':l}),
                                'amount': subscription.getSublistText({'sublistId':'priceinterval','fieldId':'recurringamount', 'line':l}),
                                'status': subscription.getSublistText({'sublistId':'priceinterval','fieldId':'status', 'line':l})
                            });
                        }
                    }
                }
            } catch (e) {
                logError('ERROR', e.name + ' ' + e.message);
                /*
                 * the individual error should be logged in the function called within
                 * the try-catch block
                 */
                for (var i = 0; i < response.data.length; i++) {
                    response.data[i] = null;
                    response.errors.push({
                        code : e.name,
                        message : e.message
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

    return {
        getSubscriptionPrice: getSubscriptionPrice
    }
});