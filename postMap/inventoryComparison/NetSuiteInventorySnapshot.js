function _package(elementsString) {

    if (elementsString) {

        var elements = elementsString.split('.');
        var object = this;

        for (var i = 0; i < elements.length; i++) {

            var element = elements[i];

            if (!object[element]) {
                object[element] = {};
            }

            object = object[element];

        }

    }

};


_package('Celigo.services.integration.iio.hook');

/**
 * @param {Celigo.suitescript.SuiteScript}
 *            nlapi
 * @param {Array}
 *            handlers
 * @returns {Celigo.services.integration.iio.hook.PostMapper}
 */
Celigo.services.integration.iio.hook.PostMapper = function(nlapi, handlers) {

    /**
     * @param {Object}
     *            options
     * @returns {Array}
     */
    this.postMap = function(options) {

        var response = [];
        for (var i = 0; i < options.postMapData.length; i++) {
            response.push({
                data : JSON.parse(JSON.stringify(options.postMapData[i])),
                errors : []
            });
        }

        try {
            for (var i = 0; i < handlers.length; i++) {
                handlers[i].run(options, response);
            }
        } catch (e) {
            nlapi.logExecution('ERROR', e.name, e.message);
            for (var i = 0; i < response.length; i++) {
                response[i].data = null;
                response[i].errors.push({
                    code : e.name,
                    message : e.message
                });
            }
        }

        return response;

    };

};


_package('Celigo.services.integration.iio.inventorycomparison');

/**
 * @param {Celigo.suitescript.SuiteScript}
 *            nlapi
 * @param {Array}
 *            locationsIds
 * @returns {Celigo.services.integration.iio.inventorycomparison.VarianceCalculator}
 */
Celigo.services.integration.iio.inventorycomparison.VarianceCalculator = function(
        nlapi, pageSize, itemFilterId, quantityColumnId, locationIds,
        useLoadRecord, useMappedLocation) {

    pageSize = pageSize || 25;

    var QUANTITY_COLUMN = new nlobjSearchColumn(quantityColumnId);
    var LOCATION_COLUMN = new nlobjSearchColumn('inventorylocation');
    var ITEM_COLUMN = new nlobjSearchColumn('internalid');
    var ITEM_IDENTIFIER_COLUMN = new nlobjSearchColumn(itemFilterId);
    var INACTIVE_COLUMN = new nlobjSearchColumn('isinactive');
    var COLUMNS = [ QUANTITY_COLUMN, ITEM_COLUMN, ITEM_IDENTIFIER_COLUMN,
            INACTIVE_COLUMN ];

    /**
     * @param {Object}
     *            options
     * @param {Array}
     *            response
     */
    this.run = function(options, response) {

        nlapi.logExecution('AUDIT', 'VarianceCalculator response', JSON
                .stringify(response));

        for (var i = 0; i < response.length; i++) {

            var record = response[i];
            var sublist = record.data.nlobjSublistIds.recmachcustrecord_cps_icl_parent;
            if (!sublist) {
                continue;
            }

            var lines = sublist.lines || [];
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
                    if (k < page.length - 1) {
                        subFilters.push('OR');
                    }
                }
                var filters = [];
                filters.push(subFilters);
                if (locationIds && locationIds.length > 0) {
                    filters.push('AND');
                    filters.push([ 'inventorylocation', 'anyof', locationIds ]);
                    COLUMNS.push(LOCATION_COLUMN);
                }

                var results = nlapi
                        .searchRecord('item', null, filters, COLUMNS)
                        || [];
                if (results.length === 0) {
                    continue;
                }

                var cache = {};

                for (var k = 0; k < results.length; k++) {
                    var result = results[k];
                    var value = null;
                    value = result.getValue(ITEM_IDENTIFIER_COLUMN);

                    var t = ': ';
                    if (value.indexOf(t) !== -1) {
                        if (useLoadRecord) {
                            var type = result.getRecordType();
                            var id = result.getId();
                            var item = nlapi.loadRecord(type, id);
                            value = item.getFieldValue(itemFilterId);
                        } else {
                            var i = value.indexOf(t);
                            value = value.substr(i + t.length);
                        }
                    }

                    var location = -1;
                    if (locationIds && locationIds.length > 0) {
                        location = result.getValue(LOCATION_COLUMN);
                    }
                    if (!cache[value]) {
                        cache[value] = {};
                    }
                    cache[value][location] = result;
                }

                for (var k = 0; k < page.length; k++) { // 25

                    var line = page[k];
                    var name = line.custrecord_cps_icl_3pl_item_name;
                    var location = line.custrecord_cps_icl_location || -1;

                    if (!cache[name] || !cache[name][location]) {
                        continue;
                    }
                    var result = cache[name][location];

                    var nsQuantity = parseFloat(result
                            .getValue(QUANTITY_COLUMN)) || 0;
                    line.custrecord_cps_icl_ns_quantity = nsQuantity;
                    var threeplQuantity = parseFloat(line.custrecord_cps_icl_3pl_quantity);

                    var variance = threeplQuantity - nsQuantity;

                    if (variance !== 0) {
                        record.data.nlobjFieldIds.isinactive = 'F';
                    }

                    line._item_type = result.getRecordType();
                    line.custrecord_cps_icl_variance = variance;

                    if (result.getValue(INACTIVE_COLUMN) === 'F') {
                        line.custrecord_cps_icl_ns_item = parseInt(result
                                .getValue(ITEM_COLUMN), 10);
                    }
                }
            }
        }
    };
};


_package('Celigo.threepl.inventoryadjustments');

Celigo.threepl.inventoryadjustments.SetVar = function(
        nlapi) {

    this.run = function(options, response) {

        nlapi.logExecution('AUDIT', 'SetVar', JSON.stringify(response));

        for (var i = 0; i < response.length; i++) {
            var itemSublist = response[i].data.nlobjSublistIds.recmachcustrecord_cps_icl_parent;
            if (itemSublist) {
                var lines = itemSublist.lines;
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
    };
};
(function(global) {

    var VarianceCalculator = Celigo.services.integration.iio.inventorycomparison.VarianceCalculator;
    var PostMapper = Celigo.services.integration.iio.hook.PostMapper;
    var SuiteScript = Celigo.suitescript.SuiteScript;
    
    var SetVar = Celigo.threepl.inventoryadjustments.SetVar;

    var nlapi = SuiteScript;
    var pageSize = 25;
    var itemFilterId = 'itemid'; //Replace this with the field on the item to compare with
    var quantityColumnId = 'locationquantityonhand';
    var locationIds = [ 4 ];
    
    var varianceCalculator = new VarianceCalculator(nlapi, pageSize, itemFilterId, quantityColumnId, locationIds);
    
    var setVar = new SetVar(nlapi);

    global.postMap = new PostMapper(nlapi, [ varianceCalculator, setVar]).postMap;

})(this);
