
import SVGtoPDF from "svg-to-pdfkit"

PDFDocument.prototype.addSVG = function (svg, x, y, options) {
    options = { ...options, assumePt: true, preserveAspectRatio: "xMidYMid meet" },
        SVGtoPDF(this, svg, x, y, options)
}

function addB64Image(doc, imageData, x, y, options) {
    //console.log(imageData);
    //let image = imageData;
    //console.log("image is: ", image);
    let imageDataURI = atob(imageData) // Your base64 image data here
    // Split the data URI prefix and get the base64 data part
    let imageDataNew = imageDataURI.split(",")[1]

    // Convert the base64 data to a Buffer
    let imageBuffer = Buffer.from(imageDataNew, "base64")
    try {
        // Your code to generate PDF with images using pdfkit
        doc.image(imageBuffer, x, y, options)
    } catch (error) {
        // Handle errors
        console.error(
            "An unexpected error occurred while adding image:",
            error.message
        )
    }
}

function formatPhoneNumber(input) {
    // Convert the input to a string
    const inputString = String(input)

    // Check if the input is null or not a string
    if (inputString === "null" || typeof inputString !== "string") {
        console.error(
            "Invalid input. Please provide a non-null string or a number."
        )
        return null
    }

    // Use a regular expression to match only digits
    const numbersOnly = inputString.replace(/\D/g, "")

    // Check if the extracted numbers form a valid phone number
    if (numbersOnly.length !== 10) {
        // If not a valid phone number, you can handle it accordingly (throw an error, return a default value, etc.)
        console.error("Invalid phone number format")
        return null
    }

    // Format the numbers as a phone number (e.g., (123) 456-7890)
    const formattedNumber = `(${numbersOnly.slice(0, 3)}) ${numbersOnly.slice(
        3,
        6
    )}-${numbersOnly.slice(6)}`

    return formattedNumber
}

function addImageB64(doc, imageData, x, y, options) {
    //console.log(imageData);
    //let image = imageData;
    //console.log("image is: ", image);
    let imageDataURI = imageData // Your base64 image data here
    // Split the data URI prefix and get the base64 data part
    let imageDataNew = imageDataURI.split(",")[1]

    // Convert the base64 data to a Buffer
    let imageBuffer = Buffer.from(imageDataNew, "base64")
    try {
        // Your code to generate PDF with images using pdfkit
        doc.image(imageBuffer, x, y, options)
    } catch (error) {
        // Handle errors
        console.error(
            "An unexpected error occurred while adding image:",
            error.message
        )
    }
}

// function addB64Image(doc, imageData, x, y, width, height) {
//   //console.log(imageData);
//   let image = atob(imageData);
//   //let image = imageData;
//   let imageCoordinate = { x: x, y: y };
//   //console.log("image is: ", image);
//   let imageBuffer = new Buffer.from(
//     image.replace("data:image/png;base64,", ""),
//     "base64"
//   );
//   doc.image(imageBuffer, imageCoordinate.x, imageCoordinate.y, {
//     width: width,
//     height: height,
//   });
// }



function convertToWhite(canvas) {
    const ctx = canvas.getContext("2d")

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)

    for (let i = 0; i < pixels.data.length; i += 4) {
        pixels.data[i] = 255
        pixels.data[i + 1] = 255
        pixels.data[i + 2] = 255
    }

    ctx.putImageData(pixels, 0, 0)
}

function processItem(width, aspectRatio, makeWhite) {
    // do something with the item
    // var imgData = map.toDataURL({
    //   quality: 1,
    //   mimeType: "image/png", // or 'image/png'
    //   save: false, // to pop a save dialog
    //   fileName: "map", // file name
    // });

    //standardize image res by drawing canvas to new canvas of specified res
    //original canvas res depends on monitor

    var canvas = document.getElementsByTagName("canvas")[0]
    var resizedCanvas = document.createElement("canvas")
    var resizedContext = resizedCanvas.getContext("2d")
    let canvasWidth = width || 2000
    let originalAspectRatio = canvas.width / canvas.height
    console.log("originlaspect ratio", originalAspectRatio)
    let pixelRatio = 1
    if (canvasWidth > 2000) {
        pixelRatio = 4
    }
    // scaleCanvas(
    //   resizedCanvas,
    //   resizedContext,
    //   canvasWidth,
    //   canvasWidth / aspectRatio
    // );

    resizedCanvas.width = canvasWidth
    resizedCanvas.height = aspectRatio
        ? canvasWidth / aspectRatio
        : canvasWidth / originalAspectRatio

    resizedContext.drawImage(
        canvas,
        0,
        0,
        resizedCanvas.width,
        resizedCanvas.height
    )

    if (makeWhite) {
        convertToWhite(resizedCanvas)
    }

    let imgData = resizedCanvas.toDataURL("image/png", pixelRatio)
    document.getElementById("map").style.width = "100%"
    return btoa(imgData)
}

