/**
 *@NApiVersion 2.x
 */
 define(['N/record'], function(recordObj) {
    var response = [];
    function attachIssueToCase(options){
        for (var i = 0; i < options.postMapData.length; i++) {
            response.push({
                data : options.postMapData[i],
                errors : []
            });
        }
        try {
            logAudit('InputData', JSON.stringify(options));
            logAudit('responseData', JSON.stringify(response));
            for (var i = 0; i < response.length; ++i) {
                var reponseData = response[i].data;
                var issueID = reponseData.nlobjFieldIds.cust_issue_internal_id;
                var caseID = reponseData.nlobjFieldIds.internalid;
                //nlapiAttachRecord('supportcase', caseID, 'issue', issueID, null);
              var attachmentId =   recordObj.attach({
                    record: {
                        type: 'SUPPORT_CASE',
                        id: caseID
                    },
                    to: {
                        type: 'ISSUE',
                        id: issueID
                    }
                });
                logAudit('attachmentId', attachmentId);
            }
        } catch (e) {
            logError('ERROR', e.name + '  ' + e.message);
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
        attachIssueToCase: attachIssueToCase
    }

 });