/**
 * This method will import the serial numbers into NetSuite under Inventory Details line for Serialized items. Can be used for Item 
 * Fulfillment import and/or Inventory Adjustment Import
 * Map a NetSuite item[*].inventorydetail with 3PL serial number field from integrator.io mapping assuming
 * that the Serial numbers are coming in an array from 3PL. e.g ["GVR4H00283000","GVR4H00283435","GVR4H00283500"]
 * @param  {Object} options The data sent to the hook.  See SamplePostMapData.json for format
 * @return {Array}         Array containing the data to be submitted to NetSuite
 */
var itemSerialNumbersImport = function(options){
	
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
		// For each order process the Serial Number for each item
		for (var i = 0; i < response.length; i++) {
			var configObject = response[i].data;
			var errors = response[i].errors;
			var itemLinesObject = configObject.nlobjSublistIds.item || {};
			var itemLines = itemLinesObject.lines || [];
			//For each item add inventoryDetailLines from itemLines[*].inventorydetail
			for (var j = 0; j < itemLines.length; ++j) {
				//item[*].custcol_celigo_is_serialize_item : This needs to be mapped in IO as a dynamic SKU lookup to 
				//find if that item is Serialized item.
				var isSerializedItem = itemLines[j].custcol_celigo_is_serialize_item;
				
				if (isSerializedItem === 'T') {
					var serialNumbers = itemLines[j].inventorydetail || [];
					//If the item is Serial Item in NetSuite but no serial number is coming from 3PL then throw error
					if(!serialNumbers.length){
						errors.push({
							code : 'NO_SERIAL_NUMBER',
							message : 'No Serial Numbers are found to import for the item.'
						})
					}
					
					var inventoryDetailLines = [];
					for (var k = 0; k < serialNumbers.length; k++) {
						inventoryDetailLines.push({
							"quantity" : 1,
							"issueinventorynumber" : serialNumbers[k]
						});
					}
					itemLines[j].celigo_inventorydetail = {
							"nlobjRecordType" : "inventorydetail",
							"nlobjFieldIds" : {
								"celigo_recordmode_dynamic" : true
							},
							"nlobjSublistIds" : {
								"inventoryassignment" : {
									"lines" : inventoryDetailLines
								}
							}
					};
				}
				//Delete it because they are no longer needed.
				delete itemLines[j].inventorydetail;
				delete itemLines[j].custcol_celigo_is_serialize_item;
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

