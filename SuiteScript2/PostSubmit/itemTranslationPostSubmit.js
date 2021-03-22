/**
 *@NApiVersion 2.x
 */
 define(['N/record'], function(recordObj) {
    function translationPostSubmitHook(options){
        var response = [];
        for (var i = 0; i < options.responseData.length; i++) {
            var clone = options.responseData[i];
            response.push({
                statusCode : clone.statusCode || 200,
                id : clone.id,
                errors : clone.errors || [],
                ignored : clone.ignored || false
            });
        }
            logAudit('PostSubmit Options',JSON.stringify(options));
        try {
            logAudit('PostSubmit Options', JSON.stringify(options));
            for(var j=0; j<response.length; j++){
              setTranslations(response[j].id, options.postMapData[j]);
            }
          } catch (e) {
            logError('ERROR', e.name + '  ' + e.message);
            for (var i = 0; i < response.length; i++) {
              response[i].statusCode = 422;
              response[i].errors.push({
                code : e.name,
                message : e.message
              });
            }
          }
          logAudit('PostSubmit Response', JSON.stringify(response));
          return response;
    }
function setTranslations(id, postMap){

    logAudit('postMap in setTranslations', JSON.stringify(postMap));

    //var item = nlapiLoadRecord(postMap.nlobjRecordType, id);

    var item = recordObj.load({
        type: postMap.nlobjRecordType,
        id: id
    });

    for(var i=0; i<postMap.nlobjSublistIds.celigo_translations.lines.length; i++){
      var lang = postMap.nlobjSublistIds.celigo_translations.lines[i].language;
      var  trans = postMap.nlobjSublistIds.celigo_translations.lines[i];
      for(var l =1; l<= item.getLineCount({sublistId: 'translations'}); l++){
        if(lang != item.getSublistValue({ sublistId: 'translations', fieldId: 'language', line: l})){
          logAudit('Not the same language: ' + lang, item.getSublistValue({ sublistId: 'translations', fieldId: 'language', line: l}));
          continue;
        }
  
        for(var f in trans){
          item.setSublistValue({sublistId: 'translations', fieldId: f, line: l, value: trans[f]});
          logDebug('Setting: ' + f, trans[f]);
        }
        break;
      }
    }
    //nlapiSubmitRecord(item);
    item.save();
  }
    function logError(title, message){
        log.error({
            title: title,
            details: message
        });
    }
    function logDebug(title, message){
        log.debug({
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
        translationPostSubmitHook: translationPostSubmitHook
    }

 });