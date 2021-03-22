/**
 *@NApiVersion 2.x
 */
define(['N/record'], function(record) {

    function getItemPrices(options) {
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
                for (var k = 0; k < response.data.length; k++) {
                    var priceLines = ['price1','price2','price3','price4'];
                    var item = record.load({
                        type: record.Type.INVENTORY_ITEM, 
                        id: response.data[k].id});
                    for(var i=0; i<priceLines.length; i++){
                        //objRecord.getSublists();
                        for(var j=1; j<=item.getLineCount({ 'sublistId': priceLines[i] }); j++){
                            response.data[k][priceLines[i] + '_' + 
                            item.getSublistValue({
                                'sublistId': priceLines[i], 
                                'fieldId':'pricelevel', 
                                'line': j
                            })] = 
                            item.getMatrixSublistValue({
                                'sublistId':priceLines[i], 
                                'fieldId': 'price',
                                'column': j, 
                                'line':1
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

    }
    function logError(title, errorMessage){
        log.error({
            title: title,
            details: errorMessage
        });
    }
    return {
        getItemPrices: getItemPrices
    }
});
