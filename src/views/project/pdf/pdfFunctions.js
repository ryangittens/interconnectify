
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
    let themeColor = client.client_color || "#01a2dd"

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

    doc.fontSize(9).text(clientName || "Solar Design Lab", 805, 40, {
        align: "center",
        width: 270,
    })

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

    var ecuipLogoShort =
        '<svg xmlns="http://www.w3.org/2000/svg" width="140" height="60" viewBox="0 0 2022 862"><defs><style>.cls-1, .cls-2 {fill: #959595;}.cls-1 {fill-rule: evenodd;}.cls-3 {fill: #01a2dd;}</style></defs>\
                              <path id="ECUIP_ENGINEERING" data-name="ECUIP ENGINEERING" class="cls-1" d="M60.058,794.385V745.392h66.591v-15H60.058V684.4h76.589v-16H42.061V810.383h96.386v-16H60.058Zm95.887-29.3a76.327,76.327,0,0,0,13.8,23.4,71.434,71.434,0,0,0,21.1,16.7,56.751,56.751,0,0,0,26.8,6.4,67.71,67.71,0,0,0,16.8-2.2,70.316,70.316,0,0,0,16.3-6.4,60.126,60.126,0,0,0,13.8-10.3,44.227,44.227,0,0,0,9.5-14.1l-15-8.2a38.082,38.082,0,0,1-7.7,11.3,48.222,48.222,0,0,1-10.1,7.8,42.025,42.025,0,0,1-11.3,4.5,49.7,49.7,0,0,1-11.5,1.4,42.4,42.4,0,0,1-19.6-4.6,50.139,50.139,0,0,1-15.6-12.4,58.683,58.683,0,0,1-10.3-17.9,61.362,61.362,0,0,1-3.7-21.3,66.175,66.175,0,0,1,3.1-19.9,55.308,55.308,0,0,1,9.3-17.8,48.311,48.311,0,0,1,15.3-12.8,43.381,43.381,0,0,1,20.9-4.9,52.4,52.4,0,0,1,11,1.2,42.239,42.239,0,0,1,10.9,4,39.625,39.625,0,0,1,9.8,7.4,41.288,41.288,0,0,1,7.7,11.4l14.2-9.2a53.484,53.484,0,0,0-20.2-22.4q-13.6-8.6-32.595-8.6a63.945,63.945,0,0,0-28.6,6.2,66.5,66.5,0,0,0-21.3,16.3,70.938,70.938,0,0,0-13.2,22.8A74.846,74.846,0,0,0,155.945,765.089Zm178.772,25.4a37.679,37.679,0,0,1-13-12.3,51.757,51.757,0,0,1-7-17.5,98.494,98.494,0,0,1-2.1-20.5V668.4h-18v71.789a112.9,112.9,0,0,0,3.1,26.5,64.509,64.509,0,0,0,10.2,22.8,51.864,51.864,0,0,0,18.7,15.9q11.6,6,28.6,6,16.4,0,27.9-5.7a50.706,50.706,0,0,0,18.7-15.5,65.15,65.15,0,0,0,10.5-22.7,109.8,109.8,0,0,0,3.3-27.3V668.4h-18v71.789a101.4,101.4,0,0,1-2,20.1,51.425,51.425,0,0,1-6.9,17.6,38.013,38.013,0,0,1-13.1,12.5q-8.2,4.8-20.6,4.8Q342.814,795.185,334.717,790.486Zm130.879,19.9V668.4h-18V810.383h18Zm51.991,0V759.39h42.394a38.091,38.091,0,0,0,17.1-3.8,41.3,41.3,0,0,0,13.2-10.2,46.888,46.888,0,0,0,8.5-14.6,49.064,49.064,0,0,0,3-17,44.6,44.6,0,0,0-3.2-16.5,49.674,49.674,0,0,0-8.9-14.6,43.575,43.575,0,0,0-13.6-10.4,38.541,38.541,0,0,0-17.3-3.9H499.59V810.383h18Zm0-125.982h40.194a23.089,23.089,0,0,1,9.9,2.2,24.812,24.812,0,0,1,8.2,6.2,31.893,31.893,0,0,1,7.7,21,35.8,35.8,0,0,1-1.8,11.4,31.477,31.477,0,0,1-5,9.5,22.874,22.874,0,0,1-7.7,6.4,21.863,21.863,0,0,1-10.1,2.3H517.587V684.4ZM681.361,801.184V742.193h72.19v-8.8h-72.19V677.6h82.588v-9.2H671.163V810.383h94.586v-9.2H681.361Zm220.368,9.2h9.4V668.4h-10.2V793.385L801.344,668.4h-7.8V810.383h10.2V687.6Zm150.981,0h8.79v-68.99h-40.99v8.2h32.2v27.4q-10.8,13-22.5,19a53.4,53.4,0,0,1-24.7,6,50.18,50.18,0,0,1-22.394-5.1,58.8,58.8,0,0,1-18.1-13.7,65.68,65.68,0,0,1-16.5-43.794,71.094,71.094,0,0,1,3.8-23,63.478,63.478,0,0,1,11-20,56.23,56.23,0,0,1,17.4-14.2,47.95,47.95,0,0,1,22.794-5.4,56.6,56.6,0,0,1,26.9,6.3q11.895,6.3,19.1,20.3l8.39-5a60.822,60.822,0,0,0-8.29-12.5,48.89,48.89,0,0,0-11.6-9.8,58.213,58.213,0,0,0-15.2-6.4,73.268,73.268,0,0,0-19.1-2.3,58.569,58.569,0,0,0-26.193,5.9,65.426,65.426,0,0,0-20.7,15.9,75.006,75.006,0,0,0-13.6,23,75.874,75.874,0,0,0-4.9,27,72.955,72.955,0,0,0,5,26.4,78,78,0,0,0,13.8,23.2,67.883,67.883,0,0,0,21.1,16.4,58.443,58.443,0,0,0,26.693,6.2q27.2,0,47.8-23.2v22.2Zm48.99,0V668.4h-10.2V810.383h10.2Zm145.38,0h9.39V668.4h-10.19V793.385L1146.69,668.4h-7.8V810.383h10.2V687.6Zm56.59-9.2V742.193h72.19v-8.8h-72.19V677.6h82.58v-9.2h-92.78V810.383h94.58v-9.2h-84.38Zm122.38,0V742.193h72.19v-8.8h-72.19V677.6h82.59v-9.2h-92.79V810.383h94.59v-9.2h-84.39Zm122.38,9.2V756.791h45.99l34.4,53.592h11.8l-35.4-55.192a37.12,37.12,0,0,0,13.6-5,38.422,38.422,0,0,0,10.6-9.6,44.5,44.5,0,0,0,6.8-13.1,48.023,48.023,0,0,0,2.4-15.1,43.371,43.371,0,0,0-3.1-15.9,48.415,48.415,0,0,0-8.6-14.2,42.365,42.365,0,0,0-13.1-10.1,36.634,36.634,0,0,0-16.6-3.8h-58.99V810.383h10.2Zm0-132.781h48.39a26.767,26.767,0,0,1,12.3,2.9,34.1,34.1,0,0,1,10,7.7,36.817,36.817,0,0,1,6.8,11.1,35.33,35.33,0,0,1,2.5,13.1,40.523,40.523,0,0,1-2.1,12.9,34.991,34.991,0,0,1-6.1,11.2,31.465,31.465,0,0,1-9.6,7.9,25.838,25.838,0,0,1-12.4,3h-49.79V677.6Zm129.78,132.781V668.4h-10.2V810.383h10.2Zm145.38,0h9.4V668.4h-10.2V793.385L1723.2,668.4h-7.8V810.383h10.2V687.6Zm150.97,0h8.8v-68.99h-40.99v8.2h32.19v27.4q-10.785,13-22.49,19a53.4,53.4,0,0,1-24.7,6,50.193,50.193,0,0,1-22.4-5.1,58.8,58.8,0,0,1-18.09-13.7,65.676,65.676,0,0,1-16.5-43.794,70.933,70.933,0,0,1,3.8-23,63.461,63.461,0,0,1,11-20,56.318,56.318,0,0,1,17.39-14.2,47.966,47.966,0,0,1,22.8-5.4,56.63,56.63,0,0,1,26.9,6.3q11.895,6.3,19.09,20.3l8.4-5a60.461,60.461,0,0,0-8.3-12.5,48.642,48.642,0,0,0-11.59-9.8,58.213,58.213,0,0,0-15.2-6.4,73.268,73.268,0,0,0-19.1-2.3,58.513,58.513,0,0,0-26.19,5.9,65.438,65.438,0,0,0-20.7,15.9,75.091,75.091,0,0,0-13.6,23,75.852,75.852,0,0,0-4.9,27,73.039,73.039,0,0,0,5,26.4,77.96,77.96,0,0,0,13.8,23.2,67.838,67.838,0,0,0,21.1,16.4,58.394,58.394,0,0,0,26.69,6.2q27.2,0,47.79-23.2v22.2Z"/>\
                              <rect class="cls-2" x="693" y="17.25" width="87.719" height="557.594"/>\
                              <rect id="Rectangle_1_copy" data-name="Rectangle 1 copy" class="cls-2" x="1241.22" y="17.25" width="87.72" height="557.594"/>\
                              <rect id="Rectangle_2_copy" data-name="Rectangle 2 copy" class="cls-3" x="869.031" y="488.281" width="87.907" height="87.719"/>\
                              <rect class="cls-2" x="1042.47" y="492.281" width="286.53" height="86.032"/>\
                              <rect id="Rectangle_3_copy" data-name="Rectangle 3 copy" class="cls-2" x="866.563" y="294.906" width="292.567" height="87.563"/>\
                              <rect id="Rectangle_3_copy_3" data-name="Rectangle 3 copy 3" class="cls-2" x="1077.41" y="121.156" width="85.09" height="261.125"/>\
                              <rect id="Rectangle_3_copy_2" data-name="Rectangle 3 copy 2" class="cls-2" x="866.563" y="118.906" width="292.567" height="87.938"/></svg>'

    //doc.addSVG(ecuipLogoShort, 576, 680);
    if (engineerLogo) {
        //addB64Image(doc, engineerLogo, 566, 694, { fit: [130, 40] })
    } else if (engineeringCompany) {
        doc.text(engineeringCompany, 566, 694, { width: 130, align: "center" })
    }
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
