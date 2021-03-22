/**
 *@NApiVersion 2.x
 */
 define([], function() {

    function setTransformInitValue(options){
        var response = [];
	var locationField = 'location'; //Header level field that is mapped to pull the location from
	var locationDefault = null;  //internal id of the inventory location that should be used in the transformation
	var shipgroupField = null;  //Header level field that is mapped to pull the ship group from
	var shipgroupDefault = null;
    for (var i = 0; i < options.postMapData.length; i++) {
		
		if(!options.postMapData[i].initializeValues)
			options.postMapData[i].initializeValues = {};
		if(!options.postMapData[i].initializeValues.shipgroup && shipgroupField && options.postMapData[i].nlobjFieldIds[shipgroupField])
			options.postMapData[i].initializeValues.shipgroup = options.postMapData[i].nlobjFieldIds[shipgroupField];

		if(!options.postMapData[i].initializeValues.shipgroup && shipgroupDefault)
			options.postMapData[i].initializeValues.shipgroup = shipgroupDefault;

		if(!options.postMapData[i].initializeValues.inventorylocation && locationField && options.postMapData[i].nlobjFieldIds[locationField])
			options.postMapData[i].initializeValues.inventorylocation = options.postMapData[i].nlobjFieldIds[locationField];

		if(!options.postMapData[i].initializeValues.inventorylocation && locationDefault)
			options.postMapData[i].initializeValues.inventorylocation = locationDefault;

		response.push({
			data : JSON.parse(JSON.stringify(options.postMapData[i])),
			errors : []
		});
	}

	try {
		logAudit('logInputData' , JSON.stringify(options));
        logAudit('logResponseData', JSON.stringify(response));

	} catch (e) {
		logError('ERROR', e.name+ '  ' + e.message);
		for (var i = 0; i < response.length; i++) {
			response[i].data = null;
			response[i].errors.push({
				code : e.name,
				message : e.message
			});
		}
	}
	    return response;
    }

    function logError(title, message){
        log.error({
            title: title,
            details: message
        });
    }
    function logAudit(title, message){
        log.audit({
            title: title,
            details: message
        });
    }
	return {
		setTransformInitValue: setTransformInitValue
	}

 });