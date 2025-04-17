// const s3base = "https://oss.resilientservice.mooo.com/"
// //const bucket = 'test'
// const bucket = 'resilentpublic'
// s3base and bucket defined in app.js
const urlbase = `${s3base}${bucket}/`;
const iconSizing = [
  "interpolate",
  ["linear"],
  ["zoom"],
  5,
  0.3, // At zoom level 5, text size 10
  12,
  0.4, // At zoom level 12, text size 18
  15,
  0.5,
];
const iconSizingOutfall = [
  "interpolate",
  ["linear"],
  ["zoom"],
  5,
  0, // At zoom level 5, text size 10
  12,
  0.4, // At zoom level 12, text size 18
  15,
  0.5,
];
mapboxgl.accessToken =
  "pk.eyJ1IjoidmFsZW50aW5lZHd2IiwiYSI6ImNra215Y2QydDExd3oycHF0d2VvM2pwYXoifQ.sODwFshU0owiFxw6SKLeKg";
const map = new mapboxgl.Map({
  container: "map-container", // container ID
  center: [-117.13, 32.56], // 32.58,-117.11 starting position [lng, lat]. Note that lat must be set between -90 and 90
  zoom: 12, // starting zoom
  maxBounds: [
    [-118, 32], // Southwest coordinates
    [-116, 34], // Northeast coordinates
  ],
});

function setGroupVisibility(map, layerInfo, visibility) {
  layerInfo.layers.forEach((layerId) => {
    // Ensure the layer exists before attempting to change it
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "visibility", visibility);
    }
  });
}

function setMapLanguage() {
  console.log("[language.js] Updating map for language:", i18next.language);
  map.addControl(
    new MapboxLanguage({
      defaultLanguage: i18next.language,
    })
  );
  // FIXME: update tooltip language
}

function groupByDate(leafFeatures) {
  dateGroups = _.chain(leafFeatures).groupBy(
  feature => {
    const fullDate = feature.properties['datetime'];
    return fullDate.split('T')[0];
  }).mapValues(arr => arr.length)
    .value()
  const sorted =_.map(
    _.orderBy(_.toPairs(dateGroups),   // → [ [date, count], … ]
      pair => pair[0],    // sort by the date-string key
      'desc'),
    ([date, count]) => ({ date, count })
  );
  return sorted

}