async function createTblock(doc, projectData) {
    let { client, engineer, versions, format } = projectData
    let project = projectData
    let engineerAddress = project.engineerAddress
    let engineerLogo = project.engineerLogo
    let clientLogo = project.clientLogo
    let caNumber = project.engineer.ca
    let clientName = project.client.client_name
    //grey rects
    let engineeringCompany = project.engineer.company?.toUpperCase()
    let themeColor = "#000"
    //"#01a2dd"

    if (engineeringCompany) {
        doc
            .polygon([52, 37], [52, 49], [797, 49], [804, 37], [54, 37])
            .fill(themeColor)
            .polygon([1083, 37], [1076, 49], [1173, 49], [1173, 37], [54, 37])
            .fill(themeColor)
    } else {
        doc
            .polygon([52, 37], [52, 49], [1173, 49], [1173, 37], [54, 37])
            .fill(themeColor)
    }

    // doc.fontSize(9).text(engineeringCompany, 805, 40, {
    //   align: "center",
    //   width: 270,
    // });

    // doc.fontSize(9).text("Solar Design Lab", 805, 40, {
    //   align: "center",
    //   width: 270,
    // })

    // doc.fontSize(9).text(clientName || "Solar Design Lab", 805, 40, {
    //     align: "center",
    //     width: 270,
    // })

    var interconnectifyLogo =
        '    <svg xmlns="http://www.w3.org/2000/svg" width="190" viewBox="0 0 2040 371">\
        <defs><style scoped>\
.cls-1,\
.cls-2 {\
  fill-rule: evenodd;\
}\
.cls-2,\
.cls-3 {\
  fill: none;\
  stroke-width: 18px;\
}\
.cls-2 {\
  stroke: #000;\
  stroke-linecap: round;\
}\
.cls-3 {\
  stroke: #01a2dd;\
}\
</style>\
</defs>\
        <path\
          id="interconnectify"\
          class="cls-1"\
          d="M443.418,114.082a13.91,13.91,0,0,0,10.1,3.947,13.657,13.657,0,0,0,9.888-3.947,12.9,12.9,0,0,0,4.06-9.615,13.137,13.137,0,0,0-4.06-9.817,13.656,13.656,0,0,0-9.888-3.947,13.908,13.908,0,0,0-10.1,3.947,13.14,13.14,0,0,0-4.059,9.817A12.9,12.9,0,0,0,443.418,114.082Zm19.465,31.476a8.688,8.688,0,0,0-2.707-6.477,9.746,9.746,0,0,0-13.323,0,8.68,8.68,0,0,0-2.706,6.477v88.256a8.671,8.671,0,0,0,2.706,6.477,9.746,9.746,0,0,0,13.323,0,8.679,8.679,0,0,0,2.707-6.477V145.558Zm46.009,44.128a33.487,33.487,0,0,1,2.811-13.663,35.129,35.129,0,0,1,7.7-11.134,36.771,36.771,0,0,1,51,0,35.18,35.18,0,0,1,7.7,11.134,33.486,33.486,0,0,1,2.81,13.663v44.128a8.668,8.668,0,0,0,2.707,6.477,9.746,9.746,0,0,0,13.323,0,8.683,8.683,0,0,0,2.707-6.477V189.686a51.306,51.306,0,0,0-4.268-20.849,53.145,53.145,0,0,0-11.658-16.9A56.279,56.279,0,0,0,566.35,140.5a55.68,55.68,0,0,0-42.677,0,57.586,57.586,0,0,0-17.487,11.437,52.268,52.268,0,0,0-11.762,16.9,51.256,51.256,0,0,0-4.268,20.849v44.128a8.668,8.668,0,0,0,2.707,6.477,9.746,9.746,0,0,0,13.323,0,8.682,8.682,0,0,0,2.706-6.477V189.686Zm125.322-53.237H622.348a9.193,9.193,0,0,0-6.662,2.632,9.106,9.106,0,0,0,0,12.955,9.18,9.18,0,0,0,6.662,2.631h11.866v53.642a32.131,32.131,0,0,0,2.707,13.056,33.559,33.559,0,0,0,7.39,10.728,34.971,34.971,0,0,0,10.929,7.186,33.929,33.929,0,0,0,13.324,2.632H674.6a9.288,9.288,0,0,0,6.558-2.632,8.871,8.871,0,0,0,0-12.955,9.3,9.3,0,0,0-6.558-2.631h-6.037a15.25,15.25,0,0,1-11.034-4.453,14.646,14.646,0,0,1-4.58-10.931V154.667h22.9a9.19,9.19,0,0,0,6.662-2.631,9.106,9.106,0,0,0,0-12.955,9.2,9.2,0,0,0-6.662-2.632h-22.9V99.811a8.693,8.693,0,0,0-2.706-6.478,9.747,9.747,0,0,0-13.323,0,8.679,8.679,0,0,0-2.707,6.478v36.638Zm100.549,4.15a56.1,56.1,0,0,0-17.487,11.336,52.253,52.253,0,0,0-11.762,16.9,52.564,52.564,0,0,0,0,41.5,53.422,53.422,0,0,0,11.762,17,56.268,56.268,0,0,0,61.517,10.83A53.9,53.9,0,0,0,797.425,224.5a8.861,8.861,0,0,0,2.29-6.578,8.339,8.339,0,0,0-3.123-6.174,9.076,9.076,0,0,0-6.245-2.429,9.176,9.176,0,0,0-7.078,3.239,35.429,35.429,0,0,1-12.283,9.007A36.547,36.547,0,0,1,756,224.705a35.7,35.7,0,0,1-11.658-1.923,36.451,36.451,0,0,1-10.2-5.364,35.945,35.945,0,0,1-7.911-8.2,35.4,35.4,0,0,1-5-10.425H801.38a9.19,9.19,0,0,0,6.662-2.631,8.686,8.686,0,0,0,2.706-6.478,51.321,51.321,0,0,0-4.267-20.849,53.164,53.164,0,0,0-11.659-16.9A56.408,56.408,0,0,0,734.763,140.6Zm-13.532,39.978a34.915,34.915,0,0,1,12.907-18.724,36.659,36.659,0,0,1,33.517-5.263,38.256,38.256,0,0,1,10.2,5.263,36.173,36.173,0,0,1,8.015,8.1,30.578,30.578,0,0,1,4.892,10.627H721.231Zm146.347-43.116a35.945,35.945,0,0,0-13.427,2.531,33.367,33.367,0,0,0-11.034,7.084,33.928,33.928,0,0,0-7.39,10.628,31.94,31.94,0,0,0-2.706,13.157v62.953a8.671,8.671,0,0,0,2.706,6.477,9.747,9.747,0,0,0,13.324,0,8.682,8.682,0,0,0,2.706-6.477V170.861a14.33,14.33,0,0,1,4.58-10.83,15.7,15.7,0,0,1,11.241-4.352h17.071a9.19,9.19,0,0,0,6.662-2.631,9.106,9.106,0,0,0,0-12.955,9.2,9.2,0,0,0-6.662-2.632H867.578ZM975.52,221.466a36.659,36.659,0,0,1-40.6-6.983,35.1,35.1,0,0,1-7.7-11.134,34.622,34.622,0,0,1,0-27.326,35.131,35.131,0,0,1,7.7-11.134,36.387,36.387,0,0,1,25.5-10.222,37.316,37.316,0,0,1,15.093,3.138,35.237,35.237,0,0,1,12.386,9.007,9.166,9.166,0,0,0,7.078,3.239,8.867,8.867,0,0,0,6.246-2.53,9.586,9.586,0,0,0,3.12-5.971,8.016,8.016,0,0,0-2.29-6.68A54.817,54.817,0,0,0,983.326,141.1a53.124,53.124,0,0,0-22.9-4.656,54.859,54.859,0,0,0-21.235,4.15,56.122,56.122,0,0,0-17.487,11.336,52.268,52.268,0,0,0-11.762,16.9,52.575,52.575,0,0,0,0,41.5,53.438,53.438,0,0,0,11.762,17,55.408,55.408,0,0,0,38.722,15.587,56.3,56.3,0,0,0,22.9-4.757A52.544,52.544,0,0,0,1002.06,224.3a8.01,8.01,0,0,0,2.29-6.68,8.471,8.471,0,0,0-3.33-6.072,8.754,8.754,0,0,0-6.036-2.227,9.442,9.442,0,0,0-7.078,3.036A36.262,36.262,0,0,1,975.52,221.466Zm124.18,17.307a53.936,53.936,0,0,0,17.38-11.437,55.827,55.827,0,0,0,11.76-17,51.438,51.438,0,0,0,0-41.5,54.563,54.563,0,0,0-11.76-16.9A56.312,56.312,0,0,0,1099.7,140.5a54.206,54.206,0,0,0-21.45-4.251,53.665,53.665,0,0,0-21.23,4.251,57.674,57.674,0,0,0-17.49,11.437,52.309,52.309,0,0,0-11.76,16.9,52.541,52.541,0,0,0,0,41.5,53.48,53.48,0,0,0,11.76,17A56.413,56.413,0,0,0,1099.7,238.773Zm-35.5-16.8a36.236,36.236,0,0,1-11.45-7.489,35.073,35.073,0,0,1-7.7-11.134,34.622,34.622,0,0,1,0-27.326,35.107,35.107,0,0,1,7.7-11.134,36.778,36.778,0,0,1,51.01,0,35.107,35.107,0,0,1,7.7,11.134,34.622,34.622,0,0,1,0,27.326,35.073,35.073,0,0,1-7.7,11.134A37.118,37.118,0,0,1,1064.2,221.972Zm109.4-32.286a33.388,33.388,0,0,1,2.81-13.663,35.107,35.107,0,0,1,7.7-11.134,36.769,36.769,0,0,1,51,0,35.3,35.3,0,0,1,7.71,11.134,33.552,33.552,0,0,1,2.81,13.663v44.128a8.684,8.684,0,0,0,2.7,6.477,9.755,9.755,0,0,0,13.33,0,8.684,8.684,0,0,0,2.7-6.477V189.686a51.35,51.35,0,0,0-4.26-20.849,53.3,53.3,0,0,0-11.66-16.9,56.241,56.241,0,0,0-17.39-11.437,55.663,55.663,0,0,0-42.67,0,57.674,57.674,0,0,0-17.49,11.437,52.155,52.155,0,0,0-11.76,16.9,51.192,51.192,0,0,0-4.27,20.849v44.128a8.656,8.656,0,0,0,2.71,6.477,9.742,9.742,0,0,0,13.32,0,8.693,8.693,0,0,0,2.71-6.477V189.686Zm133.85,0a33.552,33.552,0,0,1,2.81-13.663,35.135,35.135,0,0,1,7.71-11.134,36.769,36.769,0,0,1,51,0,35.107,35.107,0,0,1,7.7,11.134,33.388,33.388,0,0,1,2.81,13.663v44.128a8.656,8.656,0,0,0,2.71,6.477,9.742,9.742,0,0,0,13.32,0,8.656,8.656,0,0,0,2.71-6.477V189.686a51.192,51.192,0,0,0-4.27-20.849,52.974,52.974,0,0,0-11.66-16.9,56.194,56.194,0,0,0-17.38-11.437,55.688,55.688,0,0,0-42.68,0,57.5,57.5,0,0,0-17.48,11.437,52.155,52.155,0,0,0-11.76,16.9,51.192,51.192,0,0,0-4.27,20.849v44.128a8.684,8.684,0,0,0,2.7,6.477,9.755,9.755,0,0,0,13.33,0,8.684,8.684,0,0,0,2.7-6.477V189.686ZM1453.59,140.6a56.02,56.02,0,0,0-17.48,11.336,52.336,52.336,0,0,0-11.77,16.9,52.655,52.655,0,0,0,0,41.5,53.509,53.509,0,0,0,11.77,17,56.256,56.256,0,0,0,61.51,10.83,53.927,53.927,0,0,0,18.64-13.664,8.857,8.857,0,0,0,2.28-6.578,8.309,8.309,0,0,0-3.12-6.174,9.051,9.051,0,0,0-6.24-2.429,9.176,9.176,0,0,0-7.08,3.239,35.474,35.474,0,0,1-12.28,9.007,36.562,36.562,0,0,1-14.99,3.138,35.714,35.714,0,0,1-11.66-1.923,36.39,36.39,0,0,1-10.2-5.364,35.836,35.836,0,0,1-7.91-8.2,35.46,35.46,0,0,1-5-10.425h80.15a9.169,9.169,0,0,0,6.66-2.631,8.7,8.7,0,0,0,2.71-6.478,51.357,51.357,0,0,0-4.27-20.849,53.135,53.135,0,0,0-11.66-16.9A56.409,56.409,0,0,0,1453.59,140.6Zm-13.53,39.978a34.9,34.9,0,0,1,12.91-18.724,35.472,35.472,0,0,1,21.86-7.186,35.838,35.838,0,0,1,11.66,1.923,38.431,38.431,0,0,1,10.2,5.263,36.173,36.173,0,0,1,8.01,8.1,30.52,30.52,0,0,1,4.89,10.627h-69.53Zm177.89,40.889a36.663,36.663,0,0,1-40.6-6.983,35.073,35.073,0,0,1-7.7-11.134,34.622,34.622,0,0,1,0-27.326,35.107,35.107,0,0,1,7.7-11.134,36.387,36.387,0,0,1,25.5-10.222,37.332,37.332,0,0,1,15.1,3.138,35.2,35.2,0,0,1,12.38,9.007,9.177,9.177,0,0,0,7.08,3.239,8.883,8.883,0,0,0,6.25-2.53,9.586,9.586,0,0,0,3.12-5.971,8.016,8.016,0,0,0-2.29-6.68,54.859,54.859,0,0,0-18.74-13.765,53.1,53.1,0,0,0-22.9-4.656,54.845,54.845,0,0,0-21.23,4.15,56.182,56.182,0,0,0-17.49,11.336,52.309,52.309,0,0,0-11.76,16.9,52.541,52.541,0,0,0,0,41.5,53.48,53.48,0,0,0,11.76,17,55.422,55.422,0,0,0,38.72,15.587,56.265,56.265,0,0,0,22.9-4.757,52.583,52.583,0,0,0,18.74-13.866,8.01,8.01,0,0,0,2.29-6.68,8.471,8.471,0,0,0-3.33-6.072,8.773,8.773,0,0,0-6.04-2.227,9.454,9.454,0,0,0-7.08,3.036A36.221,36.221,0,0,1,1617.95,221.466Zm67.34-85.017h-11.86a9.221,9.221,0,0,0-6.67,2.632,9.12,9.12,0,0,0,0,12.955,9.208,9.208,0,0,0,6.67,2.631h11.86v53.642a32.068,32.068,0,0,0,2.71,13.056,33.575,33.575,0,0,0,7.39,10.728,34.861,34.861,0,0,0,10.93,7.186,33.9,33.9,0,0,0,13.32,2.632h6.04a9.3,9.3,0,0,0,6.56-2.632,8.871,8.871,0,0,0,0-12.955,9.315,9.315,0,0,0-6.56-2.631h-6.04a15.246,15.246,0,0,1-11.03-4.453,14.624,14.624,0,0,1-4.58-10.931V154.667h22.9a9.2,9.2,0,0,0,6.66-2.631,9.1,9.1,0,0,0,0-12.955,9.214,9.214,0,0,0-6.66-2.632h-22.9V99.811a8.7,8.7,0,0,0-2.71-6.478,9.744,9.744,0,0,0-13.32,0,8.667,8.667,0,0,0-2.71,6.478v36.638Zm74.63-22.367a13.918,13.918,0,0,0,10.1,3.947,13.675,13.675,0,0,0,9.89-3.947,12.928,12.928,0,0,0,4.06-9.615,13.163,13.163,0,0,0-4.06-9.817,13.673,13.673,0,0,0-9.89-3.947,13.916,13.916,0,0,0-10.1,3.947,13.163,13.163,0,0,0-4.06,9.817A12.928,12.928,0,0,0,1759.92,114.082Zm19.47,31.476a8.7,8.7,0,0,0-2.71-6.477,9.742,9.742,0,0,0-13.32,0,8.665,8.665,0,0,0-2.71,6.477v88.256a8.656,8.656,0,0,0,2.71,6.477,9.742,9.742,0,0,0,13.32,0,8.693,8.693,0,0,0,2.71-6.477V145.558Zm46.21-9.109h-12.49a9.182,9.182,0,0,0-6.66,2.632,9.1,9.1,0,0,0,0,12.955,9.169,9.169,0,0,0,6.66,2.631h12.49v79.147a8.531,8.531,0,0,0,2.81,6.477,9.3,9.3,0,0,0,6.56,2.632,9.573,9.573,0,0,0,6.77-2.632,8.531,8.531,0,0,0,2.81-6.477V154.667h32.89a9.3,9.3,0,0,0,6.56-2.631,8.871,8.871,0,0,0,0-12.955,9.316,9.316,0,0,0-6.56-2.632h-32.89V125.114a14.406,14.406,0,0,1,4.58-10.729,15.258,15.258,0,0,1,11.03-4.453h21.86a9.2,9.2,0,0,0,6.66-2.631,9.1,9.1,0,0,0,0-12.955,9.213,9.213,0,0,0-6.66-2.631h-21.86a35.181,35.181,0,0,0-24.46,9.818,33.913,33.913,0,0,0-7.39,10.627,31.38,31.38,0,0,0-2.71,12.955v11.335Zm176.54,101.818a33.552,33.552,0,0,1-2.81,13.663,35.3,35.3,0,0,1-7.71,11.134,36.935,36.935,0,0,1-44.34,5.06,34.41,34.41,0,0,1-13.22-14.068,10.33,10.33,0,0,0-3.75-3.745,9.226,9.226,0,0,0-8.95-.3,8.293,8.293,0,0,0-4.68,5.263,9.279,9.279,0,0,0,.52,7.085,53.422,53.422,0,0,0,20.19,21.457,54.691,54.691,0,0,0,28.73,7.894,55.385,55.385,0,0,0,21.44-4.149,53.67,53.67,0,0,0,29.04-28.441,51.192,51.192,0,0,0,4.27-20.849V145.558a9.365,9.365,0,0,0-18.73,0v44.128a33.552,33.552,0,0,1-2.81,13.663,35.263,35.263,0,0,1-7.71,11.134,36.769,36.769,0,0,1-51,0,35.073,35.073,0,0,1-7.7-11.134,33.388,33.388,0,0,1-2.81-13.663V145.558a9.37,9.37,0,0,0-18.74,0v44.128a50.7,50.7,0,0,0,4.27,20.647,53.321,53.321,0,0,0,11.76,17,55.422,55.422,0,0,0,38.72,15.587,56.4,56.4,0,0,0,19.26-3.34,52.89,52.89,0,0,0,16.76-9.818v8.5Z"\
        />\
        <path\
          id="Shape_2_copy_5"\
          data-name="Shape 2 copy 5"\
          class="cls-2"\
          d="M226.093,76.63C143.305,46.168,45.317,126.971,87.983,232.159"\
        />\
        <path id="Shape_2_copy_6" data-name="Shape 2 copy 6" class="cls-2" d="M157.66,294.37c82.788,30.462,180.776-50.341,138.11-155.529" />\
        <circle id="Ellipse_2_copy_4" data-name="Ellipse 2 copy 4" class="cls-3" cx="281.453" cy="113.328" r="23.016" />\
        <circle id="Ellipse_2_copy_5" data-name="Ellipse 2 copy 5" class="cls-3" cx="101.047" cy="257.672" r="23.015" />\
      </svg>'

    doc.addSVG(interconnectifyLogo, 890, 35, { width: 100, height: 20 })

    /*
        let grad = doc.linearGradient(0, 50, 100, 300);
        grad.stop(0, '#ffcc05')
            .stop(1, '#fc7235');
        doc.rect(52, 37, 1121, 12)
        doc.fill(grad);
        
        let grad = doc.linearGradient(0, 200, 130, 450);
        grad.stop(0, '#01a2dd')
            .stop(1, '#959595');
        doc.rect(52, 37, 1121, 12)
        doc.fill(grad);
        */

    /*
        let grad = doc.linearGradient(0, 50, 100, 300);
        grad.stop(0, '#ffcc05')
            .stop(1, '#fc7235');
        doc.rect(52, 37, 1121, 12)
        doc.fill(grad);
        */
    //add ecuip logo

    //doc.addSVG(ecuipLogo, 878, 37)
    //reset fill

    doc.fillColor("black")

    // draw tblock lines
    /*h1*/
    doc.moveTo(52, 37).lineTo(1173, 37).stroke()
    /*h2*/
    doc.moveTo(52, 679).lineTo(1173, 679).stroke()
    /*h3*/
    doc.moveTo(52, 757).lineTo(1173, 757).stroke()
    /*h11*/
    doc.moveTo(52, 706).lineTo(340, 706).stroke()
    /*h12*/
    doc.moveTo(52, 746).lineTo(340, 746).stroke()
    /*h21*/
    doc.moveTo(340, 693).lineTo(695, 693).stroke()
    /*h31*/
    doc.moveTo(828, 693).lineTo(1120, 693).stroke()
    /*h32*/
    //doc.moveTo(702, 735).lineTo(821, 735).stroke();
    /*h41*/
    doc.moveTo(828, 706).lineTo(1173, 706).stroke()
    /*h42*/
    doc.moveTo(828, 720).lineTo(1120, 720).stroke()
    /*h43*/
    doc.moveTo(828, 733).lineTo(1173, 733).stroke()
    /*h44*/
    doc.moveTo(828, 746).lineTo(1120, 746).stroke()

    /*v1*/
    doc.moveTo(52, 37).lineTo(52, 757).stroke()
    /*v2*/
    doc.moveTo(1173, 37).lineTo(1173, 757).stroke()
    /*v11*/
    doc.moveTo(340, 679).lineTo(340, 757).stroke()
    /*v12*/
    doc.moveTo(564, 679).lineTo(564, 757).stroke()
    /*v13*/
    doc.moveTo(695, 679).lineTo(695, 757).stroke()
    /*v14*/
    doc.moveTo(828, 679).lineTo(828, 757).stroke()
    /*v15*/
    doc.moveTo(865, 679).lineTo(865, 757).stroke()
    /*v16*/
    doc.moveTo(885, 679).lineTo(885, 757).stroke()
    /*v17*/
    doc.moveTo(909, 679).lineTo(909, 757).stroke()
    /*v18*/
    doc.moveTo(1120, 679).lineTo(1120, 757).stroke()

    //ruler stops
    /*rh1*/
    doc.moveTo(175, 29).lineTo(175, 37).stroke()
    /*rh2*/
    doc.moveTo(299, 29).lineTo(299, 37).stroke()
    /*rh3*/
    doc.moveTo(422, 29).lineTo(422, 37).stroke()
    /*rh4*/
    doc.moveTo(545, 29).lineTo(545, 37).stroke()
    /*rh5*/
    doc.moveTo(668, 29).lineTo(668, 37).stroke()
    /*rh6*/
    doc.moveTo(791, 29).lineTo(791, 37).stroke()
    /*rh7*/
    doc.moveTo(914, 29).lineTo(914, 37).stroke()
    /*rh8*/
    doc.moveTo(1037, 29).lineTo(1037, 37).stroke()

    /*rv1*/
    doc.moveTo(45, 157).lineTo(52, 157).stroke()
    /*rv2*/
    doc.moveTo(45, 278).lineTo(52, 278).stroke()
    /*rv3*/
    doc.moveTo(45, 399).lineTo(52, 399).stroke()
    /*rv4*/
    doc.moveTo(45, 520).lineTo(52, 520).stroke()
    /*rv5*/
    doc.moveTo(45, 641).lineTo(52, 641).stroke()

    // create static text
    doc
        .fontSize(9)
        .text("PROJECT ID:", 54, 748)
        .text("CONTRACTOR:", 342, 683)
        .text("ENGINEER: " + caNumber, 567, 683)
        .text("DESCRIPTION", 910, 683, {
            width: 210,
            align: "center",
        })
        .text("DATE", 834, 683)
        .text("VER", 887, 683)
        .text("BY", 868, 683)
        .text("PAPER: ARCHB", 1121, 709, {
            width: 52,
            align: "center",
        })
        .text("SCALE:", 1121, 735, {
            width: 52,
            align: "center",
        })

    //versioning
    var yStart = 682 + 14
    var yLineSpace = 14
    var ver = 1

    for (var i = 0; i < versions.length; i++) {
        var newDate = versions[i].date
        doc
            .fontSize(9)
            .text(newDate, 829, yStart)
            .text(versions[i].initials, 865, yStart, {
                width: 20,
                align: "center",
            })
            .text(ver, 886, yStart, {
                width: 22,
                align: "center",
            })
            .text(versions[i].desc.toUpperCase(), 912, yStart, {
                width: 210,
                align: "left",
            })
        yStart = yStart + yLineSpace
        ver = ver + 1
    }

    //COPYRIGHT STATEMENT
    doc.save()
    doc.fontSize(6)
    doc.rotate(-90, { origin: [1185, 760] })
    doc.text(
        "UNAUTHORIZED USE OF THIS DRAWING SET WITHOUT WRITTEN PERMISSION FROM CONTRACTOR IS IN VIOLATION OF U.S. COPYRIGHT LAWS AND WILL BE SUBJECT TO CIVIL DAMAGES AND PROSECUTIONS",
        1180,
        751,
        {
            width: 715,
            align: "center",
        }
    )
    doc.rotate(-90 * -1, { origin: [1185, 760] })
    doc.restore()



    //doc.addSVG(ecuipLogoShort, 576, 680);
    // doc.addSVG(interconnectify, 566, 694, { fit: [130, 40] })
    // if (engineerLogo) {
    //     addB64Image(doc, engineerLogo, 566, 694, { fit: [130, 40] })
    // } else if (engineeringCompany) {
    //     doc.text(engineeringCompany, 566, 694, { width: 130, align: "center" })
    // }
    doc.fontSize(9)
    doc.text(engineerAddress?.toUpperCase(), 567, 738, {
        width: 126,
        align: "center",
    })

    // doc.text(caNumber, 567, 748, {
    //   width: 126,
    //   align: "center",
    // });

    doc
        .fontSize(9)
        .text("A", 41, 96)
        .text("B", 41, 216)
        .text("C", 41, 337)
        .text("D", 41, 457)
        .text("E", 41, 576)
        .text("F", 41, 698)
        .text("1", 114, 24)
        .text("2", 238, 24)
        .text("3", 360, 24)
        .text("4", 485, 24)
        .text("5", 609, 24)
        .text("6", 733, 24)
        .text("7", 857, 24)
        .text("8", 980, 24)
        .text("9", 1104, 24)

    //create dynamic content common across all pages
    if (client.client_phone) {
        client.client_phone = formatPhoneNumber(client.client_phone)
    }
    doc
        .fontSize(9)
        .text(project.name?.toUpperCase(), 54, 686, {
            width: 286,
            align: "center",
        })
        .text(project.address?.toUpperCase(), 54, 715, {
            width: 286,
            align: "center",
        })
        .text(project.id, 112, 748)
        .text(client.client_name?.toUpperCase(), 408, 696, {
            width: 150,
            align: "left",
        })
        .text(client.client_address?.toUpperCase(), 408, 715, {
            width: 155,
            align: "left",
        })
        .text(client.client_phone?.toUpperCase(), 408, 746, {
            width: 155,
            align: "left",
        })
        .text(client.client_license?.toUpperCase(), 422, 682)

    if (clientLogo) {
        //let clientLogo = await getImageAsBase64(client.logo);
        // addB64Image(doc, clientLogo, 340, 695, {
        //     fit: [62, 62],
        //     align: "center",
        //     valign: "center",
        // })
    }

    doc
        .text(engineer?.name?.toUpperCase(), 695, 738, {
            width: 134,
            align: "center",
        })
        .text(engineer?.license?.toUpperCase(), 695, 748, {
            width: 134,
            align: "center",
        })

    //   if (alldata.format) {
    //     doc.image("physical-seal.png", 680, 640, {
    //       width: 144,
    //     });
    //   }
}

