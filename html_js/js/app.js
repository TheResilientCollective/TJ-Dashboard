//const resilientUrlBase = 'https://oss.resilientservice.mooo.com/resilentpublic/'
const s3base = "https://oss.resilientservice.mooo.com/";
//const bucket = 'test'
const bucket = "resilentpublic";
const resilientUrlBase = `${s3base}${bucket}/`;

let latestH2SData = null;
let latestOdorData = null;
let latestBeachData = null;

// --- Drinking Water Advisories (American Water) ---
// Source of truth: the ArcGIS MapServer behind awgis.amwater.com/CustomerAdvisoryMap
const amWaterAdvisoryBase =
  "https://utility.arcgis.com/usrsvcs/servers/482bbe2135c54d178ec406189303faf4" +
  "/rest/services/CustomerAdvisoryMap/DisplayData_SDE/MapServer";

// Layer 17 is emergency advisories (main breaks, boil water notices, emergency
// repairs), 16 is general notices (planned work). Layer 15 holds advisories that
// have already been lifted, so it is not shown.
const amWaterAdvisoryLayers = {
  17: { level: "emergency", indicator: "high" },
  16: { level: "general", indicator: "moderate" },
};

// South Bay / Tijuana River Valley area of interest [west, south, east, north].
// Covers Imperial Beach, Coronado, San Ysidro, Nestor, Otay Mesa and south Chula
// Vista. An advisory counts as "in the region" when its footprint overlaps this.
const waterAdvisoryAoi = [-117.25, 32.5, -116.9, 32.68];

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
        value: h2s["Result"],
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
        hour12: true,
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
    const lastDate = dayjs(jsonData["lastUpdated"]).toDate();
    const formattedDate = formatDateTime(lastDate, {
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    console.log(
      "[app.js] Last H2S data date:",
      lastDate,
      "Formatted:",
      formattedDate
    );
    span.innerText = i18next.t("sidebar.cards.h2s.footer.text", {
      date: formattedDate,
    });
  }
}

