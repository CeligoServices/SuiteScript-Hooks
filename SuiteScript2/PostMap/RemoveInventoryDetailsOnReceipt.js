/**
 *@NApiVersion 2.x
 */
 define(['N/search','N/record'], function(search, recordObj) {

    function removeInventoryDetails(options){
        var response = [];
        for (var i = 0; i < options.postMapData.length; i++) {
            response.push({
                data : JSON.parse(JSON.stringify(options.postMapData[i])),
                errors : []
            });
        }
        try {
            var itemIds = [];
            var areInvD = [];
    
            //Get list of all item internal ids
            for(var i=0; i<response.length; i++){
                if(!response[i].data || !response[i].data.nlobjSublistIds || !response[i].data.nlobjSublistIds.item || !response[i].data.nlobjSublistIds.item.lines)
                    continue;
    
                for(var j=0; i< response[i].data.nlobjSublistIds.item.lines.length; j++){
                    if(!response[i].data.nlobjSublistIds.item.lines[j].itemkey)
                        continue;
    
    
                    if(itemIds.indexOf(response[i].data.nlobjSublistIds.item.lines[j].itemkey) == -1)
                        itemIds.push(response[i].data.nlobjSublistIds.item.lines[j].itemkey);
                }
            }
    
            //Search NetSuite to see if items are lot or serialized items and put into the areInvD list
            if(itemIds && itemIds.length > 0){
                var filters = [];
                filters = [
                    search.createFilter({
                    name: 'internalid',
                    operator: search.Operator.ANYOF,
                    values: itemIds
                    })];
                var columns = [];
                columns.push(search.createColumn({name: 'islotitem'}));
                columns.push(search.createColumn({name: 'isserialitem'}));
                var itemSearchResult = search.create({
                    type: search.Type.ITEM,
                    filters: filters,
                    columns: columns
            });
            // var results = itemSearchResult.load({
            //     id: 'customsearch_islotitemandisserialitem_search'
            // });
            logAudit('search customsearch_islotitemandisserialitem_search Result', JSON.stringify(response));
            results.each(function(result){
                    if(result.getValue('islotitem') == 'T' || result.getValue('isserialitem') == 'T'){ // Change "T" to true if needed
                        areInvD[result.id] = true;
                    }
                    else{
                        areInvD[result.id] = false;
                    }
                });
            }
    
            //remove inventory detail section if the items aren't lot or serialized items
            for(var i=0; i<response.length; i++){
                if(!response[i].data || !response[i].data.nlobjSublistIds || !response[i].data.nlobjSublistIds.item || !response[i].data.nlobjSublistIds.item.lines)
                    continue;
    
                for(var j=0; i< response[i].data.nlobjSublistIds.item.lines.length; j++){
                    if(!response[i].data.nlobjSublistIds.item.lines[j].itemkey || !response[i].data.nlobjSublistIds.item.lines[j].celigo_inventorydetail)
                        continue;
    
    
                    if(areInvD[response[i].data.nlobjSublistIds.item.lines[j].itemkey])
                        continue;
                    else
                        delete response[i].data.nlobjSublistIds.item.lines[j].celigo_inventorydetail;
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
            details: JSON.stringify(message)
            });
        }

        return {
            removeInventoryDetails: removeInventoryDetails
        }

 });