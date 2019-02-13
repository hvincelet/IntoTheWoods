$("#map").css("height", $(window).height() - 300);

/***************************************************************
 ***************************************************************
 ***                    Map Instantiation                    ***
 ***************************************************************
 ***************************************************************/

let raster = new ol.layer.Tile({
    source: new ol.source.OSM()
});

let view = new ol.View({
    center: ol.proj.fromLonLat([point_of_interest.lng, point_of_interest.lat]), // focused on the destination position until the current position is reached
    zoom: 17
});

let map = new ol.Map({
    target: 'map',
    layers: [raster],
    view: view
});

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

check_in = helper.check_in === 1;
updateCheckinButton(check_in);

function performCheckin() {
    // allow check-in if the helper is close to the point of interest, for ex : 15m
    if (distance <= 15 || check_in) {
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
                updateCheckinButton((JSON.parse(response).msg === 'true'));
            },
            error: function (response) {
            }
        });
    } else {
        alert("Vous devez vous trouvez à proximité de votre point d'intérêt pour effectuer cette action");
    }
}

function updateCheckinButton(isChecked) {
    if (isChecked) {
        $('#checkin_button_icon').text('').attr('class', 'fas fa-user-check');
        $('#checkin-button').attr('class', 'btn btm-sm btn-success');
        $('#checkin_icon_label').text("Check-out");
    } else {
        $('#checkin_button_icon').text('').attr('class', 'fas fa-user-check');
        $('#checkin-button').attr('class', 'btn btm-sm btn-default');
        $('#checkin_icon_label').text("Check-in");
    }
}

function recenterMap() {
    if (position !== null)
        view.setCenter(ol.proj.fromLonLat(position));
}

/***************************************************************
 ***************************************************************
 ***                           UI                            ***
 ***************************************************************
 ***************************************************************/

let circle = new ol.geom.Circle(ol.proj.fromLonLat([point_of_interest.lng, point_of_interest.lat]), 30);
let feature = new ol.Feature({
        geometry: circle,
        style: new ol.style.Style({
            image: new ol.style.Circle({
                stroke: new ol.style.Stroke({
                    color: '#2196f3',
                    width: 2
                }),
            }),
            zIndex: 5
        })
    }
);

// Source and vector layer
let vectorSource = new ol.source.Vector({
    projection: 'EPSG:4326'
});
vectorSource.addFeature(feature);
let vectorLayer = new ol.layer.Vector({
    source: vectorSource
});

map.addLayer(vectorLayer);

// create an Overlay using the div with id location.
let marker_target = new ol.Overlay({
    element: document.getElementById('location_target'),
    positioning: 'bottom-left',
    stopEvent: false
});

// add it to the map
map.addOverlay(marker_target);

marker_target.setPosition(ol.proj.fromLonLat([point_of_interest.lng, point_of_interest.lat]));

// Calculate Countdown between raid programmed time and current
moment.locale('fr');
window.setInterval(function () {
    if (moment(raid.date + "-" + raid.start_time, "YYYY-MM-DD-hh:mm:ss").isAfter()) {
        $('#countdownTime').text("Début du raid " + moment(raid.date + "-" + raid.start_time, "YYYY-MM-DD-hh:mm:ss").fromNow());
    } else {
        $('#countdownTime').text("Le raid est en cours");
    }
}, 1000);


/***************************************************************
 ***************************************************************
 ***                       Geolocation                       ***
 ***************************************************************
 ***************************************************************/

let position;
let distance;

// create an Overlay using the div with id location.
let marker = new ol.Overlay({
    element: document.getElementById('location'),
    positioning: 'bottom-left',
    stopEvent: false
});

// add it to the map
map.addOverlay(marker);

// create a Geolocation object setup to track the position of the device
let geolocation = new ol.Geolocation({
    tracking: true
});

geolocation.on('change:position', function () {
    position = geolocation.getPosition();
    view.setCenter(ol.proj.fromLonLat(position));
    marker.setPosition(ol.proj.fromLonLat(position));
    loadPathToPost(position);

    $('#distance_label').text(formatDistance(distanceBetweenPoints(ol.proj.fromLonLat(position), ol.proj.fromLonLat([point_of_interest.lng, point_of_interest.lat]))));
    distance = distanceBetweenPoints(ol.proj.fromLonLat(position), ol.proj.fromLonLat([point_of_interest.lng, point_of_interest.lat]));
    if (distance > 15 && check_in) {
        check_in = false;
        updateCheckinButton(check_in);
    }
});

function distanceBetweenPoints(lonlat1, lonlat2) {
    let line = new ol.geom.LineString([lonlat1, lonlat2]);
    return Math.round(line.getLength() * 100) / 100;
}

function formatDistance(length) {
    if (length >= 1000) {
        length = (Math.round(length / 1000 * 100) / 100) +
            ' ' + 'km';
    } else {
        length = Math.round(length) +
            ' ' + 'm';
    }
    return length;
}

/***************************************************************
 ***************************************************************
 ***                       Path finding                      ***
 ***************************************************************
 ***************************************************************/

// loadPathToPost([48.729577899999995, -3.4643091999999998]);

function loadPathToPost(currentPosition) {

    let graph = 'Pieton';
    let routePreference = 'shortest';

    try {
        Gp.Services.route({
            startPoint: {
                x: currentPosition[0],
                y: currentPosition[1]
            },
            endPoint: {
                x: point_of_interest.lng,
                y: point_of_interest.lat
            },
            graph: graph,
            routePreference: routePreference,
            apiKey: "jhyvi0fgmnuxvfv0zjzorvdn",
            onSuccess: function (result) {
                let format = new ol.format.GeoJSON();
                let feature = new ol.Feature({
                    geometry: format.readGeometry(result.routeGeometry, {
                        featureProjection: "EPSG:3857"
                    })
                });
                feature.setStyle(new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#2196f3',
                        width: 8,
                        lineDash: [.1, 12]
                    })
                }));
                let vectorSource = new ol.source.Vector({
                    features: [feature]
                });
                let vectorLayer = new ol.layer.Vector({
                    source: vectorSource
                });
                map.addLayer(vectorLayer);
            }
        });
    } catch (e) {
        console.log(e);
    }
}

/***************************************************************
 ***************************************************************
 ***                        Chat socket                      ***
 ***************************************************************
 ***************************************************************/

const socket = io();
socket.on('receiving', function (msg) {
    msg = JSON.parse(msg);
    console.log(msg);

    let $MESSAGE_RECEIVED_MODAL = $('#messageReceivedModal');
    let $MESSAGE_RECEIVED_MODAL_TITLE = $('#messageReceivedDialog');
    let $MESSAGE_RECEIVED_MODAL_CONTENT = $('#messageReceivedContentDialog');

    $MESSAGE_RECEIVED_MODAL_TITLE.html("Message de : " + msg.name);
    $MESSAGE_RECEIVED_MODAL_CONTENT.html(msg.message);
    $MESSAGE_RECEIVED_MODAL.modal('show');
});
