const s3base = "https://oss.resilientservice.mooo.com/"
const bucket = 'test'
const urlbase = `${s3base}${bucket}/`
mapboxgl.accessToken = 'pk.eyJ1IjoidmFsZW50aW5lZHd2IiwiYSI6ImNra215Y2QydDExd3oycHF0d2VvM2pwYXoifQ.sODwFshU0owiFxw6SKLeKg';
const map = new mapboxgl.Map({
  container: 'map-container', // container ID
  center: [-117.11, 32.58], // 32.58,-117.11 starting position [lng, lat]. Note that lat must be set between -90 and 90
  zoom: 12 // starting zoom
});
map.on('load', function () {
  // Add the GeoJSON source with clustering enabled
  map.addSource('points', {
    type: 'geojson',
    data: `${urlbase}tijuana/sd_complaints/raw/complaints.json`, // update the path or URL to your GeoJSON file
    cluster: true,
    clusterMaxZoom: 14, // max zoom to cluster points
    clusterRadius: 50   // radius of each cluster when clustering points (in pixels)
  });

  // Layer for clusters (as circles)
  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'points',
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
    id: 'cluster-count',
    type: 'symbol',
    source: 'points',
    filter: ['has', 'point_count'],
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
    source: 'points',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': '#11b4da',
      'circle-radius': 4,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff'
    }
  });

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
        'icon-size': .5,
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

  // spills
  map.loadImage('img/sewer-icon.png', function(error, image) {
    if (error) throw error;
    // Add the image with SDF enabled so it can be tinted dynamically
    map.addImage('sewage', image, { sdf: true });

    // Add your GeoJSON source containing beach status
    map.addSource('sewage', {
      type: 'geojson',
      data: `${urlbase}tijuana/ibwc/output/spills_last_by_site.geojson`
    });

    // Create a symbol layer using the custom pin icon
    map.addLayer({
      id: 'sewage',
      type: 'symbol',
      source: 'sewage',
      layout: {
        'icon-image': 'sewage',
        'icon-size': .1,
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
    map.on('click', 'sewage', function(e) {
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


  });

// h2s
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
        'icon-size': .5,
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
    map.on('click', 'h2s', function(e) {
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


  });
});
