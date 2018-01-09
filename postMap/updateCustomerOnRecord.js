/**
 * This method will set a custom checkbox on the customer record when an order is being imported under it.
 * @param  {Object} options The data sent to the hook.  See SamplePostMapData.json for format
 * @return {Array}         Array containing the data to be submitted to NetSuite
 */
var updateCustomerOnRecord = function(options){
	var checkboxField = 'custentity_has_imported_order';
	var customerField = 'custrecord1411';
	var response = [];

	nlapiLogExecution('AUDIT', 'PostMap Options', JSON.stringify(options));
	for (var i = 0; i < options.postMapData.length; i++) {
		response.push({
			data : JSON.parse(JSON.stringify(options.postMapData[i])),
			errors : []
		});
	}

	try {
		nlapiLogExecution('AUDIT', 'PostMap Response', JSON.stringify(response));
		// For each order update the customer
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
				nlapiSubmitField('customer', record.nlobjFieldIds[customerField], checkboxField, 'T');
			}catch (e){
				nlapiLogExecution('ERROR', e.name, e.message);
				response[i].data = null;
				response[i].errors.push({
					code : e.name,
					message : e.message
				});				
			}
		}
	} catch (e) {
		nlapiLogExecution('ERROR', e.name, e.message);
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

};