function returnIntersectionFromLeafs(leafFeatures){
  // quick look at data. Default TJ River location is registered as four different names.
  // and same intersection gets different coordinates, so run check, if there is only one feature
  // for these cases, then set a property with the name of the intersection.
  // console.log('Features in the clicked cluster:', leafFeatures);
  let unique_intersections = _.uniqBy(leafFeatures, 'properties.cross_street___intersection');
  let unique_locations = _.uniqBy(leafFeatures, item =>
    `${item.properties.x_coordinate}::${item.properties.y_coordinate}` )
  console.log('distinct intersections in the clicked cluster:', unique_intersections);
  console.log('distinct locations in the clicked cluster:', unique_locations);
  let default_feature= false;
  let intersection = ''
  if (unique_locations.length === 1 || unique_intersections.length === 1 ) {

    intersection = unique_locations[0].properties["cross_street___intersection"];
    console.log('intersection',intersection )
    if (unique_locations.length === 1 && unique_locations[0].properties["x_coordinate"] === -117.081305
      &&
      unique_locations[0].properties["y_coordinate"] === 32.552044) {
      default_feature= true;
      intersection = 'Tijuana River Valley (US/MX) Default Location'
      console.log('intersection',intersection )
    }

  }
  return intersection
}
function complaints_layer(complaint_days) {
  try {
    fetch(`${urlbase}tijuana/sd_complaints/output/complaints.geojson`) // update the path or URL to your GeoJSON file
      .then((response) => response.json())
      .then((data) => {
        const complaintsVisible = document
          .querySelector("#complaints-filter-btn")
          .classList.contains("active");
        map.addSource("complaints", {
          type: "geojson",
          data: data,
          cluster: true,
          clusterMaxZoom: 14, // max zoom to cluster points
          clusterRadius: 50, // radius of each cluster when clustering points (in pixels)
        });
        const threeDaysAgo = dayjs().subtract(complaint_days, "day");
        console.log("days ago date: ", threeDaysAgo);
        // Filter features where the "Date Recieved" is within the last three days.
        // Adjust the date parsing if your format differs.
        var filteredFeatures = data.features.filter((feature) => {
          var dateReceived = new Date(feature.properties["date_received"]);
          return dateReceived >= threeDaysAgo;
        });
        console.log("complaints after filter: ", filteredFeatures.length);

        // Create a new FeatureCollection with filtered features
        var filteredData = {
          type: "FeatureCollection",
          features: filteredFeatures,
        };
        console.log("features:", filteredData);
        map.addSource("complaints_lastdays", {
          type: "geojson",
          data: filteredData,
          cluster: true,
          clusterMaxZoom: 14, // max zoom to cluster points
          clusterRadius: 50, // radius of each cluster when clustering points (in pixels)
        });
        // Layer for clusters (as circles) for all
        map.addLayer({
          id: "clusters-all",
          layout: { visibility: "none" },
          type: "circle",
          source: "complaints",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#51bbd6",
            "circle-radius": [
              "step",
              ["get", "point_count"],
              20, // circle radius when count is less than first step
              100, // first step threshold
              30, // circle radius for count >= 100
              750, // second step threshold
              40, // circle radius for count >= 750
            ],
          },
        });

        // Layer for cluster count labels
        map.addLayer({
          id: "complaint-cluster-count-all",

          type: "symbol",
          source: "complaints",
          filter: ["has", "point_count"],
          layout: {
            visibility: "none",
            "text-field": "{point_count_abbreviated}",
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 12,
          },
        });

        // Layer for unclustered individual points
        map.addLayer({
          id: "complaint-unclustered-point-all",
          layout: { visibility: "none" },
          type: "circle",
          source: "complaints",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": "#11b4da",
            "circle-radius": 4,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#fff",
          },
        });
        // Layer for clusters (as circles) for all

        map.addLayer({
          id: "complaint-clusters",
          type: "circle",
          source: "complaints_lastdays",
          filter: ["has", "point_count"],
          layout: { visibility: complaintsVisible ? "visible" : "none" },
          paint: {
            "circle-color": "#51bbd6",
            "circle-stroke-width": 1,
            "circle-stroke-color": "#fff",
            "circle-radius": [
              "step",
              ["get", "point_count"],
              20, // circle radius when count is less than first step
              100, // first step threshold
              30, // circle radius for count >= 100
              750, // second step threshold
              40, // circle radius for count >= 750
            ],
          },
        });

        // Layer for cluster count labels
        map.addLayer({
          id: "complaint-cluster-count",
          type: "symbol",
          source: "complaints_lastdays",
          filter: ["has", "point_count"],
          layout: {
            "text-field": "{point_count_abbreviated}",
            "text-font": ["Arial Unicode MS Bold"],
            "text-size": 14,
            visibility: complaintsVisible ? "visible" : "none",
          },
        });

        // Layer for unclustered individual points

        map.addLayer({
          id: "complaint-unclustered",
          type: "symbol",
          source: "complaints_lastdays",
          filter: ["!", ["has", "point_count"]],
          layout: {
            "icon-image": "complaint_icon",
            "icon-size": iconSizing,
            "icon-allow-overlap": true,

            "icon-offset": [0, 0],
            visibility: complaintsVisible ? "visible" : "none",
          },
        });
        map.on("click", "complaint-unclustered", function (e) {
          var feature = e.features[0];
          var coordinates = feature.geometry.coordinates.slice();
          console.log(feature);
          const dateReceived = dayjs(feature.properties["date"]);
          const dateString = dateReceived.format("MMM D, YYYY");
          const intersection=feature.properties["cross_street___intersection"]
          console.log('intersection', intersection)

          var popupContent = `
      <div class="tooltip">
        <div class="tooltip-header">
          <i class="bi bi-exclamation-circle"></i>
          <span data-i18n="tooltips.complaint.title">${window.i18next.t(
            "tooltips.complaint.title"
          )}</span>
        </div>
        <div class="tooltip-line">
          <span data-i18n="tooltips.complaint.time.value" data-i18n-options='{"date": "${dateString}"}'>${window.i18next.t(
            "tooltips.complaint.time",
            { date: dateString }
          )}</span>
        </div>

        <div class="tooltip-footer">
          <span data-i18n="tooltips.complaint.footer">${window.i18next.t(
            "tooltips.complaint.footer"
          )}</span>
        </div>
      </div>`;
          // Intersection is unreliable removed from above.
          // <div class="tooltip-line">
          //    <span data-i18n="tooltips.complaint.intersection.value" data-i18n-options='{"intersection": "${intersection}"}'>${window.i18next.t(
          //      "tooltips.complaint.intersection",
          //      { intersection: intersection }
          //    )}</span>
          //  </div>

          new mapboxgl.Popup({ className: "mapbox-tooltip complaint-tooltip" })
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map);
        });

        map.on("click", "complaint-clusters", function (e) {
          let feature = e.features[0];

          let coordinates = feature.geometry.coordinates.slice();
          let complaintCount = e.features[0].properties.point_count;
          console.log("[mbmap.js] complaint count", complaintCount);
          let features = map.queryRenderedFeatures(e.point, {
            layers: ['complaint-clusters']
          });
          let clusterFeature = features[0];
          let clusterId = clusterFeature.properties.cluster_id;
          map.getSource('complaints_lastdays').getClusterLeaves(clusterId, 1000, 0, function (err, leafFeatures) {
            if (err) {
              console.error('Error retrieving cluster leaves: ', err);
              return;
            }
            groupedData = groupByDate(leafFeatures)
            console.log('grouped by date ',groupedData )
            const complaint_count_div = document.createElement("table")
            complaint_count_div.classList.add("card-data");
            _.forEach (groupedData,(item )=>
            {

              const complaint_inner_div = document.createElement("tr")
              const complaint_day =document.createElement("td")
              const complaint_count =document.createElement("td")
              //complaint_day.textContent=item.date
              //complaint_count.textContent=item.count
              const dateIcon = document.createElement("i");
              dateIcon.className = "bi bi-clock";
              const dateElm = document.createElement("span");

              let date = new Date(item.date);
              const dateString = formatDateTime(date, {
                month: "short",
                day: "numeric",
              });
              dateElm.innerText = ` ${dateString}`;
              complaint_day.appendChild(dateIcon);
              complaint_day.appendChild(dateElm);
              const countIndicatorElm = document.createElement("span");
              const countSpan = document.createElement("span");
              countIndicatorElm.className =
                "indicator " + getIndicatorLevelForOdorComplaints(item.count);
              countSpan.innerText = i18next.t("sidebar.cards.odorComplaints.dailyCount", {
                count: item.count
              });
              complaint_count.appendChild(countIndicatorElm)
              complaint_count.appendChild(countSpan);

              complaint_inner_div.appendChild(complaint_day);
              complaint_inner_div.appendChild(complaint_count);
              complaint_count_div.appendChild(complaint_inner_div);
            });

            // Another option, open a popup listing details about the features.
            // var popupHTML = `<strong>Cluster contains ${clusterFeature.properties.point_count} points.</strong><br/><ul>`;
            // leafFeatures.forEach(function(feature) {
            //   popupHTML += `<li>${feature.properties.name || 'Unnamed feature'}</li>`;
            // });
            // popupHTML += '</ul>';

          // window.i18next.t("tooltips.complaintMultiple.title", { count: String(complaintCount) })}
          console.log('complaint days',complaint_days )
          var popupContent = `
      <div class="tooltip">
        <div class="tooltip-header">
          <i class="bi bi-exclamation-circle"></i>
          <span data-i18n="tooltips.complaintMultiple.title" data-i18n-options='{"count": "${complaintCount}"}'>${window.i18next.t(
            "tooltips.complaintMultiple.title",
            { count: String(complaintCount) }
          )}</span>
        </div>
        <div class="tooltip-line tooltip-table">
          <span data-i18n="tooltips.complaintMultiple.time.label" >${window.i18next.t(
            "tooltips.complaintMultiple.time.label"
          )}</span>
          <span data-i18n="tooltips.complaintMultiple.time.value" data-i18n-options='{"days": "${complaint_days}"}' >${window.i18next.t(
            "tooltips.complaintMultiple.time.value",
            { days: String(complaint_days) }
          )}</span>
            </div>
        ${complaint_count_div.outerHTML}
        <div class="tooltip-footer">
          <span data-i18n="tooltips.complaintMultiple.footer">${window.i18next.t(
            "tooltips.complaintMultiple.footer"
          )}</span>
        </div>
      </div>`;
            // Intersection is unreliable.

            //        <div class="tooltip-line">
            //   <span data-i18n="tooltips.complaintMultiple.intersection.value" data-i18n-options='{"intersection": "${intersection}"}'>${window.i18next.t(
            //     "tooltips.complaintMultiple.intersection",
            //     { intersection: intersection }
            //   )}</span>
            // </div>
          new mapboxgl.Popup({ className: "mapbox-tooltip complaint-tooltip" })
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map);
        });
        });
      });
  } catch {
    console.log("Error creating complaints map layer");
  }
}

