/**
 * Called from integrator.io prior to saving the data
 * @param  {Object} options The data sent to the hook.  See SamplePostMapData.json for format
 * @return {Array}         Array containing the data to be submitted to NetSuite
 */
var setLineId = function(options){
	
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
		var typeMatch = {
			returnauthorization: 'salesorder',
			itemreceipt: 'returnauthorization'
		};
		for (var i = 0; i < response.length; i++) {
			var recType = typeMatch[response[i].data.nlobjRecordType];
			var recordId = response[i].data.nlobjFieldIds.celigo_nlobjTransformId;
			
			var lines = [];
			var missingLine = false;
			for(var j=0; j<response[i].data.nlobjSublistIds.item.lines.length; j++){
				if(response[i].data.nlobjSublistIds.item.lines[j].line){
					lines[response[i].data.nlobjSublistIds.item.lines[j].line] = true;
				}else{
					missingLine = true;
				}
			}
			if(!missingLine)
				continue;
			var compRec = nlapiTransformRecord(recType, recordId, response[i].data.nlobjRecordType);
			var missingLine = false;
			for(var j=0; j<response[i].data.nlobjSublistIds.item.lines.length; j++){
				if(response[i].data.nlobjSublistIds.item.lines[j].line){
					continue;
				}
				for(var l=1; l <= compRec.getLineItemCount('item'); l++){
					if(lines[compRec.getLineItemValue('item', 'line', l)])
						continue;
					if(compRec.getLineItemValue('item', 'item', l) != response[i].data.nlobjSublistIds.item.lines[j].item && compRec.getLineItemValue('item', 'item', l) != response[i].data.nlobjSublistIds.item.lines[j].itemkey)
						continue;
					response[i].data.nlobjSublistIds.item.lines[j].line = compRec.getLineItemValue('item', 'line', l);
					lines[response[i].data.nlobjSublistIds.item.lines[j].line] = true;
					break;
				}
			}
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

	//Send the data to the submit step
	return response;

};

/**
 * Log the data passed into the hook into the SuiteScript logs of the RESTlet
 * @param  {Object} options  Data passed into the PostMap hook
 * @param  {Array} response The object that is passed on to the submit step
 * @return null
 */
var logOptions = function(options, response){
	nlapiLogExecution('AUDIT', 'PostMap Options', JSON.stringify(options));
};