/**
 *@NApiVersion 2.x
 */
define(['N/record'], function(record) {
    function customerCheckboxChecker(options){
        var checkboxFieldId = 'custentity_exported_to_3pl';
        var response = {};
            response.data = [];
            response.errors = [];
            logAudit('PreSend InputData', JSON.stringify(options));
            for (var i = 0; i < options.data.length; i++) {
                response.data.push(options.data[i]);
            }
            logAudit('PreSend Response', JSON.stringify(response));
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
			record.submitFields({
                type: record.Type.CUSTOMER,
                id: recordId,
                values: checkboxFieldId,
                options: {
                    enablesourcing: true
                }
            });
		} catch (e) {
			logError('ERROR', 'errorName: ' + e.name + ' & errorMessage: ' + e.message);
			response.data[i] = null;
			response.errors.push({
				code : e.name,
				message : e.message
			});
		}
        return response;
	}
}
    function logError(title, errorMessage){
        log.error({
            title: title,
            details: errorMessage
        });
    }
    function logAudit(title, details){
        log.audit({
            title: title,
            details: details
        });
    }
    return {
        customerCheckboxChecker: customerCheckboxChecker
    }
});