function beach_layer() {
  // beachwatch
  try {
    const beachVisible = document
      .querySelector("#beaches-filter-btn")
      .classList.contains("active");
    // Add your GeoJSON source containing beach status
    map.addSource("beaches", {
      type: "geojson",
      data: `${urlbase}tijuana/beachwatch/output/current/sdbeachinfo_status_translated.geojson`,
    });

    map.addLayer({
      id: "outfalls",
      type: "symbol",
      source: "beaches",
      minzoom: 13,
      filter: ["==", ["get", "LocationType"], "Outfall"],
      layout: {
        "icon-image": "outfall_icon",
        "icon-size": iconSizingOutfall,
        "icon-allow-overlap": true,
        // Offset the icon so the tip of the pin points to the location
        "icon-offset": [0, 0],
        visibility: beachVisible ? "visible" : "none",
      },
    });

    // Create a symbol layer using the custom pin icon
    map.addLayer({
      id: "beaches",
      type: "symbol",
      source: "beaches",
      filter: ["!=", ["get", "LocationType"], "Outfall"],
      layout: {
        //"icon-image": "beach_icon",
        "icon-image": [
          "match",
          ["get", "beachStatus"], // Replace 'status' with your property name
          "Closure",
          "beach-closure", // When status is "active", use green
          "Open",
          "beach-open",
          "Advisory",
          "beach-advisory",
          "Warning",
          "beach-warning",
          "Outfall",
          "outfall_icon",
          //'Outfall', '#000000',
          /* default */ "beach-open", // warning... since we have not seen it in the data
        ],
        "icon-size": iconSizing,
        "icon-allow-overlap": true,
        // Offset the icon so the tip of the pin points to the location
        "icon-offset": [0, 0],
        visibility: beachVisible ? "visible" : "none",
      },
    });
    // Add a popup when a pin is clicked
    map.on("click", "beaches", function (e) {
      var feature = e.features[0];
      var coordinates = feature.geometry.coordinates.slice();

      const beachData = parseBeachData(feature.properties);
      const indicatorClass = getIndicatorLevelForBeach(beachData.beachStatus);
      const beachStatus = window.i18next.t(
        "tooltips.beach.status." + beachData.beachStatus
      );
      const beachStatusSince = beachData.statusSince
        ? window.i18next.t("tooltips.beach.since", {
            date: beachData.statusSince
              .locale(window.i18next.language)
              .format("MMM D"),
          })
        : undefined;
      console.log("[mbmap.js] beachData", beachData);

      var popupContent = `
      <div class="tooltip">
        <div class="tooltip-header">
          <div>
            <i class="bi bi-water"></i>
            <span>${beachData.name}</span>
            ${
              beachData.nameDetails
                ? `<span>${beachData.nameDetails}</span>`
                : ""
            }
          </div>
        </div>
        <div class="tooltip-line beach-status labelled-indicator">
          <div class="indicator ${indicatorClass}"></div>
          <span data-i18n="${
            "tooltips.beach.status." + beachData.beachStatus
          }">${beachStatus}</span>
        </div>
        ${
          beachStatusSince
            ? `<div class="tooltip-line beach-status-since">
              <span data-i18n="tooltips.beach.since" data-i18n-options='{"date": "${beachData.statusSince
                .locale(window.i18next.language)
                .format("MMM D")}"}'>${beachStatusSince}</span>
            </div>`
            : ""
        }
        ${
          beachData.statusNote
            ? `<div class="tooltip-line beach-status-note">
              <span>${beachData.statusNote}</span>
            </div>`
            : ""
        }
      </div>`;

      new mapboxgl.Popup({ className: "mapbox-tooltip beach-tooltip" })
        .setLngLat(coordinates)
        .setHTML(popupContent)
        .addTo(map);
    });
    map.on("click", "outfalls", function (e) {
      var feature = e.features[0];
      var coordinates = feature.geometry.coordinates.slice();

      const beachData = parseBeachData(feature.properties);
      const indicatorClass = getIndicatorLevelForBeach(beachData.beachStatus);
      const beachStatus = window.i18next.t(
        "tooltips.beach.status." + beachData.beachStatus
      );
      const beachStatusSince = beachData.statusSince
        ? window.i18next.t("tooltips.beach.since", {
            date: beachData.statusSince
              .locale(window.i18next.language)
              .format("MMM D"),
          })
        : undefined;
      console.log("[mbmap.js] beachData", beachData);

      var popupContent = `
      <div class="tooltip">
        <div class="tooltip-header">
          <div>
            <i class="bi bi-water"></i>
            <span>${beachData.name}</span>
            ${
              beachData.nameDetails
                ? `<span>${beachData.nameDetails}</span>`
                : ""
            }
          </div>
        </div>
        <div class="tooltip-line beach-status labelled-indicator">
          <div class="indicator beach-outfall"></div>
          <span data-i18n="${
            "tooltips.beach.status." + beachData.beachStatus
          }">Outfall</span>
        </div>

<!--        <div class="tooltip-line beach-status-note">-->
<!--              <span>Beach users are urged to avoid contact with runoff and recreational waters within at least 75 feet from where runoff enters the ocean.</span>-->
<!--            </div>-->
${
  beachData.statusNote
    ? `<div class="tooltip-line beach-status-note">
              <span>${beachData.statusNote}</span>
            </div>`
    : ""
}

      </div>`;

      new mapboxgl.Popup({ className: "mapbox-tooltip beach-tooltip" })
        .setLngLat(coordinates)
        .setHTML(popupContent)
        .addTo(map);
    });
    // Change the cursor to a pointer when over the pins.
    map.on("mouseenter", "beaches", function () {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "beaches", function () {
      map.getCanvas().style.cursor = "";
    });
  } catch {
    console.log("error creating beaches map layers");
  }
}

