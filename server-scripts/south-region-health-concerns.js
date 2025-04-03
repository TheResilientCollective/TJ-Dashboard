const { PDFDocument } = require('pdf-lib');
const pdfParse = require('pdf-parse');

const targetUrl = "https://www.sandiegocounty.gov/content/sdc/hhsa/programs/phs/community_epidemiology/south-region-health-concerns/Local-Data.html";
let healthConcernsInfo;

async function getLatestPdf() {
    try {
        const response = await fetch(targetUrl);
        if (!response.ok) {
            console.error("[health-concerns.js] Error fetching the page:", response.statusText);
            return null;
        }
        const text = await response.text();

        // Dynamically import jsdom
        const { JSDOM } = await import('jsdom');

        // Parse as HTML using jsdom
        const dom = new JSDOM(text);
        const doc = dom.window.document;

        // Find <a> with href matching like the following url
        const urlLike = "/content/dam/sdc/hhsa/programs/phs/Epidemiology/south-region-gi-illness/Surveillance%20Bulletin%20South%20Region%20Health%20Concerns_";
        const linkElement = doc.querySelector('a[href^="' + urlLike + '"]');

        if (linkElement) {
            const pdfUrl = "https://www.sandiegocounty.gov" + linkElement.getAttribute('href');
            const pdfName = pdfUrl.split('/').pop();
            const dateString = pdfName.match(/_(\d{8})\.pdf/)[1];
            const pdfDate = new Date(
                parseInt(dateString.slice(4, 8)),
                parseInt(dateString.slice(0, 2)) - 1,
                parseInt(dateString.slice(2, 4))
            );
            healthConcernsInfo = { url: pdfUrl, date: pdfDate };
            return healthConcernsInfo;
        }
    } catch (error) {
        console.error("[health-concerns.js] Error:", error);
        return null;
    }
}

getLatestPdf().then(info => {
    if (info) {
        parsePdf(info.url).then(data => {
            if (data) {
                console.log("Parsed PDF Data:", data);
            } else {
                console.error("Failed to parse PDF data.");
            }
        });
    } else {
        console.log("No PDF found.");
    }
});

async function parsePdf(url) {
    try {
        // Fetch the PDF file from the URL
        const response = await fetch(url);
        if (!response.ok) {
            console.error("[parsePdf] Error fetching the PDF:", response.statusText);
            return null;
        }
        const pdfBuffer = await response.arrayBuffer();
        const extractedData = [];

        // Extract text using pdf-parse
        const pdfData = await pdfParse(Buffer.from(pdfBuffer));
        const text = pdfData.text;
        const textPages = text.split(/Page \d+/).map(page => page.trim()).filter(page => page.length > 0);

        // Load the PDF document for further processing
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const numPages = pdfDoc.getPageCount();
        // console.log("[parsePdf] Number of pages:", numPages);


        for (let i = 0; i < numPages; i++) {
            const page = pdfDoc.getPage(i);

            // Extract text for each page
            const pageText = textPages[i];

            // TODO: Extract images
            const images = [];
            const resources = page.node.Resources();
            const pageObjects = page.node.normalizedEntries();
            // console.log(pageObjects.Annots);
            // console.log(pageObjects.Resources);
            // console.log(pageObjects.Contents);
            // console.log(pageObjects.XObject);

            // for (const [key, value] of pageObjects.XObject) {
            //     console.log(`[parsePdf] Found XObject: ${key}`);
            //     console.log(value);
            //     // if (value.constructor.name === 'PDFRawStream') {
            //     //     const image = await pdfDoc.embedPng(value.contents);
            //     //     const imageData = {
            //     //         width: image.width,
            //     //         height: image.height,
            //     //         data: image.bytes,
            //     //     };
            //     //     images.push(imageData);
            //     // }
            // }
            // console.log(`[parsePdf] Extracted ${images.length} images from page ${i + 1}`);

            // TODO: Extract graphs
            const graphs = [];
            // console.log(`[parsePdf] Extracted ${graphs.length} graphs from page ${i + 1}`);

            extractedData.push({ page: i + 1, text: pageText, images, graphs });
        }

        // Return extracted data
        // console.log("[parsePdf] Extraction complete.", extractedData);
        return extractedData;
    } catch (error) {
        console.error("[parsePdf] Error parsing the PDF:", error);
        return null;
    }
}