// --- Odor Complaints Rendering ---
function renderOdorComplaints(geoData) {
  console.log("[app.js] Rendering Odor Complaints with data:", geoData.features);
  window.latestOdorData = geoData;

  const now = new Date();
  const latestDate = window.complaint_timeframe.latestDate;
  const mostRecentSampleTime = window.complaint_timeframe.getMostRecentSampleTime();
  const secondMostRecentSampleTime = window.complaint_timeframe.getSecondMostRecentSampleTime();

  console.log(
    "[app.js] Current date:",
    now,
    "Seven days ago:",
    mostRecentSampleTime,
    "Fourteen days ago:",
    secondMostRecentSampleTime
  );

  let mostRecentData = geoData.features.filter((item) => {
      let itemDate =  item.properties.date_received
      return itemDate >= mostRecentSampleTime.getTime()
  });
  console.log("[app.js] Last 7 days data:", mostRecentData);

  mostRecentData = _.orderBy(
    mostRecentData,
    [(item) => item.properties.date_received],
    ["desc"]
  );

  let secondMostRecentData = geoData.features.filter((item) => {
      let itemDate =  item.properties.date_received
      return itemDate >= secondMostRecentSampleTime.getTime() && itemDate < mostRecentSampleTime.getTime()
  });
  console.log("[app.js] Previous 7 days data:", secondMostRecentData);

  const sumMostRecent = mostRecentData.length;
  const sumSecondMostRecent = secondMostRecentData.length;
  console.log(
    "[app.js] Sum of complaints in last 7 days:",
    sumMostRecent,
    "Previous 7 days:",
    sumSecondMostRecent
  );

  const countSpan = document.getElementById("odor-complaint-count");
  const countIndicator = countSpan?.parentElement.querySelector(".indicator");
  if (countSpan && countIndicator) {
    countSpan.innerText = i18next.t(
      "sidebar.cards.odorComplaints.overview.count",
      { count: sumMostRecent }
    );
    countIndicator.className =
      "indicator " + getIndicatorLevelForOdorComplaints(sumMostRecent, window.complaint_days);
    console.log("[app.js] Updated odor complaint count and indicator.", countSpan.innerText, sumMostRecent);
  }

  const countComplaintsChange = sumMostRecent - sumSecondMostRecent;
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
      change: Math.abs(countComplaintsChange),
    });
    changeIcon.className = `bi ${iconClass}`;
    changeSpan.className = trendClass;
    console.log("[app.js] Updated trend indicator with key:", trendKey);
  }

  // Table label with date range
  const tableLabel = document.querySelector("[data-i18n='sidebar.cards.odorComplaints.tableLabel']");
  if (tableLabel) {
    tableLabel.innerText = i18next.t("sidebar.cards.odorComplaints.tableLabel", {
      start_date: mostRecentSampleTime.toLocaleDateString(i18next.language || "en", { month: 'short', day: 'numeric' }),
      end_date: latestDate.toLocaleDateString(i18next.language || "en", { month: 'short', day: 'numeric' }),
      complaint_days: window.complaint_days
    });
  }

  // clear old data from table
  const jsonDiv = document.querySelector("#odor-complaint-data tbody");
  if (!jsonDiv) {
    console.warn("[app.js] Odor complaint data table not found.");
    return;
  }
  jsonDiv.innerHTML = "";

  const mostRecentDataByDay = _.groupBy(mostRecentData, (item) => {
    const date = new Date(item.properties.date_received);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  });
  console.log("[app.js] Grouped odor complaints by day:", mostRecentDataByDay);

  // build table rows
  for (const day in mostRecentDataByDay) {
    console.log("[app.js] Adding row for odor complaint:", day, "with", mostRecentDataByDay[day].length, "complaints");
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
    let date = new Date(mostRecentDataByDay[day][0].properties.date_received);
    const dateString = formatDateTime(date, {
      month: "short",
      day: "numeric",
    });
    dateElm.innerText = ` ${dateString}`;
    dateCell.appendChild(dateIcon);
    dateCell.appendChild(dateElm);

    const countIndicatorElm = document.createElement("span");
    const countSpan = document.createElement("span");
    countIndicatorElm.className =
      "indicator " + getIndicatorLevelForOdorComplaints(mostRecentDataByDay[day].length);
    countSpan.innerText = i18next.t("sidebar.cards.odorComplaints.dailyCount", {
      count: mostRecentDataByDay[day].length
    });
    countCell.appendChild(countIndicatorElm);
    countCell.appendChild(countSpan);
  }

  const cardFooter = document.querySelector(
    "#odor-complaints-card .card-footer"
  );
  if (cardFooter && mostRecentData.length > 0) {
    console.log("[app.js] Updating odor complaints footer with latest date.", geoData.lastUpdated, "converted to", latestDate);
    const span = cardFooter.querySelector("span");
    const formattedDate = formatDateTime(latestDate, {
      month: "long",
      day: "numeric",
      hour: "numeric",
      hour12: true,
    });
    span.innerText = i18next.t("sidebar.cards.odorComplaints.footer.text", {
      date: formattedDate,
    });
    console.log(
      "[app.js] Updated odor complaints footer with date:",
      formattedDate
    );
  }
}