function spills_layer(spill_days) {
  // spills
  try {
    const spillVisible = document
      .querySelector("#spills-filter-btn")
      .classList.contains("active");
    // Add your GeoJSON source containing beach status
    map.addSource("spills", {
      type: "geojson",
      data: `${urlbase}tijuana/ibwc/output/spills_last_by_site.geojson`,
    });
    const thirtyDaysAgo = dayjs().subtract(spill_days, "day").toISOString();
    // Create a symbol layer using the custom pin icon
    map.addLayer({
      id: "spills",
      type: "symbol",
      source: "spills",
      filter: [
        "any",
        [">=", ["get", "End Time"], thirtyDaysAgo],
        [">=", ["get", "Start Time"], thirtyDaysAgo],
      ],
      layout: {
        "icon-image": "spill_icon",
        //'icon-size': .1,
        "icon-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5,
          0.2, // At zoom level 5, text size 10
          12,
          0.4, // At zoom level 12, text size 18
          14,
          0.5,
        ],
        "icon-allow-overlap": true,
        // Offset the icon so the tip of the pin points to the location
        "icon-offset": [0, 0],
        visibility: spillVisible ? "visible" : "none",
      },
      // paint: {
      //   // Use the RGBcolor property to tint the pin
      //   'icon-color': ['get', 'RBGColor']
      // }
    });

    // Add a popup when a pin is clicked
    map.on("click", "spills", function (e) {
      var feature = e.features[0];
      var coordinates = feature.geometry.coordinates.slice();
      var name = feature.properties["Discharge Location"];
      var dates = {
        start: dayjs(feature.properties["Start Date"]),
        end: dayjs(feature.properties["End Date"]),
      };
      let dateStr;
      if (dates.start.isSame(dates.end, "day")) {
        dateStr = window.i18next.t("tooltips.wastewater.time", {
          date: dates.start.locale(window.i18next.language).format("MMM D"),
        });
      } else {
        dateStr = window.i18next.t("tooltips.wastewater.duration", {
          start: dates.start.locale(window.i18next.language).format("MMM D"),
          end: dates.end.locale(window.i18next.language).format("MMM D"),
        });
      }
      var volume = feature.properties["Approximate Discharge Volume"];
      var popupContent = `
      <div class="tooltip">
        <div class="tooltip-header">
          <i class="bi bi-droplet"></i>
          <span data-i18n="tooltips.wastewater.title">${window.i18next.t(
            "tooltips.wastewater.title"
          )}</span>
        </div>
        <div class="tooltip-line tooltip-table">
          <span data-i18n="tooltips.wastewater.location">${window.i18next.t(
            "tooltips.wastewater.location"
          )}</span>
          <span>${name}</span>
        </div>
        <div class="tooltip-line tooltip-table">
          <span data-i18n="tooltips.wastewater.date">${window.i18next.t(
            "tooltips.wastewater.date"
          )}</span>
          <span>${dateStr}</span>
        </div>
        <div class="tooltip-line tooltip-table">
          <span data-i18n="tooltips.wastewater.volume">${window.i18next.t(
            "tooltips.wastewater.volume"
          )}</span>
          <span>${volume}</span>
        </div>
      </div>`;

      new mapboxgl.Popup({ className: "mapbox-tooltip spill-tooltip" })
        .setLngLat(coordinates)
        .setHTML(popupContent)
        .addTo(map);
    });
  } catch {
    console.log(" error creating spills map layers ");
  }
}