//**********TOOLS******************************************************************** */

async function addSheet(documentObj, req, sheetsArr, type) {
    documentObj.addPage()
    await createTblock(documentObj, req)
    //addPageNumber(pageNumber, documentObj);
    sheetsArr.push(type)
}

async function addLetter(documentObj, req, sheetsArr, type) {
    documentObj.addPage({ size: "LETTER" })
    // await createTblock(documentObj, req);
    // //addPageNumber(pageNumber, documentObj);
    // sheetsArr.push(type);
}

function base64ImageBuffer(imageData) {
    let image = atob(imageData)
    let imageBuffer = new Buffer.from(
        image.replace("data:image/png;base64,", ""),
        "base64"
    )
    return imageBuffer
}

//north arrow

function lastWord(words) {
    var n = words.split(" ")
    return n[n.length - 1]
}

function addPageNumber(pageNumber, documentObj) {
    documentObj.fontSize(16).text(pageNumber, 1123, 686, {
        width: 50,
        align: "center",
    })
}

function addLabel(documentObj, labelNum, label, x, y) {
    documentObj
        .fontSize(13)
        .rect(x, y, 20, 20)
        .text(labelNum, x, y + 5, {
            width: 20,
            align: "center",
        })
        .text(label, x + 24, y + 1)
        .moveTo(x + 20, y + 12)
        .lineTo(x + 180, y + 12)
        .stroke()
}