function renderWastewaterFlows(data) {
  console.log("[app.js] (Spills) Rendering Wastewater Flows with data:", data);
  window.latestWastewaterData = data;

  const now = new Date();
  const latestDate = window.spill_timeframe.latestDate;
  const mostRecentSampleTime = window.spill_timeframe.getMostRecentSampleTime()
  const secondMostRecentSampleTime = window.spill_timeframe.getSecondMostRecentSampleTime();

  console.log(
    "[app.js] (Spills) Current date:",
    now,
    "most recent sample:",
    mostRecentSampleTime,
    "second most recent sample:",
    secondMostRecentSampleTime
  );

  let mostRecentData = data.features.filter((item) => {
      let itemDate = new Date(item.properties["End Time"]);
      return itemDate.getTime() >= mostRecentSampleTime.getTime()
  });
  console.log(`[app.js] (Spills) Last ${window.spill_days} days data:`, mostRecentData);

  mostRecentData = _.orderBy(
    mostRecentData,
    [(item) => new Date(item.properties["Start Time"]).getTime()],
    ["desc"]
  );

  let secondMostRecentData = data.features.filter((item) => {
      let itemDate = new Date(item.properties["End Time"]);
      return itemDate.getTime() >= secondMostRecentSampleTime.getTime() && itemDate.getTime() < mostRecentSampleTime.getTime()
  });
  console.log(`[app.js] (Spills) Previous ${window.spill_days} days data:`, secondMostRecentData);

  const sumMostRecent = mostRecentData.length;
  const sumSecondMostRecent = secondMostRecentData.length;
  console.log(
    `[app.js] (Spills) Sum of spills in last ${window.spill_days} days:`,
    sumMostRecent,
    `Previous ${window.spill_days} days:`,
    sumSecondMostRecent
  );

  const countSpan = document.getElementById("spills-count");
  const countIndicator = countSpan?.parentElement.querySelector(".indicator");
  if (countSpan && countIndicator) {
    countSpan.innerText = i18next.t(
      "sidebar.cards.wastewater.overview.count",
      { count: sumMostRecent }
    );
    countIndicator.className =
      "indicator " + (sumMostRecent > 0 ? "high" : "low");
    console.log("[app.js] (Spills) Updated spills count and indicator.", countSpan.innerText, sumMostRecent);
  }

  const countSpillsChange = sumMostRecent - sumSecondMostRecent;
  console.log("[app.js] (Spills) Change in spills:", countSpillsChange);

  const changeContainer = document.querySelector(
    "#wastewater-data-overview tr td:last-child"
  );
  if (changeContainer) {
    const changeSpan = changeContainer.querySelector("span");
    const changeIcon = changeContainer.querySelector("i");
    let trendKey = "sidebar.cards.wastewater.overview.trend";
    let trendClass = "trend-down";
    let iconClass = "bi-graph-up-arrow";

    if (countSpillsChange === 0) {
      trendKey = "sidebar.cards.wastewater.overview.trend_same";
      trendClass = "trend-flat";
      iconClass = "";
    } else if (countSpillsChange < 0) {
      trendClass = "trend-up";
      iconClass = "bi-graph-down-arrow";
    } else {
      trendKey = "sidebar.cards.wastewater.overview.trend_positive";
    }

    changeSpan.innerText = i18next.t(trendKey, {
      change: Math.abs(countSpillsChange),
      spill_days: window.spill_days
    });
    changeIcon.className = `bi ${iconClass}`;
    changeSpan.className = trendClass;
    console.log("[app.js] (Spills) Updated trend indicator with key:", trendKey);
  }

  const tableLabel = document.querySelector("[data-i18n='sidebar.cards.wastewater.tableLabel']");
  if (tableLabel) {
    tableLabel.innerText = i18next.t("sidebar.cards.wastewater.tableLabel", {
      start_date: mostRecentSampleTime.toLocaleDateString(i18next.language || "en", { month: 'short', day: 'numeric' }),
      end_date: latestDate.toLocaleDateString(i18next.language || "en", { month: 'short', day: 'numeric' }),
      spill_days: window.spill_days
    });
  }

  // Table
  const jsonDiv = document.querySelector("#wastewater-data tbody");
  if (!jsonDiv) {
    console.warn("[app.js] (Spills) Wastewater data table not found.");
    return;
  }
  jsonDiv.innerHTML = "";
  console.log("[app.js] (Spills) Clearing old data and building new table.", jsonDiv);
  console.log("[app.js] (Spills) Most recent data:", mostRecentData);

  for (const spill of mostRecentData) {
    console.log("[app.js] (Spills) Adding spill entry:", spill);
    const startTime = new Date(spill.properties["Start Time"]);
    const endTime = new Date(spill.properties["End Time"]);
    const singleDayEvent = startTime.toDateString() === endTime.toDateString();
    const dateRange = singleDayEvent ? formatDateTime(startTime) : `${formatDateTime(startTime)} to ${formatDateTime(endTime)}`;
    const volume = spill.properties["Approximate Discharge Volume"];
    const notes = spill.properties["Notes"];

    const template = `
      <tr class="card-data">
        <td><img src="img/marker-spill-outline.svg"><span>${volume}</span></td>
        <td><i class="bi bi-clock"></i><span>${dateRange}</span></td>
      </tr>`;
    const rowElm = new DOMParser().parseFromString(template, "text/html").body.firstChild;

    // jsonDiv.appendChild(rowElm);
    jsonDiv.innerHTML += template;
    console.log("[app.js] (Spills) Added spill entry:", { startTime, endTime, volume, notes }, jsonDiv.lastChild);
  }
  if (mostRecentData.length === 0 ){
    document.querySelector("#no-wastewater-flows").classList.remove("hidden");
    console.log("[app.js] (Spills) No data found.");
  }
  const cardFooter = document.querySelector(
    "#wastewater-card .card-footer"
  );
  if (cardFooter) {
    console.log("[app.js] (Spills) Updating wastewater footer with latest date.", data.lastUpdated, "converted to", latestDate);
    const span = cardFooter.querySelector("span");
    const formattedDate = formatDateTime(latestDate, {
      month: "long",
      day: "numeric",
      hour: "numeric",
      hour12: true,
    });
    span.innerText = i18next.t("sidebar.cards.wastewater.footer.text", {
      date: formattedDate,
    });
    console.log(
      "[app.js] (Spills) Updated wastewater footer with date:",
      formattedDate
    );
  }

}