function h2s_layer() {
  try {
    const h2sVisible = document
      .querySelector("#h2s-filter-btn")
      .classList.contains("active");
    // Add your GeoJSON source containing beach status
    map.addSource("h2s", {
      type: "geojson",
      data: `${urlbase}tijuana/sd_apcd_air/output/lastvalue_h2s.geojson`,
    });

    // Create a symbol layer using the custom pin icon
    map.addLayer({
      id: "h2s",
      type: "symbol",
      source: "h2s",
      layout: {
        "icon-image": [
          "match",
          ["get", "level"],
          "green",
          "h2s_icon_green",
          "yellow",
          "h2s_icon_orange",
          "orange",
          "h2s_icon_orange",
          "purple",
          "h2s_icon_purple",
          "h2s_icon_white",
        ],
        "icon-size": iconSizing,
        "icon-allow-overlap": true,
        // Offset the icon so the tip of the pin points to the location
        "icon-offset": [0, 0],
        visibility: h2sVisible ? "visible" : "none",
      },
      // paint: {
      //   // Use the level property to tint the pin
      //  // "icon-color": ["get", "level"],
      //   'icon-color': [
      //     'match',
      //     ['get', 'level'], // Replace 'status' with your property name
      //     'green', '#00e400',
      //     'yellow', '#ffff00',
      //     'orange', '#ff7e00',
      //     'purple', '#cc58db',
      //     /* default */ 'white' // For any other value, use blue
      //   ]
      // },
    });

    // Add a popup when a pin is clicked
    map.on("click", "h2s", function (e) {
      var feature = e.features[0];
      var coordinates = feature.geometry.coordinates.slice();
      var name = feature.properties["LongName"].replace(/\([A-Z]+\)/g, "");
      var description = feature.properties.Result;
      let date = dayjs(feature.properties["Date with time"]);
      var airnow_link = `https://www.airnow.gov/?city=${feature.properties["Site Name"]}&state=CA&country=USA`;
      var indicatorClass = getIndicatorLevelForH2SValue(description);
      var popupContent = `
      <div class="tooltip">
        <div class="tooltip-header">
          <i class="bi bi-wind"></i>
          <span data-i18n="tooltips.h2s.title">${window.i18next.t(
            "tooltips.h2s.title"
          )}</span>
        </div>
        <div class="tooltip-line tooltip-table">
          <span data-i18n="tooltips.h2s.labels.location">${window.i18next.t(
            "tooltips.h2s.labels.location"
          )}</span>
          <span>${name.split(" - ")[0]}</span>
        </div>
        <div class="tooltip-line tooltip-table">
          <span data-i18n="tooltips.h2s.labels.measurement">${window.i18next.t(
            "tooltips.h2s.labels.measurement"
          )}</span>
          <span class="labelled-indicator"><span class="indicator ${indicatorClass}"></span><span>${description} ppB</span></span>
        </div>
        <div class="tooltip-line tooltip-table">
          <span data-i18n="tooltips.h2s.labels.updated">${window.i18next.t(
            "tooltips.h2s.labels.updated"
          )}</span>
          <span>${date.locale(window.i18next.language).format("h:mma")}</span>
        </div>
        <div class="tooltip-footer">
          <span data-i18n="tooltips.h2s.ppb">${window.i18next.t(
            "tooltips.h2s.ppb"
          )}</span>
        </div>
      </div>`;

      new mapboxgl.Popup({ className: "mapbox-tooltip h2s-tooltip" })
        .setLngLat(coordinates)
        .setHTML(popupContent)
        .addTo(map);
    });

    // map.addLayer({
    //   id: 'h2s-value',
    //   type: 'symbol',
    //   source: 'h2s',
    //
    //   layout: {
    //     'text-field': ['get', 'Original Value'],
    //     'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    //     'text-size': 12,
    //     'text-offset': [-2, 0],
    //   }, paint: {
    //     'text-color': '#000'
    //   }
    // });
    // map.addLayer({
    //   id: "h2s-name",
    //   type: "symbol",
    //   source: "h2s",

    //   layout: {
    //     "text-field": ["get", "LongName"],
    //     "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
    //     "text-size": 12,
    //     "text-offset": [0, 3],
    //   },
    //   paint: {
    //     "text-color": "#000",
    //   },
    // });
  } catch {
    console.log("error creating h2s map layers ");
  }
}

