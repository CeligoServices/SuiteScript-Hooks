/**
 * This method will fully auto-bill the submitted sales order into cashsale/invoice
 * @param  {Object} options The data sent to the hook.
 * @return {Array}  Array containing the data to be returned to integrator.io
 */
var autobillSalesOrder = function (options) {

	// to bill only if order is in particular status. Can be passed as a Configuration parameter also
	var checkOrderStatus = true;

	var response = [];
	for (var i = 0; i < options.responseData.length; i++) {
		var clone = JSON.parse(JSON.stringify(options.responseData[i]));
		response.push({
			statusCode : clone.statusCode || 200,
			id : clone.id,
			errors : clone.errors || [],
			ignored : clone.ignored || false
		});
	}

	nlapiLogExecution('AUDIT', 'PostSubmit Response', JSON.stringify(response));
	for (var i = 0; i < response.length; i++) {
		var record = response[i];
		try {
			if (record.statusCode !== 200 || record.ignored) {
				continue;
			}

			var salesOrderId = record.id;
			if (checkOrderStatus) {
				var salesOrderStatus = nlapiSearchRecord('salesorder', null, ['internalid', 'is', salesOrderId], new nlobjSearchColumn('status'))[0].getValue('status');
				if (salesOrderStatus !== 'pendingFulfillment') {
					continue;
				}
			}

			var bill = null;
			try {
				bill = nlapiTransformRecord('salesorder', salesOrderId, 'invoice');
			} catch (e) {
				nlapiLogExecution('AUDIT', e.name, e.message);
			}
			if (!bill) {
				bill = nlapiTransformRecord('salesorder', salesOrderId, 'cashsale');
			}

			/* TODO add billing record specific mappings here*/
			var billId = nlapiSubmitRecord(bill);
			nlapiLogExecution('AUDIT', 'Autobill Complete. Record Id: ', billId);
			
		} catch (e) {
			/*if we retry, the sales order was already created. Therefore
			there will be no sales order id. So we wont be able to transform the
			sales order.*/
			nlapiLogExecution('ERROR', e.name, e.message);
			record.statusCode = 422;
			record.errors.push({
				code : e.name,
				message : e.message
				 + '...DO NOT RETRY this error as subsequent retries will not autobill.'
			});
		}
	}

	return response;

};