// --- Drinking Water Advisory Rendering ---

// Advisories arrive as one feature per polygon, so several features can share an
// EventID. Merge them into one entry per event, keeping the combined footprint.
function groupWaterAdvisories(geoData) {
  const byEvent = new Map();

  for (const feature of geoData.features) {
    const props = feature.properties;
    const key = `${props.advisoryLevel}|${props.EventID}`;
    let advisory = byEvent.get(key);
    if (!advisory) {
      advisory = {
        id: props.EventID,
        level: props.advisoryLevel,
        indicator: props.advisoryLevel === "emergency" ? "high" : "moderate",
        type: props.EventType || "Advisory",
        place: parseAdvisoryPlace(props),
        start: props.EventStartDate || 0,
        expires: props.EventExpirationDate || 0,
        message: props.EventMessage || props.EventHeader || "",
        link: props.EventHyperlink || "",
        bbox: [180, 90, -180, -90],
      };
      byEvent.set(key, advisory);
    }
    growAdvisoryBbox(advisory.bbox, feature.geometry);
  }

  return [...byEvent.values()];
}

function growAdvisoryBbox(bbox, geometry) {
  const walk = (coords) => {
    if (Array.isArray(coords[0])) {
      coords.forEach(walk);
      return;
    }
    bbox[0] = Math.min(bbox[0], coords[0]);
    bbox[1] = Math.min(bbox[1], coords[1]);
    bbox[2] = Math.max(bbox[2], coords[0]);
    bbox[3] = Math.max(bbox[3], coords[1]);
  };
  if (geometry) walk(geometry.coordinates);
  return bbox;
}

// Bounding-box overlap against the area of interest. Coarser than a true polygon
// intersection, but it errs toward showing an advisory rather than hiding one.
function bboxOverlapsAoi(bbox) {
  const [west, south, east, north] = bbox;
  if (west > east) return false; // no geometry came back for this event
  const [aoiWest, aoiSouth, aoiEast, aoiNorth] = waterAdvisoryAoi;
  return (
    west <= aoiEast &&
    east >= aoiWest &&
    south <= aoiNorth &&
    north >= aoiSouth
  );
}

// A boil order changes what residents should do with their tap, so it is called
// out separately from other emergencies. "Lifted" types are the all-clear.
function isBoilWaterAdvisory(advisory) {
  return /boil/i.test(advisory.type) && !/lifted/i.test(advisory.type);
}

// The utility publishes event types in English only. Translate the ones the
// service actually uses and fall back to the raw value for anything new.
function translateAdvisoryType(type) {
  if (!type) return "";
  const key = `sidebar.cards.waterAdvisory.eventTypes.${type.replace(
    /[^a-zA-Z0-9]/g,
    ""
  )}`;
  return window.i18next.t(key, { defaultValue: type });
}

// "Imperial Beach: Main Break : This is an urgent..." -> "Imperial Beach"
function parseAdvisoryPlace(props) {
  const header = (props.EventHeader || "").trim();
  const head = header.split(/\s*:\s*/)[0] || "";
  return (head.split(",")[0] || "").trim() || `Event ${props.EventID}`;
}

// The service is queried statewide, so trim the map layer down to the footprints
// that actually reach the region before handing them to Mapbox.
function regionalAdvisoryFeatures(geoData) {
  return {
    type: "FeatureCollection",
    features: geoData.features.filter((feature) =>
      bboxOverlapsAoi(growAdvisoryBbox([180, 90, -180, -90], feature.geometry))
    ),
  };
}