function watershed_layer() {

  try {
    const watershedVisible = document
      .querySelector("#river-filter-btn")
      .classList.contains("active");
    map.addSource("basin", {
      type: "geojson",
      data: `${urlbase}tijuana/gis/tjbasin/subbasin.geojson`,
    });
    map.addLayer({
      id: "basin",
      type: "fill",
      source: "basin", // reference the data source
      layout: {
        visibility: watershedVisible ? "visible" : "none",
      },
      paint: {
        "fill-color": "#0080ff", // blue color fill
        "fill-opacity": 0.1,
      },
    });
    // Add a outline around the polygon.
    map.addLayer({
      id: "basin-outline",
      type: "line",
      source: "basin",
      layout: {
        visibility: watershedVisible ? "visible" : "none",
      },
      paint: {
        "line-color": "#ABBCED",
        "line-width": 1,
      },
    });
  } catch (e) {
    console.log("Could not add basin layer");
  }
  try {
    const watershedVisible = document
      .querySelector("#river-filter-btn")
      .classList.contains("active");
    map.addSource("streams", {
      type: "geojson",
      data: `${urlbase}tijuana/gis/tjbasin/streams.geojson`,
    });

    // Add a outline around the polygon.
    map.addLayer({
      id: "streams-line",
      type: "line",
      source: "streams",
      layout: { visibility: watershedVisible ? "visible" : "none" },
      paint: {
        "line-color": "#1E3788",
        "line-width": 1,
        "line-opacity": 0.5,
      },
    });
  } catch (e) {
    console.log("Could not add streams  layer", e);
  }
}
function parseBeachData(beachTooltipProperties) {
  console.log("[mbmap.js] parsing beach data", beachTooltipProperties);
  // beach name into a human friendly format
  const nameParts = beachTooltipProperties.Name.replace(
    /\([A-Z]{2}\-[0-9]+\)/g,
    ""
  ).split(/( - | at )/);
  // console.log(nameParts);
  const name = nameParts[0].trim();
  const nameDetails = nameParts[2] ? nameParts[2].trim() : "";

  let beachStatus = beachTooltipProperties["beachStatus"];
  console.log("beachStatus", beachStatus);
  let statusSince = null;
  if (beachTooltipProperties["StatusSince"] != "") {
    statusSince = dayjs(beachTooltipProperties["StatusSince"]);
  }

  console.log("statusSince", statusSince);
  let statusNote = beachTooltipProperties["StatusNote"];
  console.log("statusNote", statusNote);
  if (
    window.i18next.language !== "en" &&
    beachTooltipProperties["StatusNote_" + window.i18next.language]
  ) {
    statusNote =
      beachTooltipProperties["StatusNote_" + window.i18next.language];
    console.log("StatusNote" + window.i18next.language, statusNote);
  }

  // Get the beach status from the properties
  // let closureNotice;
  // let advisoryNotice;
  // if (window.i18next.language !== "en" && (beachTooltipProperties["Closure_" + window.i18next.language] || beachTooltipProperties["Advisory_" + window.i18next.language])) {
  //   closureNotice = beachTooltipProperties["Closure_" + window.i18next.language];
  //   advisoryNotice = beachTooltipProperties["Advisory_" + window.i18next.language];
  // }
  // else {
  //   closureNotice = beachTooltipProperties.Closure;
  //   advisoryNotice = beachTooltipProperties.Advisory;
  // }

  // let beachStatus = "Open";
  // let statusSince = "";
  // let statusNote = "";
  // if (closureNotice && closureNotice.length > 0) {
  //   const noticeInfo = parseBeachNotice(closureNotice);
  //   beachStatus = noticeInfo.beachStatus;
  //   statusSince = noticeInfo.statusSince;
  //   statusNote = noticeInfo.statusNote;
  // }
  // else if (advisoryNotice && advisoryNotice.length > 0) {
  //   const noticeInfo = parseBeachNotice(advisoryNotice);
  //   beachStatus = noticeInfo.beachStatus;
  //   statusSince = noticeInfo.statusSince;
  //   statusNote = noticeInfo.statusNote;
  // }

  // handle outfall
  if (beachTooltipProperties.LocationType === "Outfall") {
    beachStatus = "Outfall";
    statusSince = "";
    if (
      window.i18next.language !== "en" &&
      beachTooltipProperties["Description_" + window.i18next.language]
    ) {
      statusNote =
        beachTooltipProperties["Description_" + window.i18next.language];
      console.log("Description_" + window.i18next.language, statusNote);
    } else {
      statusNote = beachTooltipProperties["Description"];
    }
  }

  //clean up and return
  let ret = {
    name: name,
    nameDetails: nameDetails,
    beachStatus: beachStatus,
    statusSince: statusSince,
    statusNote: statusNote,
  };
  if (!ret.statusSince || ret.statusSince === "") {
    delete ret.statusSince;
  }
  if (!ret.statusNote || ret.statusNote === "") {
    delete ret.statusNote;
  }
  if (!ret.nameDetails || ret.nameDetails === "") {
    delete ret.nameDetails;
  }
  return ret;
}

