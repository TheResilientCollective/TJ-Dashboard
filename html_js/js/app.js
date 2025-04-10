
//const resilientUrlBase = 'https://oss.resilientservice.mooo.com/resilentpublic/'
const s3base = "https://oss.resilientservice.mooo.com/"
//const bucket = 'test'
const bucket = 'resilentpublic'
const resilientUrlBase = `${s3base}${bucket}/`



let latestH2SData = null;
let latestOdorData = null;
let latestBeachData = null;

// --- Date/Time Formatting Helpers ---
function formatDateTime(date, options) {
  // Use i18next's detected language for formatting
  const lang = i18next.language || "en"; // Fallback to 'en'
  try {
    return new Intl.DateTimeFormat(lang, options).format(date);
  } catch (e) {
    console.warn(`Error formatting date for lang "${lang}":`, e);
    // Fallback to simple formatting if Intl fails for any reason
    return date.toLocaleString();
  }
}

// --- H2S Rendering ---
function renderH2STable(jsonData) {
  latestH2SData = jsonData; // Store data
  window.latestH2SData = jsonData;

  let groupedData = _.groupBy(jsonData.data, "Site Name");
  groupedData = _.map(groupedData, (h2sArray) => {
    return _.orderBy(h2sArray, ["Date with time"], ["desc"]).slice(0, 3);
  });
  console.log("Grouped H2S Data: ", groupedData);

  const jsonDiv = document.querySelector("#h2s_summary tbody");
  if (!jsonDiv) return; // Exit if element not found
  jsonDiv.innerHTML = ""; // Clear old data

  groupedData.forEach((location) => {
    location.forEach((h2s) => {
      const rowElm = document.createElement("tr");
      rowElm.classList.add("card-data");
      const valueCell = document.createElement("td");
      const dateCell = document.createElement("td");
      const locationCell = document.createElement("td");
      rowElm.appendChild(valueCell);
      rowElm.appendChild(dateCell);
      rowElm.appendChild(locationCell);
      jsonDiv.appendChild(rowElm);

      // value (using i18next)
      const colorIndicatorElm = document.createElement("span");
      colorIndicatorElm.classList.add(
        "indicator",
        getIndicatorLevelForH2SValue(h2s["Result"])
      );
      const result = document.createElement("span");
      // Use i18next for the unit label
      result.innerText = i18next.t("sidebar.cards.h2s.valueUnit", {
        value: h2s["Result"]
      });
      valueCell.appendChild(colorIndicatorElm);
      valueCell.appendChild(result);

      // date (using Intl)
      const clockIcon = document.createElement("i");
      clockIcon.className = "bi bi-clock";
      const dateElm = document.createElement("span");
      let dateWithTime = dayjs(h2s["Date with time"]).toDate(); // Convert to JS Date for Intl
      // Format using Intl based on example 'ddd h A'
      const timeString = formatDateTime(dateWithTime, {
        weekday: "short",
        hour: "numeric",
        hour12: true
      });
      dateElm.innerText = timeString;
      dateCell.appendChild(clockIcon);
      dateCell.appendChild(dateElm);

      // location (assuming Site Name doesn't need translation)
      const locationIcon = document.createElement("i");
      locationIcon.className = "bi bi-geo-alt";
      const locationElm = document.createElement("span");
      locationElm.innerText = h2s["Site Name"];
      locationCell.appendChild(locationIcon);
      locationCell.appendChild(locationElm);
    });
    const rowBreakElm = document.createElement("tr");
    rowBreakElm.classList.add("row-break");
    jsonDiv.appendChild(rowBreakElm);
  });

  // update card footer (using Intl)
  const cardFooter = document.querySelector("#h2s-card .card-footer");
  if (cardFooter && jsonData.data.length > 0) {
    console.log("[app.js] Updating H2S card footer with latest data.");
    const span = cardFooter.querySelector("span");
    const lastDate = dayjs(
      jsonData['lastUpdated']
    ).toDate();
    const formattedDate = formatDateTime(lastDate, {
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
    console.log("[app.js] Last H2S data date:", lastDate, "Formatted:", formattedDate);
    span.innerText = i18next.t("sidebar.cards.h2s.footer.text", {
      date: formattedDate
    });
  }
}

// --- Odor Complaints Rendering ---
function renderOdorComplaints(jsonData) {
  console.log("[app.js] Rendering Odor Complaints with data:", jsonData);
  latestOdorData = jsonData; // Store data
  window.latestOdorData = jsonData;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  console.log("[app.js] Current date:", now, "Seven days ago:", sevenDaysAgo, "Fourteen days ago:", fourteenDaysAgo);

  let last7DaysData = _.filter(jsonData.data, (item) => {
    let itemDate = parseCustomDate(item.date);
    return itemDate >= sevenDaysAgo && itemDate <= now;
  });
  console.log("[app.js] Last 7 days data:", last7DaysData);

  last7DaysData = _.orderBy(
    last7DaysData,
    [(item) => parseCustomDate(item.date)],
    ["desc"]
  );

  let previous7DaysData = _.filter(jsonData.data, (item) => {
    let itemDate = parseCustomDate(item.date);
    return itemDate >= fourteenDaysAgo && itemDate < sevenDaysAgo;
  });
  console.log("[app.js] Previous 7 days data:", previous7DaysData);

  const sumLast7Days = _.sumBy(last7DaysData, "count");
  const sumPrevious7Days = _.sumBy(previous7DaysData, "count");
  console.log("[app.js] Sum of complaints in last 7 days:", sumLast7Days, "Previous 7 days:", sumPrevious7Days);

  const countSpan = document.getElementById("odor-complaint-count");
  const countIndicator = countSpan?.parentElement.querySelector(".indicator");
  if (countSpan && countIndicator) {
    countSpan.innerText = i18next.t(
      "sidebar.cards.odorComplaints.overview.count",
      {count: sumLast7Days}
    );
    countIndicator.className =
      "indicator " + getIndicatorLevelForOdorComplaints(sumLast7Days, 7);
    console.log("[app.js] Updated odor complaint count and indicator.");
  }

  const countComplaintsChange = sumLast7Days - sumPrevious7Days;
  console.log("[app.js] Change in complaints:", countComplaintsChange);

  const changeContainer = document.querySelector(
    "#odor-complaint-data-overview tr td:last-child"
  );
  if (changeContainer) {
    const changeSpan = changeContainer.querySelector("span");
    const changeIcon = changeContainer.querySelector("i");
    let trendKey = "sidebar.cards.odorComplaints.overview.trend";
    let trendClass = "trend-down";
    let iconClass = "bi-graph-up-arrow";

    if (countComplaintsChange === 0) {
      trendKey = "sidebar.cards.odorComplaints.overview.trend_same";
      trendClass = "trend-flat";
      iconClass = "";
    } else if (countComplaintsChange < 0) {
      trendClass = "trend-up";
      iconClass = "bi-graph-down-arrow";
    } else {
      trendKey = "sidebar.cards.odorComplaints.overview.trend_positive";
    }

    changeSpan.innerText = i18next.t(trendKey, {
      change: Math.abs(countComplaintsChange)
    });
    changeIcon.className = `bi ${iconClass}`;
    changeSpan.className = trendClass;
    console.log("[app.js] Updated trend indicator with key:", trendKey);
  }

  const jsonDiv = document.querySelector("#odor-complaint-data tbody");
  if (!jsonDiv) {
    console.warn("[app.js] Odor complaint data table not found.");
    return;
  }
  jsonDiv.innerHTML = "";

  last7DaysData.forEach((obj) => {
    console.log("[app.js] Adding row for odor complaint:", obj);
    const rowElm = document.createElement("tr");
    rowElm.classList.add("card-data");
    const dateCell = document.createElement("td");
    const countCell = document.createElement("td");
    rowElm.appendChild(dateCell);
    rowElm.appendChild(countCell);
    jsonDiv.appendChild(rowElm);

    const dateIcon = document.createElement("i");
    dateIcon.className = "bi bi-clock";
    const dateElm = document.createElement("span");
    let date = parseCustomDate(obj["date"]);
    const dateString = formatDateTime(date, {
      month: "short",
      day: "numeric"
    });
    dateElm.innerText = ` ${dateString}`;
    dateCell.appendChild(dateIcon);
    dateCell.appendChild(dateElm);

    const countIndicatorElm = document.createElement("span");
    const countSpan = document.createElement("span");
    countIndicatorElm.className =
      "indicator " + getIndicatorLevelForOdorComplaints(obj["count"]);
    countSpan.innerText = i18next.t(
      "sidebar.cards.odorComplaints.dailyCount",
      {count: obj["count"]}
    );
    countCell.appendChild(countIndicatorElm);
    countCell.appendChild(countSpan);
  });

  const cardFooter = document.querySelector(
    "#odor-complaints-card .card-footer"
  );
  if (cardFooter && jsonData.data.length > 0) {
    const span = cardFooter.querySelector("span");
    // const latestDateEntry = _.orderBy(
    //     jsonData,
    //     [(item) => parseCustomDate(item.date)],
    //     ["desc"]
    // )[0];

    // if (latestDateEntry) {
    //     const latestDate = parseCustomDate(latestDateEntry.date);
    //     const formattedDate = formatDateTime(latestDate, {
    //         month: "long",
    //         day: "numeric"
    //     });
    //     span.innerText = i18next.t(
    //         "sidebar.cards.odorComplaints.footer.text",
    //         { date: formattedDate }
    //     );
    //     console.log("[app.js] Updated odor complaints footer with date:", formattedDate);
    // }
    const lastUpdated = jsonData['lastUpdated']
    if (lastUpdated) {
      latestDate = dayjs(
        jsonData['lastUpdated']
      ).toDate()
      const formattedDate = formatDateTime(latestDate, {
        month: "long",
        day: "numeric"
      });
      span.innerText = i18next.t(
        "sidebar.cards.odorComplaints.footer.text",
        {date: formattedDate}
      );
      console.log("[app.js] Updated odor complaints footer with date:", formattedDate);
    }
  }
}

// --- Beach Closures Rendering ---
function renderBeachClosures(jsonData) {
  latestBeachData = jsonData; // Store data
  // const lastrendered= jsonData['lastUpdated']
  window.latestBeachData = jsonData;

  const countClosures = jsonData.data.length;
  // TODO: Calculate change from last week - requires historical data or assumptions
  const countClosuresChange = 0; // Placeholder

  // update high level text (using i18next)
  const countSpan = document.getElementById("beach-closure-count");
  const countIndicator = countSpan?.parentElement.querySelector(".indicator");
  if (countSpan && countIndicator) {
    // Use i18next pluralization
    countSpan.innerText = i18next.t(
      "sidebar.cards.beachClosures.overview.count",
      {count: countClosures}
    );
    countIndicator.className =
      "indicator " + getIndicatorLevelForBeachClosures(countClosures); // Reset classes
  }

  const changeContainer = document.querySelector(
    "#beach-closure-data-overview tr td:last-child"
  );
  if (changeContainer) {
    const changeSpan = changeContainer.querySelector("span");
    const changeIcon = changeContainer.querySelector("i");
    let trendKey = "sidebar.cards.beachClosures.overview.trend";
    let trendClass = "trend-down"; // More closures = worse trend
    let iconClass = "bi-graph-up-arrow"; // Arrow up for increase

    if (countClosuresChange === 0) {
      trendKey = "sidebar.cards.beachClosures.overview.trend_same";
      trendClass = "trend-flat";
      iconClass = "";
    } else if (countClosuresChange < 0) {
      trendClass = "trend-up"; // Fewer closures = good trend
      iconClass = "bi-graph-down-arrow";
    } else {
      trendKey = "sidebar.cards.beachClosures.overview.trend_positive";
    }

    changeSpan.innerText = i18next.t(trendKey, {
      change: Math.abs(countClosuresChange)
    });
    changeIcon.className = `bi ${iconClass}`; // Reset classes
    changeSpan.className = trendClass; // Reset classes
  }

  // clear old data and build new table (using i18next)
  const jsonDiv = document.querySelector("#beach-closure-data tbody");
  if (!jsonDiv) return;
  jsonDiv.innerHTML = "";

  jsonData.data.forEach((obj) => {
    const name = obj["Name"];
    console.log("[app.js] Beach closure entry:", obj);
    // Assuming name doesn't need translation, but cleaning it up
    const humanReadableName = name
      .replace(/\([A-Z]{2}\-[0-9]+\)/g, "")
      .split(" - ")[0]
      .trim();

    const rowElm = document.createElement("tr");
    const beachNameCell = document.createElement("td");
    const beachStatusCell = document.createElement("td");
    rowElm.appendChild(beachNameCell);
    rowElm.appendChild(beachStatusCell);
    jsonDiv.appendChild(rowElm);

    // beach name
    const locationIcon = document.createElement("i");
    locationIcon.className = "bi bi-geo-alt";
    const beachNameElm = document.createElement("span");
    beachNameElm.innerText = ` ${humanReadableName}`; // Add space
    beachNameCell.appendChild(locationIcon);
    beachNameCell.appendChild(beachNameElm);

    // beach status (using i18next)
    const statusIcon = document.createElement("span");
    // Assuming 'Red' color means moderate/closed indicator
    const status =
    statusIcon.className = `indicator ${
        getIndicatorLevelForBeach(parseBeachData(obj).beachStatus)
    }`; // Example mapping
    const beachStatusElm = document.createElement("span");
    // Use i18next for the status text
    beachStatusElm.innerText = i18next.t(
      "sidebar.cards.beachClosures.status.closed"
    );
    beachStatusCell.appendChild(statusIcon);
    beachStatusCell.appendChild(beachStatusElm);
  });

  // update card footer (using Intl, assuming a Date field exists)
  const cardFooter = document.querySelector(
    "#beach-closures-card .card-footer"
  );
  if (cardFooter && jsonData.data.length > 0) {
    const span = cardFooter.querySelector("span");
    // Attempt to find a date - assuming the *first* item might have a relevant update date if available
    // NOTE: The provided JSON sample doesn't have a date. Add one if available from the source.
    let updateDate = null;
    if (jsonData['lastUpdated']) {
      // Check if a 'Date' field exists
      updateDate = dayjs(jsonData['lastUpdated']).toDate(); // Convert to JS Date
    } else {
      updateDate = new Date(); // Fallback to now if no date is in the data
    }
    const formattedDate = formatDateTime(updateDate, {
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
    // Use i18next for the "Updated" text
    span.innerText = i18next.t("sidebar.cards.beachClosures.footer.text", {
      date: formattedDate
    });
  }
}

// --- Fetch Functions (Modified to call renderers) ---
function fetchH2SData() {
  fetch(
    `${resilientUrlBase}tijuana/sd_apcd_air/output/hs2_lastday.records.json`
  )
    .then((response) =>
      response.ok ? response.json() : Promise.reject(response.statusText)
    )
    .then((jsonData) => {
      renderH2STable(jsonData);
    })
    .catch((error) => {
      console.error("Error fetching H2S JSON:", error);
      document.querySelector("#h2s-card").remove();
    });
}

function fetchOdorData() {
  fetch(
    `${resilientUrlBase}tijuana/sd_complaints/output/complaints_by_date.json`
  )
    .then((response) =>
      response.ok ? response.json() : Promise.reject(response.statusText)
    )
    .then((jsonData) => {
      renderOdorComplaints(jsonData);
    })
    .catch((error) => {
      console.error("Error fetching Odor Complaints JSON:", error);
      document.querySelector("#odor-complaints-card").remove();
    });
}

function fetchBeachData() {
  fetch(
    `${resilientUrlBase}tijuana/beachwatch/output/current/sdbeachinfo_status_simple.json`
  )
    .then((response) =>
      response.ok ? response.json() : Promise.reject(response.statusText)
    )
    .then((jsonData) => {
      renderBeachClosures(jsonData);
    })
    .catch((error) => {
      console.error("Error fetching Beach Closures JSON:", error);
      document.querySelector("#beach-closures-card").remove();
    });
}

function getIndicatorLevelForOdorComplaints(count, accumulatedOverDays = 1) {
  // FIXME: Tommy just made up these numbers
  if (count < 3 * accumulatedOverDays) {
    return "low";
  } else if (count < 7 * accumulatedOverDays) {
    return "moderate";
  } else {
    return "high";
  }
}

function getIndicatorLevelForBeachClosures(count) {
  if (count < 5) {
    return "low";
  } else if (count < 10) {
    return "moderate";
  } else {
    return "high";
  }
}

function getIndicatorLevelForBeach(beachStatus) {
    if (beachStatus == "Closure")
        return "beach-closure";
    else if (beachStatus === "Open")
        return "beach-open";
    else if (beachStatus === "Warning")
        return "beach-warning"
    else if (beachStatus === "Advisory")
        return "beach-advisory";
    else if (beachStatus === "Outfall")
        return "beach-outfall";
    else
        return "indeterminate";
}

function getIndicatorLevelForH2SRating(rating) {
  // Use lowercase for consistency
  switch (
    rating?.toLowerCase() // Add null check
    ) {
    case "orange":
      return "orange";
    case "yellow":
      return "yellow";
    case "green":
      return "green";
    case "purple":
      return "purple";
    default:
      return "white"; // Default or unknown
  }
}

function getIndicatorLevelForH2SValue(value) {
    if (value < 5)
        return "green";
    else if (value < 30)
        return "yellow";
    else if (value < 27000)
        return "orange";
    else
        return "purple";
}

function parseCustomDate(dateStr) {
  // Split the string into parts: [year, day, month]
  let [year, month, day] = dateStr.split('-').map(Number);
  // Note: in JavaScript, months are 0-indexed (0 = January)
  return new Date(year, month - 1, day);
}
