// import * as pdfjsLib from "https://www.jsdelivr.com/package/npm/pdfjs-dist";
const proxyUrl = "https://api.allorigins.win/get?url=";
const targetUrl = "https://www.sandiegocounty.gov/content/sdc/hhsa/programs/phs/community_epidemiology/south-region-health-concerns/Local-Data.html"
let healthConcernsInfo;
let healthConcernsData;

async function getLatestPdf() {
    const response = await fetch(proxyUrl + targetUrl);
    if (!response.ok) {
        console.error("[health-concerns.js] Error fetching the page:", response.statusText);
        return null;
    }
    console.log("[health-concerns.js] got response:", response);
    const json = await response.json()
    console.log("[health-concerns.js] got json:", json);
    const text = json.contents;
    console.log("[health-concerns.js] got text:", text);
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    // find <a> with href like "https://www.sandiegocounty.gov/content/dam/sdc/hhsa/programs/phs/Epidemiology/south-region-gi-illness/Surveillance%20Bulletin%20South%20Region%20Health%20Concerns_04022025.pdf"
    const linkElement = doc.querySelector('a[href^="/content/dam/sdc/hhsa/programs/phs/Epidemiology/south-region-gi-illness/Surveillance%20Bulletin%20South%20Region%20Health%20Concerns_"]');
    console.log("[health-concerns.js] got county page info:", linkElement, "\n\ntext:", text, "\ndom:", doc);

    if (linkElement) {
        const pdfUrl = "https://www.sandiegocounty.gov" + linkElement.getAttribute('href');
        const pdfName = pdfUrl.split('/').pop();
        const dateString = pdfName.match(/_(\d{8})\.pdf/)[1];
        const pdfDate = new Date(
            parseInt(dateString.slice(4, 8)),
            parseInt(dateString.slice(0, 2)) - 1,
            parseInt(dateString.slice(2, 4))
        );
        healthConcernsInfo = { url: pdfUrl, date: pdfDate }
        return healthConcernsInfo;
    }
}

async function getHealthConcernsInfo() {
    const giveUpAfterMs = 10000;
    const startTime = Date.now();
    const interval = 1000;

    while (Date.now() - startTime < giveUpAfterMs) {
        if (healthConcernsInfo) {
            console.log("[health-concerns.js] got pdf info:", pdfInfo);
            return healthConcernsInfo;
        }
        await new Promise(resolve => setTimeout(resolve, interval));
    }

    console.error("[health-concerns.js] Timed out waiting for health concerns info.");
    return null;
}

// async function parsePdf(url) {
//     const response = await fetch(url);
//     const blob = await response.blob();
//     const pdfData = new Uint8Array(await blob.arrayBuffer());
//     const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
//     const numPages = pdf.numPages;
//     const textContent = [];
//     for (let i = 1; i <= numPages; i++) {
//         const page = await pdf.getPage(i);
//         const content = await page.getTextContent();
//         const textItems = content.items.map(item => item.str).join(' ');
//         textContent.push(textItems);
//     }
// }

getLatestPdf();