//add legend
function addLegend(documentObj, acronym, name, x, y) {
    documentObj
        .fontSize(9)
        .rect(x, y, 30, 15)
        .text(acronym, x, y + 5, {
            width: 30,
            align: "center",
        })
        .text("-" + name, x + 35, y + 5)
        .stroke()
}

function addNotes(documentObj, notesArr, x, y, maxWidth, fontSize) {
    // set coordinates
    if (fontSize) {
        documentObj.fontSize(fontSize)
    } else {
        documentObj.fontSize(9)
    }
    documentObj.x = x
    documentObj.y = y

    for (var j = 0; j < notesArr.length; j++) {
        documentObj.font("Helvetica-Bold")
        documentObj.text(notesArr[j][0], x, documentObj.y, {
            width: maxWidth,
        })
        documentObj.font("Helvetica")
        for (var i = 1; i < notesArr[j].length; i++) {
            documentObj.text(
                j + 1 + "." + i + "   " + notesArr[j][i],
                x + 10,
                documentObj.y,
                {
                    width: maxWidth,
                }
            )
        }
    }
}

function fillArrayToNumRows(arr, numRows) {
    while (arr.length < numRows) {
        arr.push("")
    }
    return arr
}

function addTable(documentObj, table) {
    //set font size
    if (!table?.fontSize) {
        documentObj.fontSize(9)
    } else {
        documentObj.fontSize(table.fontSize)
    }

    let showLines = table?.hideLines ? 0 : 1
    //generate column widths if not specified or widen if too small
    var rightPadding = 5
    fillArrayToNumRows(table.data, table.numRows)
    table.rowHeights = []
    for (var j = 0; j < table.data.length; j++) {
        for (var i = 0; i < table.data[j].length; i++) {
            if (Array.isArray(table.data[j][i])) {
                for (let k = 0; k < table.data[j][i].length; k++) {
                    const el = table.data[j][i][k]
                    let columnWidth = 0
                    if (isNaN(table.columnWidths[i])) {
                        columnWidth = documentObj.widthOfString(el || "x") + rightPadding
                    } else if (
                        documentObj.widthOfString(el || "x") + rightPadding >
                        table.columnWidths[i]
                    ) {
                        columnWidth = documentObj.widthOfString(el || "x") + rightPadding
                    }
                    if (columnWidth > table.columnWidths[i]) {
                        table.columnWidths[i] = columnWidth
                    }
                }
            } else {
                if (isNaN(table.columnWidths[i])) {
                    table.columnWidths[i] =
                        documentObj.widthOfString(table.data[j][i] || "x") + rightPadding
                } else if (
                    documentObj.widthOfString(table.data[j][i] || "x") + rightPadding >
                    table.columnWidths[i]
                ) {
                    table.columnWidths[i] =
                        documentObj.widthOfString(table.data[j][i] || "x") + rightPadding
                }
            }
        }
        let numRowsLineHeight = documentObj.currentLineHeight("x") + 2
        if (table?.compact) {
            numRowsLineHeight = documentObj.currentLineHeight("x") + 1
        }
        for (let i = 0; i < table.data[j].length; i++) {
            const el = table.data[j][i]
            if (Array.isArray(el)) {
                numRowsLineHeight = documentObj.currentLineHeight("x") * el.length - 1
            }
        }
        table.rowHeights[j] = numRowsLineHeight
    }

    //get row height
    table.rowHeight = documentObj.currentLineHeight("x") + 2

    //get table width (sum of column widths)
    var tableWidth = 0

    for (var i = 0; i < table.columnWidths.length; i++) {
        tableWidth = tableWidth + table.columnWidths[i]
    }

    //draw horizontal lines
    var yNew = table.y
    var xStart = table.x
    var xEnd = table.x + tableWidth
    for (var i = 0; i < table.data.length + 1; i++) {
        if (!showLines) {
            documentObj.strokeOpacity(0)
        }
        documentObj.moveTo(xStart, yNew).lineTo(xEnd, yNew).stroke()

        yNew = yNew + table.rowHeights[i]
    }
    //draw vertical lines
    //yNew - y = table height
    var tableHeight = 0
    for (let i = 0; i < table.rowHeights.length; i++) {
        tableHeight += table.rowHeights[i]
    }
    var xNew = table.x
    var yStart = table.y
    var yEnd = table.y + tableHeight
    for (var i = 0; i < table.columnWidths.length + 1; i++) {
        if (!showLines) {
            documentObj.strokeOpacity(0)
        }
        documentObj.moveTo(xNew, yStart).lineTo(xNew, yEnd).stroke()

        xNew = xNew + table.columnWidths[i]
    }
    populateTable(documentObj, table)
}

