/**
 * Called from integrator.io after submitting the data to NetSuite
 * @param  {Object} options The data sent to the hook.  See SamplePostSubmitData.json for format
 * @return {Array}         Array containing the data to be returned to integrator.io
 */
var samplePostSubmitHook = function(options){
	
	//The array that will be returned from this hook
	var response = [];
	
	for (var i = 0; i < options.responseData.length; i++) {
		var clone = JSON.parse(JSON.stringify(options.responseData[i]));
		
		/* The response object can be used to update the error message or process submitted 
		 * record data by fetching its id
		*/
		response.push({
			statusCode : clone.statusCode || 200,
			id : clone.id,
			errors : clone.errors || [],
			ignored : clone.ignored || false
		});
	}

	try {
		nlapiLogExecution('AUDIT', 'PostSubmit Options', JSON.stringify(options));
	} catch (e) {
		nlapiLogExecution('ERROR', e.name, e.message);
		for (var i = 0; i < response.length; i++) {
			response[i].statusCode = 422;
			response[i].errors.push({
				code : e.name,
				message : e.message
			});
		}
	}

	nlapiLogExecution('AUDIT', 'PostSubmit Response', JSON.stringify(response));
	return response;

};