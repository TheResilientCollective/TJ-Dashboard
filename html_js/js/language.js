// --- i18next Initialization ---
async function initializeI18next() {
    await i18next
        .use(i18nextHttpBackend)
        .use(i18nextBrowserLanguageDetector)
        .init({
            debug: true,
            fallbackLng: "en",
            detection: {
                order: [
                    "querystring",
                    "cookie",
                    "localStorage",
                    "sessionStorage",
                    "navigator",
                    "htmlTag"
                ],
                lookupQuerystring: "lang",
                lookupCookie: "i18next",
                lookupLocalStorage: "i18nextLng",
                caches: ["localStorage", "cookie"]
            },
            backend: {
                loadPath: "locales/{{lng}}.json"
            },
            interpolation: {
                escapeValue: false
            }
        });

    // --- Apply translations AFTER init ---
    updateContent();
    // --- Fetch initial data AFTER i18next is ready ---
    fetchH2SData();
    fetchOdorData();
    fetchBeachData();

    // --- Optional: Language Switcher ---
    // (Keep existing language switcher code)
    // Example: Assuming you have a <select> with id="language-selector"
    const selector = document.getElementById("language-selector");
    if (selector) {
        // Set selector value to current language
        selector.value = i18next.language.split("-")[0]; // Use base language (e.g., 'en' from 'en-US')

        selector.addEventListener("change", (e) => {
            setLanguage(e.target.value);
        });
    }
}

function updateContent() {
    console.log(
        "[language.js] Updating content for language:",
        i18next.language
    );
    // Translate all elements with data-i18n attribute
    document.querySelectorAll("[data-i18n]").forEach((element) => {
        const key = element.getAttribute("data-i18n");
        // Basic check if key exists - prevents errors if JSON is incomplete during dev
        if (!i18next.exists(key)) {
            console.warn(
                `Translation key missing: ${key} for language ${i18next.language}`
            );
            // Optionally set default text or leave as is
            // element.textContent = key; // Show the key itself if missing
            return;
        }

        const options = JSON.parse(
            element.getAttribute("data-i18n-options") || "{}"
        );
        // Use innerHTML for keys that contain HTML tags (use data-i18n-html="true")
        if (element.dataset.i18nHtml === "true") {
            // Check specific attribute
            element.innerHTML = i18next.t(key, options);
        } else {
            element.textContent = i18next.t(key, options);
        }
    });

    // --- Re-render dynamic data sections using stored data ---
    // Check if data exists before trying to render
    if (typeof renderH2STable === "function" && window.latestH2SData) {
        console.log("[language.js] Re-rendering H2S Table");
        renderH2STable(window.latestH2SData);
    }
    if (typeof renderOdorComplaints === "function" && window.latestOdorData) {
        console.log("[language.js] Re-rendering Odor Complaints");
        renderOdorComplaints(window.latestOdorData);
    }
    if (typeof renderBeachClosures === "function" && window.latestBeachData) {
        console.log("[language.js] Re-rendering Beach Closures");
        renderBeachClosures(window.latestBeachData);
    }

    // --- Update map elements (if applicable) ---
    // updateMapElements(); // Example function call
}

/**
 * Sets the language in response to user action.
 * @param {string} lang - The language code (e.g., 'en', 'es')
 */
function setLanguage(lang) {
    console.log("[language.js] Setting language to:", lang);
    i18next
        .changeLanguage(lang)
        .then(() => {
            console.log("[language.js] Language changed to:", i18next.language);
            // Update the HTML lang attribute
            document.documentElement.lang = i18next.language;
            document.documentElement.dir = i18next.dir(i18next.language); // Set text direction (ltr/rtl)
            updateContent(); // Re-render all content
           setMapLanguage()
        })
        .catch((err) => {
            console.error("[language.js] Error changing language:", err);
        });
}

// Initialize i18next (this will also trigger initial data fetch)
initializeI18next();

// Setup the language selector
const languageSelector = document.querySelectorAll(".language-selector");
const languageContainer = document.querySelectorAll(".language-selector-container");

// Set the initial flag
const updateFlag = () => {
    const selectedOption = languageSelector.forEach(selector => selector.options[languageSelector.selectedIndex]);
    languageContainer.forEach(container => container.setAttribute("data-flag", selectedOption.textContent.trim().split(" ")[0]));
};

// Update the flag when the language changes
languageSelector.forEach(selector => selector.addEventListener("change", (event) => {
    setLanguage(event.target.value); // Call the existing setLanguage function
    updateFlag();
}));

// Show full language name when the select is focused (opened)
languageSelector.forEach(selector => selector.addEventListener("focus", (event) => {
    Array.from(event.target.options).forEach((option) => {
        const flag = option.textContent.trim().split(" ")[0];
        const language = option.getAttribute("data-language");
        option.textContent = `${flag} ${language}`;
        option.style.fontSize = ""; // Reset font size
        option.style.lineHeight = ""; // Reset line height
    });
}));

// Show only the flag when the select is blurred (closed)
languageSelector.forEach(selector => selector.addEventListener("blur", (event) => {
    Array.from(event.target.options).forEach((option) => {
        const flag = option.textContent.trim().split(" ")[0];
        option.textContent = flag;
    });
}));

// Initialize the flag
updateFlag();