function populateTable(documentObj, table) {
    documentObj.save()
    //set font size
    if (!table?.fontSize) {
        documentObj.fontSize(9)
    } else {
        documentObj.fontSize(table.fontSize)
    }
    let showLines = table?.hideLines ? 0 : 1
    var padding = showLines ? 3 : 0
    //fill col 1
    var yNew = table.y
    var xNew = table.x
    var numCol = table.columnWidths.length
    for (var j = 0; j < table.data.length; j++) {
        xNew = table.x
        for (var i = 0; i < table.data[j].length; i++) {
            if (table?.heading == "col") {
                if (i == 0) {
                    documentObj.font("Helvetica-Bold")
                } else {
                    documentObj.font("Helvetica")
                }
            }
            if (table?.heading == "row") {
                if (j == 0) {
                    documentObj.font("Helvetica-Bold")
                } else {
                    documentObj.font("Helvetica")
                }
            }
            if (Array.isArray(table.data[j][i])) {
                for (let k = 0; k < table.data[j][i].length; k++) {
                    if (k > 0) {
                        documentObj.fontSize(documentObj._fontSize - 2)
                    }
                    if (k > 1) {
                        documentObj.font("Helvetica-Bold")
                    }
                    const el = table.data[j][i][k]
                    documentObj.text(
                        el,
                        xNew + padding,
                        yNew + padding + documentObj.currentLineHeight("x") * k
                    )
                    documentObj.fontSize(9)
                    documentObj.font("Helvetica")
                }
                xNew = xNew + table.columnWidths[i]
            } else {
                documentObj.text(table.data[j][i], xNew + padding, yNew + padding)
                xNew = xNew + table.columnWidths[i]
            }
        }
        yNew = yNew + table.rowHeights[j]
    }
    documentObj.restore()
    documentObj.font("Helvetica")
}

