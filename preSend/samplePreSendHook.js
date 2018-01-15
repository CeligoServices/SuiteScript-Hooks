/**
	 * @param {Object}
	 *            options
	 * @returns {Object}
	 */
var samplePreSendHook = function(options) {

	var context = nlapiGetContext();
	var executionContext = context.getExecutionContext();
	var data = null;
	
	if (executionContext === 'scheduled') {
		data = [ options.data ];
	} else {
		data = options.data;
	}

	var response = {
		data : data,
		errors : []
	};

	try{
		logOptions(options, response);
	} catch (e) {
		nlapiLogExecution('ERROR', e.name, e.message);
		response.data = [];
		response.errors.push({
			code : e.name,
			message : e.message
		});
	}

	return response;

};

/**
 * Log the data passed into the hook into the SuiteScript logs of the RESTlet
 * @param  {Object} options  Data passed into the PreSend hook
 * @param  {Array} response The object that is passed on to the mappings
 * @return null
 */
var logOptions = function(options, response){
	nlapiLogExecution('AUDIT', 'PreSend Options', JSON.stringify(options));
	nlapiLogExecution('AUDIT', 'PreSend Response', JSON.stringify(response));
};