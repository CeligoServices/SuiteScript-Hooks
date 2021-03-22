/**
 *@NApiVersion 2.x
 */
define(['N/search','N/record'], function(search, recordObj) {
    function autobillSalesOrder(options){
        var checkOrderStatus = true;
        var response = [];
	for (var i = 0; i < options.responseData.length; i++) {
		var clone = options.responseData[i];
		response.push({
			statusCode : clone.statusCode || 200,
			id : clone.id,
			errors : clone.errors || [],
			ignored : clone.ignored || false
		});
	}
    logAudit('PostSubmit Response', JSON.stringify(response));
    for (var i = 0; i < response.length; i++) {
		var record = response[i];
		try {
			if (record.statusCode !== 200 || record.ignored) {
				continue;
			}

			var salesOrderId = record.id;
			if (checkOrderStatus) {

				var searchFilter = search.createFilter({
						name: 'internalid',
						operator: search.Operator.IS,
						values: [salesOrderId]
					}); 
				
				var searchColumn = search.createColumn({
						name: 'status'
				});
                
				var salesOrderSearch = search.create({
					type: recordObj.Type.SALES_ORDER,
					filters: searchFilter,
					columns: searchColumn
				});

				var salesOrderSearchResult = salesOrderSearch.load({
					id: 'salesOrderFilterSearch'
				});

				// var salesOrderStatus = nlapiSearchRecord('salesorder', null, 
				// ['internalid', 'is', salesOrderId],new nlobjSearchColumn('status'))[0].getValue('status');
				var salesOrderStatus =  salesOrderSearchResult.getValue({
					fieldId: 'status'
				});
				
				logAudit('salesOrder status value', salesOrderStatus);
				if (salesOrderStatus !== 'pendingFulfillment') {
					continue;
				}
			}
			var bill = null;
			try {
				
				//bill = nlapiTransformRecord('salesorder', salesOrderId, 'invoice');
				bill = record.transform({
                    fromType: record.Type.SALES_ORDER,
                    fromId: salesOrderId,
                    toType: record.Type.INVOICE,
                    isDynamic: false
                });
			} catch (e) {
				 logError('recordTransform Exception' , e.name +  '  ' + e.message);
			}

			if (!bill) {
				//bill = nlapiTransformRecord('salesorder', salesOrderId, 'cashsale');
				bill = record.transform({
                    fromType: record.Type.SALES_ORDER,
                    fromId: salesOrderId,
                    toType: record.Type.CASH_SALE,
                    isDynamic: false
                });
			}

			/* TODO add billing record specific mappings here*/
			var billId = bill.save();
			logAudit('Autobill Complete. Record Id: ', billId);
			
		} catch (e) {
			logError('ERROR', e.name + '   ' + e.message);
			record.statusCode = 422;
			record.errors.push({
				code : e.name,
				message : e.message
				 + '...DO NOT RETRY this error as subsequent retries will not autobill.'
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
        details: message
    });
}
    return {
        autobillSalesOrder: autobillSalesOrder
    }
});