const removeDuplicates = (arr, key) => {
    const unique = {}
    return arr.filter((obj) => {
        if (obj && !unique[obj[key]]) {
            unique[obj[key]] = true
            return true
        }
        return false
    })
}

const getUniqueValues = (arr, key) => {
    return arr.reduce((acc, obj) => {
        if (obj && obj.hasOwnProperty(key) && !acc.includes(obj[key])) {
            acc.push(obj[key])
        }
        return acc
    }, [])
}

function removeDuplicateStrings(arr) {
    // Create a new Set to store unique strings
    const uniqueSet = new Set(arr)

    // Convert the Set back to an array
    const uniqueArray = [...uniqueSet]

    return uniqueArray
}

async function getImageAsBase64(imageUrl) {
    try {
        //console.time('Fetch Image')
        const response = await fetch(imageUrl)
        //console.timeEnd('Fetch Image')
        const blob = await response.blob()
        const reader = new FileReader()

        await new Promise((resolve, reject) => {
            reader.onloadend = () => resolve()
            reader.onerror = reject
            reader.readAsDataURL(blob)
        })

        const base64Image = btoa(reader.result)
        return base64Image
    } catch (error) {
        console.error("Error:", error)
        throw error
    }
}

// async function getImageAsBase64(url) {
//   // Fetch the image from the URL using axios
//   const response = await axios.get(url, {
//     responseType: "arraybuffer",
//   });

