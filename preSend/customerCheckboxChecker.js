/**
 * This method will set a custom checkbox on the customer record when its successfully picked up 
 * by the integrator.io export. Can be used for delta export flow
 * @param {Object}
 *            options The data sent to the hook. See SamplePreSendDataBatch.json for format
 * @return {Object} response containing the data sent to integrator.io
 */
var customerCheckboxChecker = function (options) {

	var checkboxFieldId = 'custentity_exported_to_3pl';
	var response = {};
	response.data = [];
	response.errors = [];

	nlapiLogExecution('AUDIT', 'PreSend Options', JSON.stringify(options));
	for (var i = 0; i < options.data.length; i++) {
		response.data.push(JSON.parse(JSON.stringify(options.data[i])));
	}

	nlapiLogExecution('AUDIT', 'PreSend Response', JSON.stringify(response));
	// Update the checkbox for each customer
	for (var i = 0; i < response.data.length; i++) {
		var records = response.data[i];
		var recordId = records[0].id;

		if (!recordId) {
			response.data[i] = null;
			response.errors.push({
				code : 'INVALID_ID',
				message : 'The data does not contain customer id. Please confirm the configuration.'
			});
			continue;
		}
		try {
			nlapiSubmitField('customer', recordId, checkboxFieldId, 'T');
		} catch (e) {
			nlapiLogExecution('ERROR', e.name, e.message);
			response.data[i] = null;
			response.errors.push({
				code : e.name,
				message : e.message
			});

		}
	}

	// Send the data to integrator.io for further processing
	return response;
};
