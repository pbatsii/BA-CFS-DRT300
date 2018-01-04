(function () {
    // The width and height of the captured photo. We will set the
    // width to the value defined here, but the height will be
    // calculated based on the aspect ratio of the input stream.

    var width = 320; // We will scale the photo width to this
    var height = 0; // This will be computed based on the input stream

    // |streaming| indicates whether or not we're currently streaming
    // video from the camera. Obviously, we start at false.

    var streaming = false;

    // The various HTML elements we need to configure or control. These
    // will be set by the startup() function.

    var video = null;
    var canvas = null;
    var photo = null;
    var startbutton = null;

    var API_KEY = 'cc86b8a319914893b2c1c6d9d4a190ca';


    //var request = require('request').defaults({ encoding: null });

    var VISION_URL = 'https://westeurope.api.cognitive.microsoft.com/vision/v1.0/analyze/?visualFeatures=Description&form=BCSIMG';
    var OCR_URL = 'https://westeurope.api.cognitive.microsoft.com/vision/v1.0/ocr?language=unk&detectOrientation=true';
    var CUSTOMVISION_URL = 'https://southcentralus.api.cognitive.microsoft.com/customvision/v1.0/Prediction/fa016d10-8710-4f63-9646-f3d6ca613678/image';

    var CUSTOMVISION_KEY = '41b59fbdab6748ecb5b426364b1fd205';


    function startup() {

        navigator.browserSpecs = (function () {
            var ua = navigator.userAgent,
                tem,
                M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
            if (/trident/i.test(M[1])) {
                tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
                return {
                    name: 'IE',
                    version: (tem[1] || '')
                };
            }
            if (M[1] === 'Chrome') {
                tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
                if (tem != null) return {
                    name: tem[1].replace('OPR', 'Opera'),
                    version: tem[2]
                };
            }
            M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
            if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
            return {
                name: M[0],
                version: M[1]
            };
        })();





        video = document.getElementById('video');
        canvas = document.getElementById('canvas');
        photo = document.getElementById('photo');
        startbutton = document.getElementById('startbutton');
        output = document.getElementById('result');

        output.value = navigator.browserSpecs.name + ":" + navigator.browserSpecs.version;

        navigator.getMedia = (
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia ||
            navigator.getUserMedia
        );

        navigator.getMedia({
                video: true,
                audio: false
            },
            function (stream) {
                if (navigator.mozGetUserMedia) {
                    video.mozSrcObject = stream;
                } else {
                    //var vendorURL = window.webkitURL || window.URL ;
                    //video.src = vendorURL.createObjectURL(stream);
                    video.srcObject = stream;
                }
                video.play();
            },
            function (err) {
                console.log("An error occured! " + err);
            }
        );

        video.addEventListener('canplay', function (ev) {
            if (!streaming) {
                height = video.videoHeight / (video.videoWidth / width);

                // Firefox currently has a bug where the height can't be read from
                // the video, so we will make assumptions if this happens.

                if (isNaN(height)) {
                    height = width / (4 / 3);
                }

                video.setAttribute('width', width);
                video.setAttribute('height', height);
                canvas.setAttribute('width', width);
                canvas.setAttribute('height', height);
                streaming = true;
            }
        }, false);

        startbutton.addEventListener('click', function (ev) {
            takepicture();
            ev.preventDefault();
        }, false);

        clearphoto();
    }

    // Fill the photo with an indication that none has been
    // captured.

    function clearphoto() {
        var context = canvas.getContext('2d');
        context.fillStyle = "#AAA";
        context.fillRect(0, 0, canvas.width, canvas.height);

        var data = canvas.toDataURL('image/png');
        //photo.setAttribute('src', data);
    }

    // Capture a photo by fetching the current contents of the video
    // and drawing it into a canvas, then converting that to a PNG
    // format data URL. By drawing it on an offscreen canvas and then
    // drawing that to the screen, we can change its size and/or apply
    // other changes before drawing it.

    function takepicture() {
        var context = canvas.getContext('2d');
        output.value = 'starting image analysis';
        if (width && height) {
            canvas.width = width;
            canvas.height = height;
            context.drawImage(video, 0, 0, width, height);

            var data = canvas.toDataURL('image/png');

            var url = CUSTOMVISION_URL;

            var params = '';


            var image_data = atob(data.split(',')[1]);
            // Use typed arrays to convert the binary data to a Blob
            var arraybuffer = new ArrayBuffer(image_data.length);
            var view = new Uint8Array(arraybuffer);
            for (var i = 0; i < image_data.length; i++) {
                view[i] = image_data.charCodeAt(i) & 0xff;
            }
            try {
                // This is the recommended method:
                var blob = new Blob([arraybuffer], {
                    type: 'application/octet-stream'
                });
            } catch (e) {
                // The BlobBuilder API has been deprecated in favour of Blob, but older
                // browsers don't know about the Blob constructor
                // IE10 also supports BlobBuilder, but since the `Blob` constructor
                //  also works, there's no need to add `MSBlobBuilder`.
                var bb = new(window.WebKitBlobBuilder || window.MozBlobBuilder);
                bb.append(arraybuffer);
                var blob = bb.getBlob('application/octet-stream'); // <-- Here's the Blob
            }
            output.value = output.value + ' image size:' + image_data.length;


            fetch(url, {
                    headers: {
                        'Prediction-Key': CUSTOMVISION_KEY,
                        'Content-Type': 'application/octet-stream'
                    },
                    method: "POST",
                    body: blob
                })
                .then(
                    function (response) {
                        output.value = output.value + ' image analysis html event:' + response.statusText + '\n';
                        output.value = output.value + ' http.status:' + response.status + '\n';
                        output.value = output.value + ' http.readyState' + response.status + '\n';

                        if (response.status !== 200) {
                            console.log('Looks like there was a problem. Status Code: ' +
                                response.status);
                            return;
                        }

                        // Examine the text in the response  
                        response.json().then(function (data) {
                            handleSuccessResponse(data);
                        });
                    }
                )
        }
    }

    function handleSuccessResponse(caption) {

        output.value = output.value + 'processing image analysis ..' + '\n';
        if (caption) {
            //var captionoutput = extractCaption(JSON.parse(caption));
            var captionoutput = extractCaption(caption);
            if (captionoutput) {
                output.value = output.value + "<----------------->\n";
                output.value = output.value + captionoutput + '\n';
                output.value = output.value + "<----------------->\n";
            } else {
                output.value = output.value + 'nothing found';
            }
        } else {
            output.setAttribute('text', 'nothing found');
        }
    }

    function handleSuccessResponseOCR(caption) {
        output.value = output.value + 'processing OCR analysis ..';
        if (caption) {
            //var captionoutput = extractOCR(JSON.parse(caption));
            var captionoutput = extractOCRJson(caption);
            if (captionoutput) {
                ocr.value = captionoutput;
            } else {
                ocr.value = 'nothing found';
            }
        } else {
            ocr.setAttribute('text', 'nothing found');
        }
    }

    function extractCaption(body) {
        var result = "";
        
        if (body.Predictions[1] && body.Predictions[1].Probability > 0.5)
            result = body.Predictions[1].Tag + " "  + (body.Predictions[1].Probability)*100 + "%";
        if (body.Predictions[0] && body.Predictions[0].Probability > 0.5)
            result = result + " ; " + body.Predictions[0].Tag +  " "  + (body.Predictions[0].Probability)*100 + "%";;

        return result;
    }

    var HttpClient = function () {
        this.get = function (aUrl, aCallback) {
            var anHttpRequest = new XMLHttpRequest();
            anHttpRequest.onreadystatechange = function () {
                if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
                    aCallback(anHttpRequest.responseText);
            }

            anHttpRequest.open("POST", aUrl, true);
            anHttpRequest.send(null);
        }
    }


    function handleErrorResponse(error) {
        output.setAttribute('text', 'error');
        console.error(error);
    }



    function traverseOCR(obj) {
        var ids = [];
        for (var prop in obj) {
            if (typeof obj[prop] == "object" && obj[prop]) {
                if (prop == 'text') {
                    ids = obj[prop].map(function (elem) {
                        return elem.id;
                    })
                }
                ids = ids.concat(traverseOCR(obj[prop]));
            }
        }
        return ids;
    }


    function extractOCRJson(body) {
        var ids = [];

        var data = JSON.parse(body, function (key, value) {
            if (key === 'text')
                ids.push(value);

            return value;
        });


        var flatlist = ids.reduce(function (a, b) {
            return a + ' ' + b;
        });

        return flatlist;
    }


    function extractOCR(body) {
        var traverseResult = traverseOCR(body);
        return null;
    }

    // Set up our event listener to run the startup process
    // once loading is complete.
    window.addEventListener('load', startup, false);
})();