//   // Convert the ArrayBuffer to a Uint8Array
//   const uint8Array = new Uint8Array(response.data);

//   // Convert the Uint8Array to a base64-encoded string
//   const base64Image = btoa(String.fromCharCode.apply(null, uint8Array));

//   return base64Image;
// }

function addZoneKey(
    documentObj,
    startpointx,
    startpointy,
    width,
    height,
    key,
    color,
    zWidth,
    rect,
    lineType,
    opacity
) {
    documentObj.save()
    if (rect) {
        documentObj.dash(1, { space: 0 })
        startpointy += height
        //documentObj.fontSize(9);
        if (lineType == "dash") {
            documentObj
                .polygon(
                    [startpointx, startpointy],
                    [startpointx + width, startpointy],
                    [startpointx + width, startpointy - height],
                    [startpointx, startpointy - height]
                )
                .dash(5, { space: 3 })

            if (opacity) {
                documentObj.stroke(color)
                    .fillColor(color, opacity || 1)
                    .fillAndStroke("black", "black")
            } else {
                documentObj
                    .fillAndStroke("#fff", color)
                    .fillAndStroke("black", "black")
            }

        } else {
            documentObj
                .polygon(
                    [startpointx, startpointy],
                    [startpointx + width, startpointy],
                    [startpointx + width, startpointy - height],
                    [startpointx, startpointy - height]
                )
                .dash(1, { space: 0 })
                .fillColor(color, opacity || 1)
                .fillAndStroke(color, "black")
                .fillAndStroke("black", "black")
        }
        documentObj
            .fillColor("black", 1)
            .text(
                zWidth,
                startpointx + width / 2 - documentObj.widthOfString(String(zWidth)) / 2,
                startpointy - height / 2 - 3
            )
            .text("-" + key, startpointx + width + 5, startpointy - height / 2 - 3)
    } else {
        startpointy += height
        //documentObj.fontSize(9);
        if (lineType == "dash") {
            documentObj
                .polygon(
                    [startpointx, startpointy],
                    [startpointx + width / 2 - 6, startpointy],
                    [startpointx + width / 2 - 3, startpointy + 3],
                    [startpointx + width / 2, startpointy],
                    [startpointx + width / 2 + 3, startpointy - 3],
                    [startpointx + width / 2 + 6, startpointy],
                    [startpointx + width, startpointy],
                    [startpointx + width, startpointy - height],
                    [startpointx + width / 2 + 6, startpointy - height],
                    [startpointx + width / 2 + 3, startpointy - height - 3],
                    [startpointx + width / 2, startpointy - height],
                    [startpointx + width / 2 - 3, startpointy - height + 3],
                    [startpointx + width / 2 - 6, startpointy - height],
                    [startpointx, startpointy - height]
                )
                .dash(5, { space: 3 })
                .fillColor(color, opacity || 1)
                .fillAndStroke("#fff", color)
                .fillAndStroke("black", "black")
        } else {
            documentObj
                .polygon(
                    [startpointx, startpointy],
                    [startpointx + width / 2 - 6, startpointy],
                    [startpointx + width / 2 - 3, startpointy + 3],
                    [startpointx + width / 2, startpointy],
                    [startpointx + width / 2 + 3, startpointy - 3],
                    [startpointx + width / 2 + 6, startpointy],
                    [startpointx + width, startpointy],
                    [startpointx + width, startpointy - height],
                    [startpointx + width / 2 + 6, startpointy - height],
                    [startpointx + width / 2 + 3, startpointy - height - 3],
                    [startpointx + width / 2, startpointy - height],
                    [startpointx + width / 2 - 3, startpointy - height + 3],
                    [startpointx + width / 2 - 6, startpointy - height],
                    [startpointx, startpointy - height]
                )
                .fillColor(color, opacity || 1)
                .fillAndStroke(color, "black")
                .fillAndStroke("black", "black")
        }

        documentObj
            .fillColor("black", 1)
            .text(
                "< " + zWidth + "' >",
                startpointx +
                width / 2 -
                documentObj.widthOfString("< " + String(zWidth) + "' >") / 2,
                startpointy - height / 2 - 3
            )
            .text("-" + key, startpointx + width + 5, startpointy - height / 2 - 3)
    }
    documentObj.restore()
}

