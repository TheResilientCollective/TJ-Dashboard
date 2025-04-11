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

function complaints_layer(complaint_days) {
  try {
    fetch(`${urlbase}tijuana/sd_complaints/output/complaints.geojson`) // update the path or URL to your GeoJSON file
      .then((response) => response.json())
      .then((data) => {
        const complaintsVisible = document.querySelector("#complaints-filter-btn").classList.contains("active");
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
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 12,
            "visibility": complaintsVisible ? "visible" : "none",
          },
        });

        // Layer for unclustered individual points
        // map.addLayer({
        //   id: 'unclustered-point',
        //   type: 'circle',
        //   source: 'complaints_lastdays',
        //   filter:
        //     ['!', ['has', 'point_count']],
        //   paint: {
        //     'circle-color': '#11b4da',
        //     'circle-radius': 4,
        //     'circle-stroke-width': 1,
        //     'circle-stroke-color': '#fff'
        //   }
        // });
        map.addLayer({
          id: "complaint-unclustered",
          type: "symbol",
          source: "complaints_lastdays",
          filter: ["!", ["has", "point_count"]],
          layout: {
            "icon-image": "complaint_icon",
            "icon-size": iconSizing,
            "icon-allow-overlap": true,
            // Offset the icon so the tip of the pin points to the location
            "icon-offset": [0, 0],
            "visibility": complaintsVisible ? "visible" : "none",
          },
          paint: {
            "icon-color": "#51bbd6",
          },
        });
        map.on("click", "complaint-unclustered", function (e) {
          var feature = e.features[0];
          var coordinates = feature.geometry.coordinates.slice();
          console.log(feature);
          const dateReceived = dayjs(feature.properties["date"]);
          const dateString = dateReceived.format("MMM D, YYYY");

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
      </div>`;

          new mapboxgl.Popup({ className: "mapbox-tooltip complaint-tooltip" })
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map);
        });

        map.on("click", "complaint-clusters", function (e) {
          var feature = e.features[0];
          var coordinates = feature.geometry.coordinates.slice();
          const complaintCount = e.features[0].properties.point_count;
          console.log("[mbmap.js] complaint count", complaintCount);

          // window.i18next.t("tooltips.complaintMultiple.title", { count: String(complaintCount) })}

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
          <span data-i18n="tooltips.complaintMultiple.time.label">${window.i18next.t(
            "tooltips.complaintMultiple.time.label"
          )}</span>
          <span data-i18n="tooltips.complaintMultiple.time.value">${window.i18next.t(
            "tooltips.complaintMultiple.time.value"
          )}</span>
        </div>
        <div class="tooltip-footer">
          <span data-i18n="tooltips.complaintMultiple.footer">${window.i18next.t(
            "tooltips.complaintMultiple.footer"
          )}</span>
        </div>
      </div>`;

          new mapboxgl.Popup({ className: "mapbox-tooltip complaint-tooltip" })
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map);
        });
      });
  } catch {
    console.log("Error creating complaints map layer");
  }
}

function beach_layer() {
  // beachwatch
  try {
    const beachVisible = document.querySelector("#beaches-filter-btn").classList.contains("active");
    // Add your GeoJSON source containing beach status
    map.addSource("beaches", {
      type: "geojson",
      data: `${urlbase}tijuana/beachwatch/output/current/sdbeachinfo_status_translated.geojson`,
    });

    // Create a symbol layer using the custom pin icon
    map.addLayer({
      id: "beaches",
      type: "symbol",
      source: "beaches",
      filter: ["!=", ["get", "LocationType"], "Outfall"],
      layout: {
        "icon-image": "beach_icon",
        "icon-size": iconSizing,
        "icon-allow-overlap": true,
        // Offset the icon so the tip of the pin points to the location
        "icon-offset": [0, 0],
        "visibility": beachVisible ? "visible" : "none",
      },
      paint: {
        // Use the RGBcolor property to tint the pin
        //"icon-color": ["get", "RBGColor"],
        'icon-color': [
          'match',
          ['get', 'beachStatus'], // Replace 'status' with your property name
          'Closure', '#ed1c25',   // When status is "active", use green
          'Open', '#33db17',
          'Advisory', '#fff204',
          'Outfall', '#000000',
          /* default */ '#f9a028' // warning... since we have not seen it in the data
        ]
      },
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
        "visibility": beachVisible ? "visible" : "none",
      },
      paint: {
        // Use the RGBcolor property to tint the pin
        "icon-color": "#000000",
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
      (beachData.statusNote) ?
        `<div class="tooltip-line beach-status-note">
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
    const spillVisible = document.querySelector("#spills-filter-btn").classList.contains("active");
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
        "visibility": spillVisible ? "visible" : "none",
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
    const h2sVisible = document.querySelector("#h2s-filter-btn").classList.contains("active");
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
        "icon-image": "h2s_icon",
        "icon-size": iconSizing,
        "icon-allow-overlap": true,
        // Offset the icon so the tip of the pin points to the location
        "icon-offset": [0, 0],
        "visibility": h2sVisible ? "visible" : "none",
      },
      paint: {
        // Use the level property to tint the pin
       // "icon-color": ["get", "level"],
        'icon-color': [
          'match',
          ['get', 'level'], // Replace 'status' with your property name
          'green', '#00e400',
          'yellow', '#ffff00',
          'orange', '#ff7e00',
          'purple', '#cc58db',
          /* default */ 'white' // For any other value, use blue
        ]
      },
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
    const watershedVisible = document.querySelector("#river-filter-btn").classList.contains("active");
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
    console.log("Could not add basin layer");
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

  let beachStatus =beachTooltipProperties['beachStatus'];
  console.log('beachStatus',beachStatus)
  let statusSince = null
  if( beachTooltipProperties['StatusSince'] != ''){
     statusSince = dayjs(beachTooltipProperties['StatusSince']);
  }

  console.log('statusSince',statusSince)
  let statusNote = beachTooltipProperties['StatusNote'];
  console.log('statusNote',statusNote)
  if  (window.i18next.language !== "en" && beachTooltipProperties['StatusNote_'+window.i18next.language]){
    statusNote = beachTooltipProperties['StatusNote_'+window.i18next.language]
    console.log('StatusNote'+window.i18next.language,statusNote)
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
    if (window.i18next.language !== "en" && beachTooltipProperties["Description_" + window.i18next.language]) {
      statusNote = beachTooltipProperties["Description_"+window.i18next.language];
      console.log('Description_'+ window.i18next.language,statusNote )
    }
    else {
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
map.on('load', function () {
  const icons = [
    { id: "spill_icon", url: "img/marker-spill-inverted_2.png" },
    { id: "outfall_icon", url: "img/marker-outlet-new-inverted_2.png" },
    { id: "beach_icon", url: "img/marker-beach.png" },
    { id: "complaint_icon", url: "img/marker-complaint.png" },
    { id: "h2s_icon", url: "img/marker-h2s.png" },
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
          map.addImage(icon.id, image, { sdf: true });
          resolve();
        }
      });
    });
  }

  Promise.all(icons.map((icon) => loadIcon(icon)))
    .then(() => {
      // All icons have loaded, you can proceed to add your layers.
      watershed_layer();
      spills_layer(spill_days);
      beach_layer();
      complaints_layer(complaint_days);
      h2s_layer();
      setMapLanguage();
    })
    .catch((err) => {
      console.error("Failed to load icons:", err);
    });
});