function parseBeachNotice(html) {
  // console.log("[mbmap.js] parsing beach notice", html);
  let beachStatus = "";
  let statusSince = "";
  let statusNote = "";

  try {
    beachStatus = html.match(/(?<=<strong>)(Closure|Advisory)/g)[0]; // TODO: Closure|Advisory|Warning|Open|Outfall
    // console.log("[mbmap.js] beachStatus", beachStatus);
  } catch (e) {
    beachStatus = "unknown";
    console.error(
      "[mbmap.js] error parsing beach status",
      e,
      "parsing html",
      html
    );
  }

  try {
    statusSince = html.match(
      /(?<=<strong>Status Since[: ]*?<\/strong>[: ]*?).*(?=<br ?\/>)/g
    )[0];
    statusSince = dayjs(statusSince);
    // console.log("[mbmap.js] statusSince", statusSince);
  } catch (e) {
    statusSince = "";
    console.error(
      "[mbmap.js] error parsing beach status since",
      e,
      "parsing html",
      html
    );
  }

  try {
    // text should already be in english/spanish
    const emboldenedText = html.match(/(?<=<strong>)(.*?)(?=<\/strong>)/g);
    statusNote = emboldenedText
      ? emboldenedText[emboldenedText.length - 1]
      : "";
    // console.log("[mbmap.js] statusNote", statusNote);
  } catch (e) {
    statusNote = "";
    console.error(
      "[mbmap.js] error parsing beach status note",
      e,
      "parsing html",
      html
    );
  }

  return {
    beachStatus,
    statusSince,
    statusNote,
  };
}

