/**********************************/
/*       Instantiate the map      */
/**********************************/

// init view
let view = new ol.View({
    center: ol.proj.fromLonLat([point_of_interest.lng,point_of_interest.lat]),
    zoom: 14
});

// init raster tile
let raster = new ol.layer.Tile({
    source: new ol.source.OSM()
});

// init source
let source = new ol.source.Vector();

// create map
let map = new ol.Map({
    target: 'map',
    layers: [raster],
    view: view
});

// geolocation init
let geo = new ol.Geolocation({
    trackingOptions: {
        enableHighAccuracy: true
    }
});

// geolocation tracking init
let my_lon = 0;
let my_lat = 0;
let local_lon_lat = 0

// geolocation tracking action
geo.setTracking(true);

// geolocation change position
geo.on('change',function(){

    local_lon_lat = geo.getPosition();
    my_lon = local_lon_lat[0];
    my_lat = local_lon_lat[1];
    console.log("(my_lat, my_lon) : ("+my_lat+", "+my_lon+")");

    map.setView(new ol.View({
        center: ol.proj.fromLonLat([my_lon,my_lat]),
        zoom: map.getView().getZoom()
    }));

    let graph = 'Pieton';
    let routePreference = 'shortest';

    try {
        Gp.Services.route({
            startPoint: {
                x: my_lon,
                y: my_lat
            },
            endPoint: {
              x: point_of_interest.lng,
              y: point_of_interest.lat
            },
            graph: graph,
            routePreference: routePreference,
            apiKey: "jhyvi0fgmnuxvfv0zjzorvdn",
            onSuccess: function(result) {
                var format= new ol.format.GeoJSON() ;
                var feature= new ol.Feature({
                    geometry : format.readGeometry(result.routeGeometry, {
                        featureProjection:"EPSG:3857"
                    })
                });
                feature.setStyle(new ol.style.Style({
                    stroke : new ol.style.Stroke({
                        color: 'blue',
                        width: 5
                    })
                }));
                var vectorSource = new ol.source.Vector({
                    features: [feature]
                });
                var vectorLayer = new ol.layer.Vector({
                    source: vectorSource
                });
                map.addLayer(vectorLayer);
            }
        });
    } catch (e) {
      console.log(e);
    }
});

// geolocation error
geo.on('error', function(error) {
    var info = document.getElementById('info');
    info.innerHTML = error.message;
});

function gpsMod(){

    // Mode full screen
       // disable header
       let el_mapHeader = document.getElementById('mapHeader');
       el_mapHeader.style.display = 'none';
       // disable copyright
       let el_copyright = document.getElementById('copyright');
       el_copyright.style.display = 'none';
       // disable gps button
       let el_gpsButton = document.getElementById('gpsButton');
       el_gpsButton.style.display = 'none';
       // update body
       let el_body = document.body;
       el_body.style.margin = '0';
       el_body.style.padding = '0';
       el_body.style.width = '100%';
       el_body.style.height = '100%';
       // update html
       let el_html = document.html;
       el_html.style.margin = '0';
       el_html.style.padding = '0';
       el_html.style.width = '100%';
       el_html.style.height = '100%';
       // up width and height of map
       let el_map = document.getElementById('map');
       el_map.style.margin = '0';
       el_map.style.padding = '0';
       el_map.style.width = '100%';
       el_map.style.height = '100%';

    // geolocation change position
    geo.on('change',function(){

        local_lon_lat = geo.getPosition();
        my_lon = local_lon_lat[0];
        my_lat = local_lon_lat[1];
        console.log("(my_lat, my_lon) : ("+my_lat+", "+my_lon+")");

        map.setView(new ol.View({
            center: ol.proj.fromLonLat([my_lon,my_lat]),
            zoom: 18
        }));

        let graph = 'Pieton';
        let routePreference = 'shortest';

        try {
            Gp.Services.route({
                startPoint: {
                    x: my_lon,
                    y: my_lat
                },
                endPoint: {
                  x: point_of_interest.lng,
                  y: point_of_interest.lat
                },
                graph: graph,
                routePreference: routePreference,
                apiKey: "jhyvi0fgmnuxvfv0zjzorvdn",
                onSuccess: function(result) {
                    var format= new ol.format.GeoJSON() ;
                    var feature= new ol.Feature({
                        geometry : format.readGeometry(result.routeGeometry, {
                            featureProjection:"EPSG:3857"
                        })
                    });
                    feature.setStyle(new ol.style.Style({
                        stroke : new ol.style.Stroke({
                            color: 'blue',
                            width: 5
                        })
                    }));
                    var vectorSource = new ol.source.Vector({
                        features: [feature]
                    });
                    var vectorLayer = new ol.layer.Vector({
                        source: vectorSource
                    });
                    map.addLayer(vectorLayer);
                }
            });
        } catch (e) {
          console.log(e);
        }
    });
}
