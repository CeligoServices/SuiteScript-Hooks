/**
 *@NApiVersion 2.x
 */
define(['N/search','N/record'], function(search, recordObj) {
    // var nlapi = SuiteScript;
    var pageSize = 25;
    var itemFilterId = 'itemid'; //Replace this with the field on the item to compare with
    var quantityColumnId = 'locationquantityonhand';
    var locationIds = [ 2 ];
    var useMappedLocation = false;
    var useLoadRecord = false;
    function PostMapper(options){
        var response = [];
        for (var i = 0; i < options.postMapData.length; i++) {
            response.push({
                data : JSON.parse(JSON.stringify(options.postMapData[i])),
                errors : []
            });
            logAudit('PostMapper response before VarianceCalculator', JSON.stringify(response));
        }
        try {
           var varResponse =  VarianceCalculator(options, response);
        //    logAudit('varianceCalculator response' ,JSON.stringify(varResponse));
           response = setVar(options, varResponse);
        //    logAudit('setVarResponse', JSON.stringify(response));
        } catch (e) {
           logError('logErrordetails',  e.name + '   ' + e.message);
           logError('complete Error', JSON.stringify(e));
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
    function VarianceCalculator(options, response){

                    pageSize = pageSize || 25;
                var QUANTITY_COLUMN = search.createColumn({ name: quantityColumnId }); 
                var LOCATION_COLUMN = search.createColumn({ name: 'inventorylocation' }); 
                var ITEM_COLUMN = search.createColumn({  name: 'internalid' });  
                var ITEM_IDENTIFIER_COLUMN = search.createColumn({ name: itemFilterId });
                var INACTIVE_COLUMN = search.createColumn({ name: 'isinactive' });
                var COLUMNS = [ QUANTITY_COLUMN, ITEM_COLUMN, ITEM_IDENTIFIER_COLUMN, INACTIVE_COLUMN ];

                for (var i = 0; i < response.length; i++) {

                    var record = response[i];
                    var sublist = record.data.nlobjSublistIds.recmachcustrecord_cps_icl_parent;
                    if (!sublist) {
                        continue;
                    }
                    logAudit('Sublist', JSON.stringify(sublist));
                    var lines = sublist || [];
                    logAudit('Sublist lines', JSON.stringify(lines));
                    if (lines.length === 0) {
                        continue;
                    }
                    if (useMappedLocation && !locationIds) {
                        locationIds = [ record.data.nlobjFieldIds.custrecord_cps_ic_adjustment_location ];
                    }
                    var lineCount = lines.length;
                    var pageCount = Math.ceil(lineCount / pageSize);
        
                    for (var j = 0; j < pageCount; j++) {
        
                        var page = lines.slice(j * pageSize, (j + 1) * pageSize);
                        var subFilters = [];
                        
                        for (var k = 0; k < page.length; k++) {
                            var line = page[k];
                            var name = line.custrecord_cps_icl_3pl_item_name;
                            subFilters.push([ itemFilterId, 'is', name ]);
                            subFilters.push('OR');
                        }
                        if(page.length > 0)
                            subFilters.pop();

                        var filters = [];
                        filters.push(subFilters);
                        
                        if (locationIds && locationIds.length > 0) {
                            filters.push('AND');
                            filters.push([ 'inventorylocation', 'anyof', locationIds ]);
                            COLUMNS.push(LOCATION_COLUMN);
                        }

                        logAudit('Print filter', JSON.stringify(filters));
                        var itemSearchResult = search.create({
                                    type: search.Type.ITEM,
                                    filters: [filters],
                                    columns: COLUMNS
                            });
                        var results= itemSearchResult.run();
                        if (results.length === 0) {
                            continue;
                        }
                        var cache = {};
                        results.each(function(result){
                           logAudit('Starting of the each', JSON.stringify(result));
                            var value = null;
                            logAudit('Result actualValue', result.getValue(itemFilterId) );
                            value = result.getValue(itemFilterId);
                            logAudit('result itemFilterId value', value);
                            var t = ': ';
                            if (value.indexOf(t) !== -1) {
                                if (useLoadRecord) {
                                    var type = result.recordType;
                                    var id = result.id;
                                    logAudit('useLoadRecord type & id', type + ' ' + id)
                                    var item = recordObj.load({type: type, id: id});
                                    value = item.getValue({ fieldId: itemFilterId });
                                } else {
                                    var i = value.indexOf(t);
                                    value = value.substr(i + t.length);
                                }
                            }
                            var location = -1;
                            if (locationIds && locationIds.length > 0) {
                                location = result.getValue('inventorylocation');
                            }
                            if (!cache[value]) {
                                cache[value] = {};
                            }
                            cache[value][location] = result;
                            return true;
                        });
        
                        for (var k = 0; k < page.length; k++) { // 25
                            //logAudit('pageLength', page.length);
                            var line = page[k];
                            var name = line.custrecord_cps_icl_3pl_item_name;
                            var location = line.custrecord_cps_icl_location || -1;
        
                            if (!cache[name] || !cache[name][location]) {
                               // logAudit('continue', cache[name] )
                                continue;
                            }
                            var result = cache[name][location];
        
                            var nsQuantity = parseFloat(result.getValue(quantityColumnId)) || 0;
                            line.custrecord_cps_icl_ns_quantity = nsQuantity;
                            var threeplQuantity = parseFloat(line.custrecord_cps_icl_3pl_quantity);
        
                            var variance = threeplQuantity - nsQuantity;
                            //logAudit('Everyrecord object print', record.data.nlobjFieldIds);
                            if (variance !== 0) {
                                record.data.nlobjFieldIds.isinactive = 'F';
                            }
        
                            line._item_type = result.recordType;
                            line.custrecord_cps_icl_variance = variance;

                            //logAudit('result Object print', result);
                            //logAudit('result isinactive Value', result.getValue('isinactive'));
                            //logAudit('result internalId', result.getValue('internalid'));
                            
                            if (result.getValue('isinactive') === false) {
                                //logAudit('Inside internalId set', result.getValue('internalid'));
                                line.custrecord_cps_icl_ns_item = parseInt(result.getValue('internalid'), 10);
                            }
                        }
                    }
                }
                return response;
    }
    function setVar(options, response){
        logAudit('setVar response' , response);
        for (var i = 0; i < response.length; i++) {
            var itemSublist = response[i].data.nlobjSublistIds.recmachcustrecord_cps_icl_parent;
            if (itemSublist) {
                var lines = response[i].data.nlobjSublistIds.recmachcustrecord_cps_icl_parent;
                logAudit('itemSublist lines', lines);
                //logAudit('Dummy Audit log', itemSublist);
                if(lines != undefined){
                for (var j = lines.length - 1; j >= 0; j--) {
                    var item = lines[j];
                    if(item.custrecord_cps_icl_variance)
                        continue;
                    if(!item.custrecord_cps_icl_ns_quantity){
                            item.custrecord_cps_icl_ns_quantity = 0;
                            item.custrecord_cps_icl_variance = item.custrecord_cps_icl_3pl_quantity;
                    }                
                }
            }
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
            details: message
        });
    }

    return {
        PostMapper: PostMapper
    }
});