/// onload loads icons in bulk, then call the layers
map.on("load", function () {
  const icons = [
    { id: "spill_icon", url: "img/marker-spill-inverted.png" },
    { id: "outfall_icon", url: "img/marker-outlet-new-inverted.png" },
    { id: "beach_icon", url: "img/marker-beach.png" },
    { id: "complaint_icon", url: "img/marker-complaint-color.png" },
    { id: "beach-advisory", url: "img/marker-beach-advisory.png" },
    { id: "beach-closure", url: "img/marker-beach-closure-white.png" },
    { id: "beach-warning", url: "img/marker-beach-warning.png" },
    { id: "beach-open", url: "img/marker-beach-open.png" },
    { id: "h2s_icon", url: "img/marker-h2s.png" },
    { id: "h2s_icon_white", url: "img/marker-h2s-white.png" },
    { id: "h2s_icon_green", url: "img/marker-h2s-green.png" },
    { id: "h2s_icon_orange", url: "img/marker-h2s-orange.png" },
    { id: "h2s_icon_purple", url: "img/marker-h2s-purple.png" },
    { id: "river_icon", url: "img/river.png" },
  ];

  // Load icons (retrying up to 3 times)
  const maxAttempts = 3;
  async function loadIcon(icon, attempt = 0) {
    return new Promise((resolve, reject) => {
      map.loadImage(icon.url, (error, image) => {
        if (error && attempt < maxAttempts) {
          console.warn(
            `Failed to load icon ${icon.id} on attempt ${
              attempt + 1
            }. Retrying...`
          );
          loadIcon(icon, attempt + 1) // try again
            .then(() => {
              resolve();
            })
            .catch((err) => {
              reject(err);
            });
        } else if (error) {
          reject(error);
        } else {
          map.addImage(icon.id, image);
          resolve();
        }
      });
    });
  }

  Promise.all(icons.map((icon) => loadIcon(icon)))
    .then(() => {
      // All icons have loaded, you can proceed to add your layers.
      watershed_layer();
      spills_layer(window.spill_days);
      beach_layer();
      complaints_layer(window.complaint_days);
      h2s_layer();
      setMapLanguage();
    })
    .catch((err) => {
      console.error("Failed to load icons:", err);
    });
});
