const s3base = "https://oss.resilientservice.mooo.com/"
const bucket = 'test'
const urlbase = `${s3base}${bucket}/`
mapboxgl.accessToken = 'pk.eyJ1IjoidmFsZW50aW5lZHd2IiwiYSI6ImNra215Y2QydDExd3oycHF0d2VvM2pwYXoifQ.sODwFshU0owiFxw6SKLeKg';
const map = new mapboxgl.Map({
  container: 'map-container', // container ID
  center: [-117.13, 32.56], // 32.58,-117.11 starting position [lng, lat]. Note that lat must be set between -90 and 90
  zoom: 12 , // starting zoom
  maxBounds: [
    [-118, 32], // Southwest coordinates
    [-116, 34]  // Northeast coordinates
  ]
});

function setGroupVisibility(map, layerInfo, visibility) {
  layerInfo.layers.forEach(layerId => {
    // Ensure the layer exists before attempting to change it
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', visibility);
    }
  });
}

function complaints_layer(){
  fetch(`${urlbase}tijuana/sd_complaints/output/complaints.geojson`)// update the path or URL to your GeoJSON file
    .then(response => response.json())
    .then(data => {
      map.addSource('complaints', {
      type: 'geojson',
      data: data,
      cluster: true,
      clusterMaxZoom: 14, // max zoom to cluster points
      clusterRadius: 50   // radius of each cluster when clustering points (in pixels)
    });
      const threeDaysAgo = dayjs().subtract(3, 'day');
      console.log('days ago date: ' , threeDaysAgo)
      // Filter features where the "Date Recieved" is within the last three days.
      // Adjust the date parsing if your format differs.
      var filteredFeatures = data.features.filter(feature => {
        var dateReceived = new Date(feature.properties['date_received']);
        return dateReceived >= threeDaysAgo;
      });
      console.log('complaints after filter: ' , filteredFeatures.length)

      // Create a new FeatureCollection with filtered features
      var filteredData = {
        type: 'FeatureCollection',
        features: filteredFeatures
      };
      console.log('features:', filteredData)
      map.addSource('complaints_lastdays', {
        type: 'geojson',
        data: filteredData,
        cluster: true,
        clusterMaxZoom: 14, // max zoom to cluster points
        clusterRadius: 50   // radius of each cluster when clustering points (in pixels)
      });
    // Layer for clusters (as circles) for all
    map.addLayer({
      id: 'clusters-all',
      layout: { visibility: 'none',},
      type: 'circle',
      source: 'complaints',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#51bbd6',
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,   // circle radius when count is less than first step
          100,  // first step threshold
          30,   // circle radius for count >= 100
          750,  // second step threshold
          40    // circle radius for count >= 750
        ]
      }
    });

    // Layer for cluster count labels
    map.addLayer({
      id: 'cluster-count-all',

      type: 'symbol',
      source: 'complaints',
      filter: ['has', 'point_count'],
      layout: {
        visibility: 'none',
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      }
    });

    // Layer for unclustered individual points
    map.addLayer({
      id: 'unclustered-point-all',
      layout: { visibility: 'none',},
      type: 'circle',
      source: 'complaints',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#11b4da',
        'circle-radius': 4,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff'
      }
    });
    // Layer for clusters (as circles) for all

    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'complaints_lastdays',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#51bbd6',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff',
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,   // circle radius when count is less than first step
          100,  // first step threshold
          30,   // circle radius for count >= 100
          750,  // second step threshold
          40    // circle radius for count >= 750
        ]
      }
    });

    // Layer for cluster count labels
    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'complaints_lastdays',
      filter:  ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      }
    });

    // Layer for unclustered individual points
    map.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'complaints_lastdays',
      filter:
        ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#11b4da',
        'circle-radius': 4,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff'
      }
    });
  });

}

