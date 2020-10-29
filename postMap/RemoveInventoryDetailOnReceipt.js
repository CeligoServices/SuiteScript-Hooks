/**
 * Called from integrator.io prior to saving the data
 * @param  {Object} options The data sent to the hook.  See SamplePostMapData.json for format
 * @return {Array}         Array containing the data to be submitted to NetSuite
 */
var removeInventoryDetails = function(options){
	
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
		var itemIds = [];
		var areInvD = [];

		//Get list of all item internal ids
		for(var i=0; i<response.length; i++){
			if(!response[i].data || !response[i].data.nlobjSublistIds || !response[i].data.nlobjSublistIds.item || || !response[i].data.nlobjSublistIds.item.lines)
				continue;

			for(var j=0; i< response[i].data.nlobjSublistIds.item.lines.length; j++){
				if(!response[i].data.nlobjSublistIds.item.lines[j].itemkey)
					continue;


				if(itemIds.indexOf(response[i].data.nlobjSublistIds.item.lines[j].itemkey) == -1)
					itemIds.push(response[i].data.nlobjSublistIds.item.lines[j].itemkey);
			}
		}

		//Search NetSuite to see if items are lot or serialized items and put into the areInvD list
		if(itemIds && itemIds.length > 0){
			var filters = [];
			filters.push(new nlobjSearchFilter('internalid', null, 'anyof', itemIds));
			var columns = [];
			columns.push(new nlobjSearchColumn('islotitem'));
			columns.push(new nlobjSearchColumn('isserialitem'));
			var results = nlapiSearchRecord('item', null, filters, columns);
			for(var j=0; j<results.length; j++){
				if(results[j].getValue('islotitem') == 'T' || results[j].getValue('isserialitem') == 'T'){
					areInvD[results[j].getId()] = true;
				}
				else{
					areInvD[results[j].getId()] = false;
				}
			}
		}

		//remove inventory detail section if the items aren't lot or serialized items
		for(var i=0; i<response.length; i++){
			if(!response[i].data || !response[i].data.nlobjSublistIds || !response[i].data.nlobjSublistIds.item || || !response[i].data.nlobjSublistIds.item.lines)
				continue;

			for(var j=0; i< response[i].data.nlobjSublistIds.item.lines.length; j++){
				if(!response[i].data.nlobjSublistIds.item.lines[j].itemkey || !response[i].data.nlobjSublistIds.item.lines[j].celigo_inventorydetail)
					continue;


				if(areInvD[response[i].data.nlobjSublistIds.item.lines[j].itemkey])
					continue;
				else
					delete response[i].data.nlobjSublistIds.item.lines[j].celigo_inventorydetail;
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