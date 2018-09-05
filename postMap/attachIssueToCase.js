/**
 * This method will attach Issues to Case in NS
 * @param  {Object} options The data sent to the hook.
 * @return {Array}  Array containing the data to be submitted to NetSuite
 */

var attachIssueToCase = function(options) {

	//The array that will be returned from this hook to be processed by the mappings
	var response = [];

	for (var i = 0; i < options.postMapData.length; i++) {
		/* The response object contains of a data array and an error array
		The data array is the elements that will be passed on to be submitted to NetSuite
		The errors array will show up as failed records on the integrator.io dashboard.  
		Each element in the array may consist of one or more errors
		 */
		response.push({
			data : JSON.parse(JSON.stringify(options.postMapData[i])),
			errors : []
		});
	}

	try {
		logOptions(options, response);
		for (var i = 0; i < response.length; ++i) {
			var reponseData = response[i].data;
			var issueID = reponseData.nlobjFieldIds.cust_issue_internal_id;
			var caseID = reponseData.nlobjFieldIds.internalid;
			nlapiAttachRecord('supportcase', caseID, 'issue', issueID, null);
		}
	} catch (e) {
		/*In the case of a high level failure all records should be marked as failed
		If there is a single record failure the individual error should be logged in the function called
		within the try-catch block
		 */
		nlapiLogExecution('ERROR', e.name, e.message);
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

/**
 * Log the data passed into the hook into the SuiteScript logs of the RESTlet
 * @param  {Object} options  Data passed into the PostMap hook
 * @param  {Array} response The object that is passed on to the submit step
 * @return null
 */

var logOptions = function(options, response) {
	nlapiLogExecution('AUDIT', 'PostMap Options', JSON.stringify(response));
};