function beach_layer(){
  // beachwatch
  map.loadImage('img/droplet.png', function(error, image) {
    if (error) throw error;
    // Add the image with SDF enabled so it can be tinted dynamically
    map.addImage('pin', image, { sdf: true });

    // Add your GeoJSON source containing beach status
    map.addSource('beaches', {
      type: 'geojson',
      data: `${urlbase}tijuana/beachwatch/output/beachwatch_closures.geojson`
    });

    // Create a symbol layer using the custom pin icon
    map.addLayer({
      id: 'beaches',
      type: 'symbol',
      source: 'beaches',
      layout: {
        'icon-image': 'pin',
        'icon-size': [
          'interpolate',
          ['linear'],
          ['zoom'],
          5, .1,  // At zoom level 5, text size 10
          12, .3,  // At zoom level 12, text size 18
          14, .5
        ],
        'icon-allow-overlap': true,
        // Offset the icon so the tip of the pin points to the location
        'icon-offset': [0, 0]
      },
      paint: {
        // Use the RGBcolor property to tint the pin
        'icon-color': ['get', 'RBGColor']
      }
    });

    // Add a popup when a pin is clicked
    map.on('click', 'beaches', function(e) {
      var feature = e.features[0];
      var coordinates = feature.geometry.coordinates.slice();
      var name = feature.properties.Name;
      var description = feature.properties.Description;
      var popupContent = `<h3>${name}</h3>${description}`;

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(popupContent)
        .addTo(map);
    });

    // Change the cursor to a pointer when over the pins.
    map.on('mouseenter', 'beaches', function() {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'beaches', function() {
      map.getCanvas().style.cursor = '';
    });
  });
}

function spills_layer(){
  // spills
  map.loadImage('img/sewer-icon.png', function(error, image) {
    if (error) throw error;
    // Add the image with SDF enabled so it can be tinted dynamically
    map.addImage('sewage', image, { sdf: true });

    // Add your GeoJSON source containing beach status
    map.addSource('spills', {
      type: 'geojson',
      data: `${urlbase}tijuana/ibwc/output/spills_last_by_site.geojson`
    });
    const thirtyDaysAgo = dayjs().subtract(30, 'day').toISOString();
    // Create a symbol layer using the custom pin icon
    map.addLayer({
      id: 'spills',
      type: 'symbol',
      source: 'spills',
      filter:['any' ,
      ['>=', ['get', 'End Time'], thirtyDaysAgo] ,
        ['>=', ['get', 'Start Time'], thirtyDaysAgo] ,
      ],
      layout: {
        'icon-image': 'sewage',
        //'icon-size': .1,
        'icon-size': [
          'interpolate',
          ['linear'],
          ['zoom'],
          5, .05,  // At zoom level 5, text size 10
          12, .07,  // At zoom level 12, text size 18
          14, .1
        ],
        'icon-allow-overlap': true,
        // Offset the icon so the tip of the pin points to the location
        'icon-offset': [0, 0]
      },
      // paint: {
      //   // Use the RGBcolor property to tint the pin
      //   'icon-color': ['get', 'RBGColor']
      // }
    });

    // Add a popup when a pin is clicked
    map.on('click', 'spills', function(e) {
      var feature = e.features[0];
      var coordinates = feature.geometry.coordinates.slice();
      var name = feature.properties['Discharge Location'];
      var dates = feature.properties['Start Date'] + 'to ' +  feature.properties['End Date'];
      var volume = feature.properties['Approximate Discharge Volume'];
      var popupContent = `<h3>${name}</h3><div>${dates}</div>${volume}`;

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(popupContent)
        .addTo(map);
    });


  });
}

function h2s_layer(){
  map.loadImage('img/cloud.png', function(error, image) {
    if (error) throw error;
    // Add the image with SDF enabled so it can be tinted dynamically
    map.addImage('cloud', image, { sdf: true });

    // Add your GeoJSON source containing beach status
    map.addSource('h2s', {
      type: 'geojson',
      data: `${urlbase}tijuana/sd_apcd_air/output/lastvalue_h2s.geojson`
    });

    // Create a symbol layer using the custom pin icon
    map.addLayer({
      id: 'h2s',
      type: 'symbol',
      source: 'h2s',
      layout: {
        'icon-image': 'cloud',
        'icon-size': [
          'interpolate',
          ['linear'],
          ['zoom'],
          5, .3,  // At zoom level 5, text size 10
          12, .4,  // At zoom level 12, text size 18
          14, .5
        ],
        'icon-allow-overlap': true,
        // Offset the icon so the tip of the pin points to the location
        'icon-offset': [0, 0]
      },
      paint: {
        // Use the level property to tint the pin
        'icon-color': ['get', 'level']
      }
    });

    // Add a popup when a pin is clicked
    map.on('click', 'h2s', function(e) {
      var feature = e.features[0];
      var coordinates = feature.geometry.coordinates.slice();
      var name = feature.properties['Site Name'];
      var description = feature.properties.Result;
      var airnow_link = `https://www.airnow.gov/?city=${feature.properties['Site Name']}&state=CA&country=USA`
      var popupContent = `<h3 xmlns="http://www.w3.org/1999/html">${name}</h3>${description}<div><a href="${airnow_link}"/>AirNow</a></div>`;

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(popupContent)
        .addTo(map);
    });

    map.addLayer({
      id: 'h2s-value',
      type: 'symbol',
      source: 'h2s',

      layout: {
        'text-field': ['get', 'Original Value'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      },
      paint: {
        'text-color': '#000'
      }
    });
    map.addLayer({
      id: 'h2s-name',
      type: 'symbol',
      source: 'h2s',

      layout: {
        'text-field': ['get', 'LongName'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12,
        'text-offset': [0,3]
      },
      paint: {
        'text-color': '#000'
      }
    });
  });
}
map.on('load', function () {
  // Add the GeoJSON source with clustering enabled
  beach_layer()
  spills_layer()
  complaints_layer()
  h2s_layer()





// h2s

});
