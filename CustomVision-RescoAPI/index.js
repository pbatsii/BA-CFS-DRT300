var picturelid = "imageplaceholder";
var recognition_threshold = 0.80;

function showMessageList(msg) {
    document.getElementById("resultList").innerHTML = "";
    var node = document.createElement("LI");
    var textnode = document.createTextNode(msg);
    node.appendChild(textnode);
    document.getElementById("resultList").appendChild(node);
}

function onTakePhoto() {
    var service = new MobileCRM.Services.DocumentService();
    service.maxImageSize = "1024x768"; // maxImageSize can have one of following values: "Default", "640x480", "1024x768", "1600x1200", "2048x1536", "2592x1936"

    service.capturePhoto(
        function (fileInfo) {
            if (fileInfo.url)
                var imgElement = document.getElementById(picturelid);

				MobileCRM.Application.fileExists(fileInfo.filePath, function (exists) {
                if (exists) {
                    MobileCRM.Application.readFileAsBase64(fileInfo.filePath, function (data) {
                        var imgElement = document.getElementById(picturelid);
                        if (imgElement)
                            imgElement.src = fileInfo.filePath;
                        sendToCustomVision(data);

                    }, MobileCRM.bridge.alert);
                }
                else
                    MobileCRM.bridge.alert("File '" + imagePath + "' doesnt'exist");
            });
        }, MobileCRM.bridge.alert);
}

function sendToCustomVision(data) {
    MobileCRM.UI.EntityForm.requestObject(
       function (entityForm) {
           var entity = entityForm.entity;
           var entityProperties = entity.properties;
           var form = entityForm.form;
           form.caption = entity.primaryName;

           function reqListener() {
               var result = JSON.parse(this.responseText);
               var highestValue = 0;
               var highestValueProduct = "";
               var highestValueBefore = 0;

               for (i = 0; i < result.Predictions.length; i++) {
                   if (parseFloat(result.Predictions[i].Probability) > highestValueBefore) {
                       highestValueProduct = result.Predictions[i].Tag;
                       highestValueBefore = parseFloat(result.Predictions[i].Probability);
                   }
               }

               if (highestValueBefore > recognition_threshold) {    
                       showMessageList("Found with item number " + highestValueProduct + " - Probability " + highestValueBefore.toFixed(2) * 100 + "%");
               }
               else {
                   showMessageList("No product with sufficient likelihood found!");
               }

           }

           function reqError(err) {
               MobileCRM.bridge.alert("An error occurred: " + err);
           }

           
           
           /* the below is the standard way of creating a HTTP POST request, however it doesn't work under Resco when run under Windows 10. 
		   It has to do with increased security model in the Windows 10 Creators Update.
		   The workaround provided from Resco for this is to use the wrapper in JSBridge.js.
		   */
		   
		   /*
		   var oReq = new XMLHttpRequest();
           oReq.onload = reqListener;
           oReq.onerror = reqError;
           oReq.open('post', 'https://southcentralus.api.cognitive.microsoft.com/customvision/v1.1/Prediction/734e7d96-ba47-40e1-85bd-b73f3458bdd3/image?iterationId=ec61b45c-d5ad-4e5f-a103-d4dbbe99d92e', true);
           oReq.setRequestHeader('Prediction-Key', 'cf000a1bde794e00a6ae1b703cb9f568');
           oReq.setRequestHeader('Content-Type', 'application/octet-stream');
           oReq.send(b64toBlob(data, 'image/png'));
           */
	   
            var headers = {
                "Prediction-Key": "cf000a1bde794e00a6ae1b703cb9f568",
			}

            var request = new MobileCRM.Services.HttpWebRequest();
            request.headers = headers;
            request.method = "POST";
            request.contentType = 'application/octet-stream';
            
            request.setBody(b64toBlob(data, 'image/png'), "UTF-8");

            request.send("https://southcentralus.api.cognitive.microsoft.com/customvision/v1.1/Prediction/734e7d96-ba47-40e1-85bd-b73f3458bdd3/image?iterationId=ec61b45c-d5ad-4e5f-a103-d4dbbe99d92e", function (response) {
                MobileCRM.bridge.alert(JSON.stringify(response));
            }, null);


		   
		   
       },
       function (err) {
           MobileCRM.bridge.alert("An error occurred: " + err);
       },
       null
   );
}

function b64toBlob(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);

        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        var byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, { type: contentType });
    return blob;
}
