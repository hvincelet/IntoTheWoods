/**********************************/
/*       Instantiate the map      */
/**********************************/

let raster = new ol.layer.Tile({
    source: new ol.source.OSM()
});

let source = new ol.source.Vector();

let map = new ol.Map({
    target: 'map',
    layers: [raster],
    view: new ol.View({
        center: ol.proj.fromLonLat([-3.4624261999999817, 48.729673]),
        zoom: 16
    })
});

loadPathToPost();

function loadPathToPost(){

    let lat1 = 48.7268687;
    let lng1 = -3.4599370999999337;

    let graph = 'Pieton';
    let routePreference = 'shortest';

    try {
        Gp.Services.route({
            startPoint: {
                x: lng1,
                y: lat1
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
                        color: 'red',
                        width: 3
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
}

// https://www.google.com/maps/dir/?api=1&destination=48.737251,-3.4872647100484073&travelmode=car