function calcMppCurrent(numPanels, panelPower, inverter) {
    var MPPCurrentCalc =
        Math.round(((numPanels * panelPower) / inverter.nomInputVoltage) * 100) /
        100
    var maxInputCurrent = inverter.maxInputCurrent
    if (MPPCurrentCalc <= maxInputCurrent) {
        return MPPCurrentCalc
    } else return maxInputCurrent
}

async function svgFileToString(path) {
    let string
    await fetch(path)
        .then((response) => response.text())
        .then((text) => {
            //console.log("logo", text);
            string = String(text)
        })
    return string
}

async function pngFileToString(path) {
    try {
        const response = await fetch(path)
        const arrayBuffer = await response.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        const binaryString = uint8Array.reduce(
            (acc, byte) => acc + String.fromCharCode(byte),
            ""
        )
        return btoa(binaryString)
    } catch (error) {
        console.error("Error:", error)
        return null
    }
}

function sumArrayValues(arr) {
    let sum = 0
    for (let i = 0; i < arr.length; i++) {
        sum += arr[i]
    }
    return sum
}

function convertToNumberArray(arr) {
    const numberArray = []
    for (let i = 0; i < arr.length; i++) {
        const num = parseFloat(arr[i]) // Convert the string to a float (decimal number)
        // Alternatively, you can use parseInt for integer conversion:
        // const num = parseInt(arr[i], 10); // Convert the string to an integer

        if (!isNaN(num)) {
            numberArray.push(num)
        }
    }
    return numberArray
}

function exportImage(doc, stream, a, filename) {
    //console.log("img data is: ", imgData);

    //console.log("calling  add base64 img", );
    // console.log('My Image', myImage);
    let blob
    stream.on("finish", function () {
        // get a blob you can do whatever you like with
        blob = stream.toBlob("application/pdf")
        // or get a blob URL for display in the browser

        if (!blob) return
        var url = window.URL.createObjectURL(blob)
        a.href = url
        a.download = filename + ".pdf" || "test.pdf"
        a.click()
        window.URL.revokeObjectURL(url)
    })
    doc.end()

}

async function getAndAddImageAsBase64(doc, url, x, y, options) {
    let image = await getImageAsBase64(url)
    addB64Image(doc, image, x, y, options)
}

async function replaceImagesWithBase64(imagesObj) {
    const toBase64 = async (url) => {
        if (url.toLowerCase().endsWith(".svg")) {
            // If the URL ends with ".svg", return the SVG string directly
            return svgFileToString(url)
        } else {
            // For other image types, perform base64 conversion
            return fetch(url)
                .then((response) => {
                    if (!response.ok) {
                        window.store.snackbarAlert(
                            "error",
                            "Error while getting pdf image files"
                        )
                        window.getProject().creatingEngineeringPDF = false
                        throw new Error(`Network response was not ok: ${response.status}`)
                    }
                    return response.blob()
                })
                .then((blob) => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader()
                        reader.onloadend = () => resolve(reader.result)
                        reader.onerror = reject
                        reader.readAsDataURL(blob)
                    })
                })
                .catch((error) => {
                    // Handle the error here
                    window.store.snackbarAlert(
                        "error",
                        "Error while getting pdf image files"
                    )
                    window.getProject().creatingEngineeringPDF = false
                    console.error("An error occurred:", error)
                    // You can throw the error again or return a default value, depending on your use case
                    throw error
                })
        }
    }

    const promises = Object.keys(imagesObj).map((key) =>
        Promise.all(
            imagesObj[key].map((url) => {
                if (url) {
                    return toBase64(url)
                }
            })
        ).then((base64Images) => {
            imagesObj[key] = base64Images
        })
    )

    try {
        await Promise.all(promises)
    } catch (error) {
        // Handle the error here
        window.store.snackbarAlert("error", "Error while getting pdf image files")
        window.getProject().creatingEngineeringPDF = false
        console.error("Error while getting pdf image files:", error)
    }

    return imagesObj
}

function m2ftSquared(meter) {
    return meter * 10.76391042
}
export {
    createTblock,
    addLabel,
    populateTable,
    addTable,
    addLegend,
    addNotes,
    addPageNumber,
    addSheet,
    base64ImageBuffer,
    lastWord,
    removeDuplicates,
    getUniqueValues,
    addZoneKey,
    removeDuplicateStrings,
    calcMppCurrent,
    addB64Image,
    sumArrayValues,
    convertToNumberArray,
    pngFileToString,
    svgFileToString,
    exportImage,
    getImageAsBase64,
    getAndAddImageAsBase64,
    replaceImagesWithBase64,
    addImageB64,
    formatPhoneNumber,
    m2ftSquared,
    addLetter,
}
