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
          "htmlTag",
        ],
        lookupQuerystring: "lang",
        lookupCookie: "i18next",
        lookupLocalStorage: "i18nextLng",
        caches: ["localStorage", "cookie"],
      },
      backend: {
        loadPath: "locales/{{lng}}.json",
      },
      interpolation: {
        escapeValue: false,
      },
    });
  window.i18next = i18next;

  // --- Apply translations AFTER init ---
  updateContent();
  // --- Fetch initial data AFTER i18next is ready ---
  fetchH2SData();
  fetchOdorData();
  fetchBeachData();
  fetchWastwaterData();

  // --- Optional: Language Switcher ---
  // (Keep existing language switcher code)
  // Example: Assuming you have a <select> with id="language-selector"
  // const selector = document.getElementById("language-selector");
  // if (selector) {
  //     // Set selector value to current language
  //     selector.value = i18next.language.split("-")[0]; // Use base language (e.g., 'en' from 'en-US')

  //     selector.addEventListener("change", (e) => {
  //         setLanguage(e.target.value);
  //     });
  // }
}

function updateContent() {
  console.log("[language.js] Updating content for language:", i18next.language);
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
    options['complaint_days'] = complaint_days;
    options['spill_days'] = spill_days;
    // Use innerHTML for keys that contain HTML tags (use data-i18n-html="true")
    if (element.dataset.i18nHtml === "true") {
      // Check specific attribute
      element.innerHTML = i18next.t(key, options);
    } else {
      element.textContent = i18next.t(key, options);
    }
  });

  document.querySelectorAll("[data-i18n-href]").forEach((element) => {
    const key = element.getAttribute("data-i18n-href");
    if (!i18next.exists(key)) {
      console.warn(
        `Translation key missing: ${key} for language ${i18next.language}`
      );
      return;
    }
    const options = JSON.parse(
      element.getAttribute("data-i18n-options") || "{}"
    );
    element.setAttribute("href", i18next.t(key, options));
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

  // Close any tooltips
  try {
    document.querySelectorAll(".mapbox-tooltip").forEach((element) => element.remove());
  } catch (e) {}

  // --- Update map ---
  setMapLanguage();
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
      updateContent();
    })
    .catch((err) => {
      console.error("[language.js] Error changing language:", err);
    });
}

document.addEventListener("DOMContentLoaded", async () => {
  // Initialize i18next (this will also trigger initial data fetch)
  await initializeI18next();

  // Setup the language selector
  const languageSelectors = document.querySelectorAll(".language-selector");
  const languageContainers = document.querySelectorAll(
    ".language-selector-container"
  );

  // Set the initial flag
  function updateFlag(languageCode) {
    languageContainers.forEach((container) => {
      const selector = container.querySelector(".language-selector");
      const selectedOption = Array.from(selector.options).find(
        (option) => option.value === languageCode
      );
      if (!selectedOption) {
        console.warn(
          `[language.js] No option found for language code: ${languageCode}`
        );
        return;
      }

      // just show the flag
      container.setAttribute(
        "data-flag",
        selectedOption.textContent.trim().split(" ")[0]
      );
    });
  }

  // Update the flag when the language changes
  languageSelectors.forEach((selector) =>
    selector.addEventListener("change", (event) => {
      setLanguage(event.target.value);
      updateFlag(event.target.value);
    })
  );

  // Show full language name when the select is focused (opened)
  languageSelectors.forEach((selector) =>
    selector.addEventListener("focus", (event) => {
      Array.from(event.target.options).forEach((option) => {
        const flag = option.textContent.trim().split(" ")[0];
        const language = option.getAttribute("data-language");
        option.textContent = `${flag} ${language}`;
        option.style.fontSize = ""; // Reset font size
        option.style.lineHeight = ""; // Reset line height
      });
    })
  );

  // Show only the flag when the select is blurred (closed)
  languageSelectors.forEach((selector) =>
    selector.addEventListener("blur", (event) => {
      Array.from(event.target.options).forEach((option) => {
        const flag = option.textContent.trim().split(" ")[0];
        option.textContent = flag;
      });
    })
  );

  // Set selectors to align with currently selected language
  const currentLanguage = window.i18next.language.split("-")[0];
  const defaultOption = languageSelectors[0].options[0];

  languageSelectors.forEach((selector) => {
    // Set the selected option
    const foundOption = Array.from(selector.options).find(
      (option) => option.value === currentLanguage
    );
    if (foundOption) {
      selector.value = foundOption.value;
      selector.selectedIndex = foundOption.index;
      updateFlag(foundOption.value);
    } else {
      selector.value = defaultOption.value;
      selector.selectedIndex = defaultOption.index;
      updateFlag(defaultOption.value);
    }
  });
});
