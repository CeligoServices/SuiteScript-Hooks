/**
 *@NApiVersion 2.x
 */
 define(['N/record'], function(recordObj) {
    var response = [];
    function itemLotNumbersImport(options){
        var response = [];
        logAudit('PostMap options', JSON.stringify(options));
        for (var i = 0; i < options.postMapData.length; i++) {
            response.push({
                data : JSON.parse(JSON.stringify(options.postMapData[i])),
                errors : []
            });
        }
        try {
            logAudit('PostMap Response', JSON.stringify(response));
            // For each order process the Serial Number for each item
            for (var i = 0; i < response.length; i++) {
                var configObject = response[i].data;
                var errors = response[i].errors;
                var itemLinesObject = configObject.nlobjSublistIds.item || {};
                // Below line could be var itemLines = itemLinesObject || []; as lines property is removed from 2.0
                var itemLines = itemLinesObject.lines || [];
                

                //For each item add inventoryDetailLines from itemLines[*].inventorydetail
                for (var j = 0; j < itemLines.length; ++j) {
                    //item[*].custcol_is_lot_item : This needs to be mapped in IO as a dynamic SKU lookup to 
                    //find if that item is lot numbered item.
                    var isLotItem = itemLines[j].custcol_is_lot_item;
                    
                    if (isLotItem === 'T') {
                        var lotNumbers = itemLines[j].inventorydetail || [];
                        //If the item is Lot Item in NetSuite but no lot number is coming from 3PL then throw error
                        if(!lotNumbers.length){
                            errors.push({
                                code : 'NO_LOT_NUMBER',
                                message : 'No Lot Numbers are found to import for the item.'
                            })
                        }
                        
                        var inventoryDetailLines = [];
                        for (var k = 0; k < lotNumbers.length; k++) {
                            inventoryDetailLines.push({
                                "quantity" : lotNumbers[k].qty,
                                "issueinventorynumber" : lotNumbers[k].lot
                            });
                        }
                        itemLines[j].celigo_inventorydetail = {
                                "nlobjRecordType" : "inventorydetail",
                                "nlobjFieldIds" : {
                                    "celigo_recordmode_dynamic" : true
                                },
                                "nlobjSublistIds" : {
                                    "inventoryassignment" : {
                                        "lines" : inventoryDetailLines
                                    }
                                }
                        };
                    }
                    //Delete it because they are no longer needed.
                    delete itemLines[j].inventorydetail;
                    delete itemLines[j].custcol_is_lot_item;
                }
            }
        } catch (e) {
            logError('ERROR', e.name + '  ' + e.message);
            for (var i = 0; i < response.length; i++) {
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
    return{
        itemLotNumbersImport: itemLotNumbersImport
    }

 });