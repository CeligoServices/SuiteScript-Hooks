/**
 *@NApiVersion 2.x
 */
 define(['N/search','N/record'], function(search, recordObj) {
    var itemFilterId = 'itemid';
    var pageSize = 25;
    var quantityColumnId = 'locationquantityonhand';
    var locationIds = [ 4 ];
    var useLoadRecord = false;

    function VarianceCalculatorColumns(nlapi, pageSize, itemFilterId, quantityColumnId, locationIds, useLoadRecord, useMappedLocation){
        pageSize = pageSize || 25;
        var ITEM_COLUMN = search.createColumn({
            name: 'internalid'
        });  
        var ITEM_IDENTIFIER_COLUMN = search.createColumn({
            name: itemFilterId
        });
        var INACTIVE_COLUMN = search.createColumn({
            name: 'isinactive'
        });
        return [ ITEM_COLUMN, ITEM_IDENTIFIER_COLUMN, INACTIVE_COLUMN ];
    }

    function VarianceCalculatorRun(options, response) {
        
        for (var i = 0; i < response.length; i++) {

            var record = response[i];
            var sublist = record.data.nlobjSublistIds.recmachcustrecord_cps_fia_report_id;
            if (!sublist) {
                continue;
            }//custrecord_cps_fia_netsuite_item custrecord_cps_fia_sku custom record id: customrecord_cps_fba_inventory_adjusts

           // var lines = sublist.lines || [];
            logAudit('Sublist', JSON.stringify(sublist));
            var lines = sublist || [];
            logAudit('Sublist lines', JSON.stringify(lines));
            if (lines.length === 0) {
                continue;
            }

           /* if (useMappedLocation && !locationIds) {
                locationIds = [ record.data.nlobjFieldIds.custrecord_cps_ic_adjustment_location ];
            }*/

            var lineCount = lines.length;
            var pageCount = Math.ceil(lineCount / pageSize);

            for (var j = 0; j < pageCount; j++) {

                var page = lines.slice(j * pageSize, (j + 1) * pageSize);
                var subFilters = [];

                for (var k = 0; k < page.length; k++) {
                    var line = page[k];
                    var name = line.custrecord_cps_fia_sku;
                    subFilters.push([ itemFilterId, 'is', name ]);
                    subFilters.push('OR');
                }
                if(page.length > 0)
                    subFilters.pop();

                var itemSearchResult = search.create({
                        type: search.Type.ITEM,
                        filters: [subFilters],
                        columns: VarianceCalculatorColumns()
                });
                var results= itemSearchResult.run();
                // var results= itemSearchResult.load({
                //     id: 'customsearch_itemFilterId_search'
                //    });
                   logAudit('itemSearchResult', JSON.stringify(results));
                   logAudit('itemSearchResult length', results.length);
                if (results.length === 0) {
                    continue;
                }

                var cache = {};

                results.each(function(result){
                    // var result = results[k];
                    var value = null;
                    value = result.getValue(itemFilterId);
                    logAudit('result itemFilterId Value', value);
                    var t = ': ';
                    if (value.indexOf(t) !== -1) {
                        if (useLoadRecord) { // Where to define
                            var type = result.recordType;// Please search https://system.netsuite.com/app/help/helpcenter.nl?search=Result.recordType for more information.();
                            var id = result.id;
                            logAudit('useLoadRecord type & id', type + ' ' + id);
                            var item = recordObj.load({type: type, id: id});
                            value = item.getValue({ fieldId: itemFilterId });
                        } else {
                            var i = value.indexOf(t);
                            value = value.substr(i + t.length);
                        }
                    }
                    if (!cache[value]) {
                        cache[value] = {};
                    }
                    cache[value] = result;
                    return true;
                });

                for (var k = 0; k < page.length; k++) { // 25

                    var line = page[k];
                    var name = line.custrecord_cps_fia_sku;

                    if (!cache[name]) {
                        continue;
                    }
                    var result = cache[name];
                    logAudit('isinactive results', result.getValue('isinactive'));
                    if (result.getValue('isinactive') === false) {
                        line.custrecord_cps_fia_netsuite_item = parseInt(result.getValue('internalid'), 10);
                    }
                }
            }
        }

        return response;
    }

    function PostMapper(options){
        var response = [];
        for (var i = 0; i < options.postMapData.length; i++) {
            response.push({
                data : JSON.parse(JSON.stringify(options.postMapData[i])),
                errors : []
            });
        }
        logAudit('Response before variance calculator', response);
        try {
            response =  VarianceCalculatorRun(options, response);
        } catch (e) {
            logError('Error details: ', e.name + ' ' + e.message);
            for (var i = 0; i < response.length; i++) {
                response[i].data = null;
                response[i].errors.push({
                    code : e.name,
                    message : e.message
                });
            }
        }
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
            details: JSON.stringify(message)
        });
    }
    return{
        PostMapper: PostMapper
    }
 });