$("#map").css("height", $(window).height()-350);

/***************************************************************
 ***************************************************************
 ***                    Map Instantiation                    ***
 ***************************************************************
 ***************************************************************/

let raster = new ol.layer.Tile({
    source: new ol.source.OSM()
});

let source = new ol.source.Vector();

let map = new ol.Map({
    target: 'map',
    layers: [raster],
    view: new ol.View({
        center: ol.proj.fromLonLat([point_of_interest.lng, point_of_interest.lat]), // focused on the destination position until the current position is reached
        zoom: 14
    })
});

console.log(helper_post);






/***************************************************************
 ***************************************************************
 ***                         Controls                        ***
 ***************************************************************
 ***************************************************************/

function redirectGoogleMaps() {
    let url = "https://www.google.com/maps/dir/?api=1&destination=" + point_of_interest.lat + "," + point_of_interest.lng + "&travelmode=car";
    let win = window.open(url, '_blank');
    win.focus();
}
let check_in = false;


function performCheckin() {
    check_in = !check_in;
    let data = {
        helper_login: helper.login,
        check_in: check_in
    };

    $.ajax({
        type: 'POST',
        url: '/helper/check_in',
        data: data,
        success: function (response) {
            if (JSON.parse(response).msg === "true") {
                $('#checkin-button').text('Check-out')
                    .attr('class', 'btn btn-default');
            } else {
                $('#checkin-button').text('Check-in')
                    .attr('class', 'btn btn-primary');
            }

        },
        error: function (response) {
        }
    });
}










loadPathToPost();

function loadPathToPost() {

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
            onSuccess: function (result) {
                var format = new ol.format.GeoJSON();
                var feature = new ol.Feature({
                    geometry: format.readGeometry(result.routeGeometry, {
                        featureProjection: "EPSG:3857"
                    })
                });
                feature.setStyle(new ol.style.Style({
                    stroke: new ol.style.Stroke({
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

