var picturelid = "imageplaceholder";
var recognition_threshold = 0.80;
//blob to hold the currently used image 
var current_image_blob;

var TRAINING_URL = "https://southcentralus.api.cognitive.microsoft.com/customvision/v1.2/Training/projects/734e7d96-ba47-40e1-85bd-b73f3458bdd3";
var PREDICTION_URL = 'https://southcentralus.api.cognitive.microsoft.com/customvision/v1.1/Prediction/734e7d96-ba47-40e1-85bd-b73f3458bdd3/image';

var TRAINING_KEY = "aba0e94484ad4934b6d9310ea468b666";
var PREDICTION_KEY = "cf000a1bde794e00a6ae1b703cb9f568";

var PROJECTID = "734e7d96-ba47-40e1-85bd-b73f3458bdd3";

var REQUEST_TAGS = "tags";
var REQUEST_TRAINIMAGE = "images";
var REQUEST_TRAINPROJECT = "train";
var REQUEST_UPDATEITERATION = "iterations";

function showMessageList(msg) {
    var RecogResult = $("#RecognitionResult");
    RecogResult.append(msg);
    RecogResult.append("\n");
}

function fillProductIdList() {
    var ProductList = $("#ProductList");

    if (ProductList) {
        var xmlData = '<fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="false"><entity name="product"><attribute name="name" />    <attribute name="productid" /><order attribute="name" descending="false" /><filter type="and"><condition attribute="msdyn_fieldserviceproducttype" operator="ne" value="690970002" /> <condition attribute="statecode" operator="eq" value="0" /> <condition attribute="msdyn_fieldserviceproducttype" operator="not-null" /> </filter> </entity> </fetch>';

        ProductList.empty();
        ProductList.append("<option>&lt;&nbsp; Select a product id that corresponds to image taken...&nbsp;&gt;</option>");

        //TESTING
        //ProductList.append("<option>I2CS</option>");
        //ProductList.append("<option>Azure MXChip</option>");
        //ProductList.append("<option>Particle Electron UBlox G350</option>");
        // /TESTING

        MobileCRM.FetchXml.Fetch.executeFromXML(xmlData, function (result) {
                for (var i in result) {
                    var props = result[i];
                    ProductList.append('<option value=' + '"' + props[0] + '">' + props[0] + "</option>");
                }

            },
            function (err) {
                alert('Error fetching products: ' + err);
            },
            null
        );
    }
}

function onAddToDB() {
    //TESTING
    //    MobileCRM.UI.EntityForm.requestObject(
    //        function (entityForm) {

    //algorithm: 
    // 1. get selected product from listbox
    // 2. try to create tag for this product. it will fail if it exists already
    // 3. use GetTags to find id for created tag 
    // 4. add image with this tag

    // 1.
    var selectedProduct = $("#ProductList").val();
    var tagId;

    // 2. create tag

    var URL = TRAINING_URL + "/" + REQUEST_TAGS + "?name=" + selectedProduct;
    var oReq = new XMLHttpRequest();
    oReq.onload = tagAdded;
    oReq.onerror = tagAddError;
    var URL = TRAINING_URL + "/" + REQUEST_TAGS + "?name=" + selectedProduct;
    oReq.open('POST', URL, true);
    oReq.setRequestHeader('Training-Key', TRAINING_KEY);
    oReq.send();

    //TESTING
    //MobileCRM.bridge.alert("OK: sent create tag");

    //3. 
    function tagAddError() {
        MobileCRM.bridge.alert("An error occurred when adding image tag!");
    }

    function tagAdded() {
        var result = JSON.parse(this.responseText);
        //we aren't really interested in result..

        var oReq = new XMLHttpRequest();
        oReq.onload = tagsReceived;
        oReq.onerror = tagsReceiveError;
        var URL = TRAINING_URL + "/" + REQUEST_TAGS;
        oReq.open('GET', URL, true);
        oReq.setRequestHeader('Training-key', TRAINING_KEY);
        oReq.send();

        //TESTING
        //MobileCRM.bridge.alert("OK: sent get tags");

        function tagsReceived() {
            handleListOfTags(JSON.parse(this.responseText));
        }

        function tagsReceiveError() {
            MobileCRM.bridge.alert("An error occurred when retrieving image tags!");
        }

    }


    function handleListOfTags(result) {

        //TESTING
        //MobileCRM.bridge.alert("OK: handleListOfTags");

        var tagId = "";
        if (result.Tags) {
            for (i = 0; i < result.Tags.length; i++) {
                if (result.Tags[i].Name == selectedProduct)
                    tagId = result.Tags[i].Id;
            }

            if (tagId != "") {
                //4. add image with determined tagId to CustomVision.ai
                var URL = TRAINING_URL + "/" + REQUEST_TRAINIMAGE + "?tagids=" + tagId;

                var oReq = new XMLHttpRequest();
                oReq.onload = imageAdded;
                oReq.onerror = imageAddError;
                oReq.open('post', URL, true);
                oReq.setRequestHeader('Training-Key', TRAINING_KEY);
                oReq.setRequestHeader('Content-Type', 'application/octet-stream');
                oReq.send(current_image_blob, 'image/png');

                //TESTING
                //MobileCRM.bridge.alert("OK: add image sent");

            } else
                MobileCRM.bridge.alert("An error occurred when trying to retrieve tags from CustomVision! No matched tag found.");
        } else
            MobileCRM.bridge.alert("An error occurred when trying to retrieve tags from CustomVision.");


    }

    function imageAdded() {
        //TESTING
        //MobileCRM.bridge.alert("OK: image added");
        $("#AddToDB").css('display', 'none');
        $("#ImageAddedStatus").css('display', 'block');

        var oReq = new XMLHttpRequest();
        oReq.onload = trainProject;
        oReq.onerror = trainProjectError;
        var URL = TRAINING_URL + "/" + REQUEST_TRAINPROJECT;
        oReq.open('POST', URL, true);
        oReq.setRequestHeader('Training-key', TRAINING_KEY);
        oReq.send();

    }

    function imageAddError() {
        MobileCRM.bridge.alert("An error occurred when trying to add image to the database!");
    }

    function trainProject() {
        //project training might fail if there aren't enough images / tags for newly created products (5 images min for a new tag )
        //in this case result is similar to below
        /*
        {
            "Code": "BadRequestTrainingValidationFailed",
            "Message": ""
          }
        */

        //successful response looks like this
        /*
        {
            "Id": "538e20b0-d351-42d9-9043-c8526c582b47",
            "Name": "Iteration 18",
            "IsDefault": false,
            "Status": "Training",
            "Created": "2018-01-11T10:38:30.08",
            "LastModified": "2018-01-11T10:50:15.2202742",
            "ProjectId": "734e7d96-ba47-40e1-85bd-b73f3458bdd3",
            "Exportable": false,
            "DomainId": null
        }
        */
        var result = JSON.parse(this.responseText);

        if (result) {
            if (result.Code && result.Code == "BadRequestTrainingValidationFailed") 
            {
                $("#ProjectTrainError").css('display', 'block');
                $("#ProjectTrainOK").css('display', 'none');
            } 
            else
            if (result.Status != "" && result.Id) {

                $("#ProjectTrainError").css('display', 'none');
                $("#ProjectTrainOK").css('display', 'block');
                   
                //a bit problematic is that we cannot call this until the iteration has been trained. on the other hand, 
                //there is no easy way apart from polling to find out when iteration is trained. 
                //quick workaround: wait 12 sec.
                setTimeout(function() {
                    setIterationAsDefault(result);               
                }, 12000);
                
            }
        }
    }

    function trainProjectError() {
        MobileCRM.bridge.alert(this.responseText);        
    }

    function setIterationAsDefault(result)
    {
        //MobileCRM.bridge.alert("project training status: " + result.Status + "; Id:" + result.Id);

        var request = {
            "IsDefault" : true
        };

        //set the iteration as default
        var oReq = new XMLHttpRequest();
        oReq.onload = updateIteration;
        oReq.onerror = updateIterationError;
        var URL = TRAINING_URL + "/" + REQUEST_UPDATEITERATION + "/" + result.Id;
        oReq.open('PATCH', URL, true);
        oReq.setRequestHeader('Training-key', TRAINING_KEY);
        oReq.setRequestHeader('Content-Type', 'application/json');
        oReq.send(JSON.stringify(request));

        //MobileCRM.bridge.alert(URL);
        //MobileCRM.bridge.alert(JSON.stringify(request));

    }

    function updateIteration() {
        //MobileCRM.bridge.alert(this.responseText);
        $("#UpdateIterationOK").css('display', 'block');
    }

    function updateIterationError() {
        MobileCRM.bridge.alert(this.responseText);        
    }

    // TESTING
    //     }
    // );
}


