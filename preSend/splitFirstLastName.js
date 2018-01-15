/**
	 * @param {Object}
	 *            options
	 * @returns {Object}
	 */
var splitFirstLastName = function(options) {

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
		nlapiLogExecution('AUDIT', 'PreSend Response', JSON.stringify(response));
		var records = response.data;
		for(var i=0; i<records.length; i++){
			try{
				if(Array.isArray(records[i])){
					for(var j=0; j<records[i].length; j++){
						records[i][j] = splitName(records[i][j]);
					}
				}else{
					records[i] = splitName(records[i]);
				}	
			}catch(e){
				nlapiLogExecution('ERROR', e.name, e.message);
				response.data[i] = [];
				response.errors[i] = {
					code : e.name,
					message : e.message
				};
			}
		}
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
 * Split the addressee field value into 2 parts.  It will always assume the first space is used to break 
 * up the first and last name.
 * @param  {Object} record  Individual line from the saved search
 * @return {Object} The updated record
 */
var splitName = function(record){
	nlapiLogExecution('AUDIT', 'splitName', JSON.stringify(record));
	if(!record['Billing Addressee']){
		record['BillFirst'] = '';
		record['BillLast'] = '';
	}else{
		var billNameParts = record['Billing Addressee'].split(' ');
		record['BillFirst'] = billNameParts[0];
		if(billNameParts.length < 2){
			record['BillLast'] = '';
		}
		else{
			billNameParts.splice(0,1); //remove the first name from the array
			record['BillLast'] = billNameParts.join(' ');
		}
	}

	if(!record['Shipping Addressee']){
		record['ShipFirst'] = '';
		record['ShipLast'] = '';
	}else{
		var shipNameParts = record['Shipping Addressee'].split(' ');
		record['ShipFirst'] = shipNameParts[0];
		if(shipNameParts.length < 2){
			record['ShipLast'] = '';
		}
		else{
			shipNameParts.splice(0,1); //remove the first name from the array
			record['ShipLast'] = shipNameParts.join(' ');
		}
	}
	return record;
};