/**
 * Called from integrator.io prior to saving the data
 * @param  {Object} options The data sent to the hook.  See SamplePostMapData.json for format
 * @return {Array}         Array containing the data to be submitted to NetSuite
 */
var setShipGroup = function(options){
	
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

	for (var i = 0; i < response.length; i++) {
		try{
			nlapiLogExecution('DEBUG', 'record: ' + i, JSON.stringify(response[i].data));
			var order = nlapiLoadRecord('salesorder', response[i].data.nlobjFieldIds['celigo_nlobjTransformId']);
			var shipGroup = order.getLineItemValue('item', 'shipgroup', response[i].data.nlobjSublistIds.item.lines[0]["line"]) || 1;
			response[i].data.nlobjFieldIds.initializeValues = {
				"shipgroup":shipGroup
			};
			/*for(var j=0; j<response[i].data.nlobjSublistIds.item.lines; j++){
				var found = false;
				for(var line=1; line<= order.getLineItemCount('item'); line++){

				}
			}*/
			nlapiLogExecution('DEBUG', 'after', JSON.stringify(response[i].data));
		}catch (e){
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

/**
 * Log the data passed into the hook into the SuiteScript logs of the RESTlet
 * @param  {Object} options  Data passed into the PostMap hook
 * @param  {Array} response The object that is passed on to the submit step
 * @return null
 */
var getOrder = function(data){
	return null;
};