function onTakePhoto() {

    //TESTING
    //handleNoRecognition();
    // /TESTING 

    // hiding sections that don't make sense at this point
    $("#AddToDB").css('display', 'none');
    $("#ImageAddedStatus").css('display', 'none');
    $("#PostRecognitionActions").css('display', 'none');
    $("#ProjectTrainError").css('display', 'none');
    $("#ProjectTrainOK").css('display', 'none');
    $("#UpdateIterationOK").css('display', 'none');

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
                } else
                    MobileCRM.bridge.alert("File '" + imagePath + "' doesnt'exist");
            });
        }, MobileCRM.bridge.alert);
}

function handleNoRecognition() {
    //enable the div frame for sumbitting image to custom vision for learning
    $("#AddToDB").css('display', 'block');
    $("#PostRecognitionActions").css('display', 'none');
    // FILL the product ID list to choose from for tagging 
    fillProductIdList();
}

function handleSuccessfulRecognition(product, probability) {
    //enable the div frame that has selector for further actions based on successful recognition result
    $("#AddToDB").css('display', 'none');
    $("#PostRecognitionActions").css('display', 'block');
    showMessageList("Found with item number " + product + " - Probability " + probability.toFixed(2) * 100 + "%");
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
                var highestValueProduct = "";
                var highestValue = 0;

                for (i = 0; i < result.Predictions.length; i++) {
                    if (parseFloat(result.Predictions[i].Probability) > highestValue) {
                        highestValueProduct = result.Predictions[i].Tag;
                        highestValue = parseFloat(result.Predictions[i].Probability);
                    }
                }

                if (highestValue > recognition_threshold)
                    handleSuccessfulRecognition(highestValueProduct, highestValue);
                else
                    handleNoRecognition();
            }

            function reqError(err) {
                MobileCRM.bridge.alert("An error occurred: " + err);
            }

            var oReq = new XMLHttpRequest();
            oReq.onload = reqListener;
            oReq.onerror = reqError;
            oReq.open('post', PREDICTION_URL, true);
            oReq.setRequestHeader('Prediction-Key', PREDICTION_KEY);
            oReq.setRequestHeader('Content-Type', 'application/octet-stream');

            //store image data for potential submission if not recognized 
            current_image_blob = b64toBlob(data, 'image/png');

            oReq.send(current_image_blob);
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

    var blob = new Blob(byteArrays, {
        type: contentType
    });
    return blob;
}