function renderWaterAdvisory(geoData) {
  window.latestWaterAdvisoryData = geoData;

  const card = document.querySelector("#water-advisory-card");
  if (!card) return;

  const advisories = groupWaterAdvisories(geoData)
    .filter((advisory) => bboxOverlapsAoi(advisory.bbox))
    .sort((a, b) => {
      // Boil orders first, then other emergencies, then most recently started.
      const boilA = isBoilWaterAdvisory(a);
      const boilB = isBoilWaterAdvisory(b);
      if (boilA !== boilB) return boilA ? -1 : 1;
      if (a.level !== b.level) return a.level === "emergency" ? -1 : 1;
      return b.start - a.start;
    });
  console.log("[app.js] (Water) Advisories in the region:", advisories);

  const hasBoilWater = advisories.some(isBoilWaterAdvisory);
  const hasEmergency = advisories.some((a) => a.level === "emergency");

  // Boil orders outrank everything else, since they tell residents to stop
  // drinking the tap water.
  const alertKind = hasBoilWater
    ? "boilWater"
    : hasEmergency
    ? "emergency"
    : "general";

  // Push the matching footprints to the map, whether or not the map is ready yet.
  window.latestWaterAdvisoryRegional = regionalAdvisoryFeatures(geoData);
  if (typeof syncWaterAdvisoryLayer === "function") syncWaterAdvisoryLayer();

  // Overview line
  const countSpan = document.getElementById("water-advisory-count");
  const countIndicator = countSpan?.parentElement.querySelector(".indicator");
  if (countSpan && countIndicator) {
    countSpan.innerText = advisories.length
      ? i18next.t("sidebar.cards.waterAdvisory.overview.count", {
          count: advisories.length,
        })
      : i18next.t("sidebar.cards.waterAdvisory.overview.none");
    countIndicator.className =
      "indicator " +
      (advisories.length
        ? alertKind === "general"
          ? "moderate"
          : "high"
        : "low");
  }

  // Alert banner. Only shown when something is actually active in the region, and
  // it opens the card so residents do not have to expand it to find the notice.
  const alertElm = document.getElementById("water-advisory-alert");
  if (alertElm) {
    alertElm.hidden = advisories.length === 0;
    if (advisories.length) {
      // Keep always-expand so the alert stays visible even when the card is collapsed.
      // Boil orders reuse the emergency styling.
      alertElm.className = `water-advisory-alert always-expand ${
        alertKind === "general" ? "general" : "emergency"
      }`;
      alertElm.querySelector(".water-advisory-alert-title").innerText =
        i18next.t(`sidebar.cards.waterAdvisory.alert.${alertKind}Title`, {
          count: advisories.length,
        });
      alertElm.querySelector(".water-advisory-alert-body").innerText = i18next.t(
        `sidebar.cards.waterAdvisory.alert.${alertKind}Body`
      );
      card.classList.add("expanded");
    }
  }

  // Detail table, one row per advisory in the region
  const tableWrapper = document.getElementById("water-advisory-data");
  const tbody = tableWrapper?.querySelector("tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  tableWrapper.hidden = advisories.length === 0;

  for (const advisory of advisories) {
    const rowElm = document.createElement("tr");
    rowElm.classList.add("card-data");
    const placeCell = document.createElement("td");
    const whenCell = document.createElement("td");
    rowElm.appendChild(placeCell);
    rowElm.appendChild(whenCell);
    tbody.appendChild(rowElm);

    const statusIndicator = document.createElement("span");
    statusIndicator.className = `indicator ${advisory.indicator}`;
    const placeElm = document.createElement("span");
    placeElm.innerText = ` ${advisory.place}`;
    placeCell.appendChild(statusIndicator);
    placeCell.appendChild(placeElm);

    const clockIcon = document.createElement("i");
    clockIcon.className = "bi bi-clock";
    const whenElm = document.createElement("span");
    whenElm.innerText = ` ${translateAdvisoryType(
      advisory.type
    )} · ${formatDateTime(new Date(advisory.start), {
      month: "short",
      day: "numeric",
    })}`;
    whenCell.appendChild(clockIcon);
    whenCell.appendChild(whenElm);

    // Clicking a row frames the advisory footprint on the map.
    rowElm.addEventListener("click", (event) => {
      event.stopPropagation();
      if (typeof zoomToWaterAdvisory === "function")
        zoomToWaterAdvisory(advisory.bbox);
    });

    // The full utility message, so residents can read what the advisory says
    // without leaving the dashboard.
    if (advisory.message) {
      const messageRow = document.createElement("tr");
      const messageCell = document.createElement("td");
      messageCell.colSpan = 2;
      messageCell.className = "water-advisory-message";
      const messageElm = document.createElement("span");
      messageElm.innerText = advisory.message;
      messageCell.appendChild(messageElm);
      if (advisory.link) {
        const linkElm = document.createElement("a");
        linkElm.href = advisory.link;
        linkElm.target = "_blank";
        linkElm.rel = "noopener";
        linkElm.innerText = i18next.t("sidebar.cards.waterAdvisory.noticeLink");
        messageCell.appendChild(linkElm);
      }
      messageRow.appendChild(messageCell);
      tbody.appendChild(messageRow);
    }
  }

  // update card footer (using Intl)
  const cardFooter = document.querySelector("#water-advisory-card .card-footer");
  if (cardFooter) {
    const span = cardFooter.querySelector("span");
    const checkedDate = dayjs(geoData.lastUpdated).toDate();
    const formattedDate = formatDateTime(checkedDate, {
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    span.innerText = i18next.t("sidebar.cards.waterAdvisory.footer.text", {
      date: formattedDate,
    });
  }
}

// --- Beach Closures Rendering ---
function renderBeachClosures(jsonData) {
  latestBeachData = jsonData; // Store data
  // const lastrendered= jsonData['lastUpdated']
  window.latestBeachData = jsonData;
  const closedBeaches = jsonData.data.filter(
    (x) => x.beachStatus === "Closure"
  );
  const advisoryBeaches = jsonData.data.filter(
    (x) => x.beachStatus === "Advisory"
  );
  const countClosures = closedBeaches.length;
  // TODO: Calculate change from last week - requires historical data or assumptions
  const countClosuresChange = 0; // Placeholder

  // update high level text (using i18next)
  const countSpan = document.getElementById("beach-closure-count");
  const countIndicator = countSpan?.parentElement.querySelector(".indicator");
  if (countSpan && countIndicator) {
    // Use i18next pluralization
    countSpan.innerText = i18next.t(
      "sidebar.cards.beachClosures.overview.count",
      { count: countClosures }
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
      change: Math.abs(countClosuresChange),
    });
    changeIcon.className = `bi ${iconClass}`; // Reset classes
    changeSpan.className = trendClass; // Reset classes
  }

  // clear old data and build new table (using i18next)
  const jsonDiv = document.querySelector("#beach-closure-data tbody");
  if (!jsonDiv) return;
  jsonDiv.innerHTML = "";

  closedBeaches.forEach((obj) => {
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
      (statusIcon.className = `indicator ${getIndicatorLevelForBeach(
        parseBeachData(obj).beachStatus
      )}`); // Example mapping
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
    if (jsonData["lastUpdated"]) {
      // Check if a 'Date' field exists
      updateDate = dayjs(jsonData["lastUpdated"]).toDate(); // Convert to JS Date
    } else {
      updateDate = new Date(); // Fallback to now if no date is in the data
    }
    const formattedDate = formatDateTime(updateDate, {
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    // Use i18next for the "Updated" text
    span.innerText = i18next.t("sidebar.cards.beachClosures.footer.text", {
      date: formattedDate,
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
    `${urlbase}latest/tijuana/sd_complaints/complaints.geojson`
  )
    .then((response) =>
      response.ok ? response.json() : Promise.reject(response.statusText)
    )
    .then((jsonData) => {
      window.complaint_timeframe.latestDate = dayjs(jsonData.lastUpdated).toDate();
      document.querySelector("[data-i18n='topbar.prevComplaintdays']").setAttribute("data-i18n-options", JSON.stringify({
        start_date: window.complaint_timeframe.latestDate.toLocaleDateString(i18next.language || "en", { month: 'short', day: 'numeric' }),
        end_date: window.complaint_timeframe.getMostRecentSampleTime().toLocaleDateString(i18next.language || "en", { month: 'short', day: 'numeric' }),
      }));
      document.querySelector('[data-i18n="sidebar.cards.odorComplaints.overview.sampleDuration"').setAttribute("data-i18n-options", JSON.stringify({
        start_date: window.complaint_timeframe.getMostRecentSampleTime().toLocaleDateString(i18next.language || "en", { month: 'short', day: 'numeric' }),
        end_date: window.complaint_timeframe.latestDate.toLocaleDateString(i18next.language || "en", { month: 'short', day: 'numeric' }),
        complaint_days: window.complaint_days
      }));
      updateContent();
      return jsonData;
    })
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
    `${resilientUrlBase}tijuana/beachwatch/output/current/sdbeachinfo_status_translated.records.json`
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

function fetchWastewaterData() {
  fetch(
    `${resilientUrlBase}tijuana/ibwc/output/spills_last_by_site.geojson`
  )
    .then((response) =>
      response.ok ? response.json() : Promise.reject(response.statusText)
    )
    .then(async (jsonData) => {
      window.spill_timeframe.latestDate = dayjs(jsonData.lastUpdated).toDate();
      document.querySelector("[data-i18n='topbar.prevSpilldays']").setAttribute("data-i18n-options", JSON.stringify({
        start_date: window.spill_timeframe.latestDate.toLocaleDateString(i18next.language || "en", { month: 'short', day: 'numeric' }),
        end_date: window.spill_timeframe.getMostRecentSampleTime().toLocaleDateString(i18next.language || "en", { month: 'short', day: 'numeric' }),
      }));
      document.querySelector('[data-i18n="sidebar.cards.wastewater.overview.sampleDuration"').setAttribute("data-i18n-options", JSON.stringify({
        start_date: window.spill_timeframe.getMostRecentSampleTime().toLocaleDateString(i18next.language || "en", { month: 'short', day: 'numeric' }),
        end_date: window.spill_timeframe.latestDate.toLocaleDateString(i18next.language || "en", { month: 'short', day: 'numeric' }),
        spill_days: window.spill_days
      }));
      updateContent();
      return jsonData;
    })
    .then((jsonData) => {
      renderWastewaterFlows(jsonData);
    })
    .catch((error) => {
      console.error("Error fetching Wastewater Flows JSON:", error);
      document.querySelector("#wastewater-flows-card").remove();
    });
}

function fetchWaterAdvisoryLayer(id) {
  const params = new URLSearchParams({
    where: "EventState='CA'",
    outFields:
      "EventID,EventType,EventStatus,EventState,EventHeader,EventMessage," +
      "EventStartDate,EventExpirationDate,EventLastUpdatedDate,EventHyperlink",
    returnGeometry: "true",
    outSR: "4326",
    maxAllowableOffset: "0.0002", // degrees, because outSR is 4326
    f: "geojson",
  });

  return fetch(`${amWaterAdvisoryBase}/${id}/query?${params}`)
    .then((response) =>
      response.ok ? response.json() : Promise.reject(response.statusText)
    )
    .then((geoData) => {
      if (geoData.error) return Promise.reject(geoData.error.message);
      // Tag each feature with its severity so the card and the map layer can both
      // work from a single merged collection.
      return (geoData.features || []).map((feature) => {
        feature.properties.advisoryLevel = amWaterAdvisoryLayers[id].level;
        return feature;
      });
    });
}

function fetchWaterAdvisoryData() {
  Promise.all(
    Object.keys(amWaterAdvisoryLayers).map((id) => fetchWaterAdvisoryLayer(id))
  )
    .then((collections) => {
      // The service reports no feed-level timestamp, so record when we checked.
      const geoData = {
        type: "FeatureCollection",
        lastUpdated: new Date().toISOString(),
        features: collections.flat(),
      };
      renderWaterAdvisory(geoData);
    })
    .catch((error) => {
      console.error("Error fetching Drinking Water Advisories:", error);
      document.querySelector("#water-advisory-card")?.remove();
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
  if (beachStatus == "Closure") return "beach-closure";
  else if (beachStatus === "Open") return "beach-open";
  else if (beachStatus === "Warning") return "beach-warning";
  else if (beachStatus === "Advisory") return "beach-advisory";
  else if (beachStatus === "Outfall") return "beach-outfall";
  else return "indeterminate";
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
  if (value < 5) return "green";
  else if (value < 30) return "yellow";
  else if (value < 27000) return "orange";
  else return "purple";
}

function parseCustomDate(dateStr) {
  // Split the string into parts: [year, day, month]
  let [year, month, day] = dateStr.split("-").map(Number);
  // Note: in JavaScript, months are 0-indexed (0 = January)
  return new Date(year, month - 1, day);
}
