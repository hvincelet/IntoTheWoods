/***************************************************************/
/***************************************************************/
/***                    Map Instantiation                    ***/
/***************************************************************/
/***************************************************************/

let raster = new ol.layer.Tile({
    source: new ol.source.OSM()
});

let source = new ol.source.Vector();

let vector = new ol.layer.Vector({
    source: source,

    style: new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new ol.style.Stroke({
            color: '#5c6bc0',
            width: 6
        }),
        image: new ol.style.Circle({
            radius: 6,
            fill: new ol.style.Fill({
                color: '#e53935'
            })
        })
    })
});

/**
 * Create an overlay to anchor the popup to the map.
 */
let container = document.getElementById('popup');
let content = document.getElementById('popup-content');
let closer = document.getElementById('popup-closer');

let overlay = new ol.Overlay({
    element: container,
    autoPan: true,
    autoPanAnimation: {
        duration: 250
    }
});

let map = new ol.Map({
    target: 'map',
    layers: [raster, vector],
    overlays: [overlay],
    view: new ol.View({
        center: ol.proj.fromLonLat([raid.lng, raid.lat]),
        zoom: 13
    })
});

loadPointsOfInterest();
loadCourses();

/***************************************************************/
/***************************************************************/
/***                      Draw & Modify                      ***/
/***************************************************************/
/***************************************************************/

let currentFeatureEditing = "none";

let modify = new ol.interaction.Modify({source: source});
map.addInteraction(modify);

let draw, snap; // global so we can remove them later
let typeSelect;

function addInteractions() {
    map.removeInteraction(draw);
    draw = new ol.interaction.Draw({
        source: source,
        type: typeSelect
    });

    map.addInteraction(draw);
}

snap = new ol.interaction.Snap({source: source});
map.addInteraction(snap);

function resetInteraction() {
    $('#panel-right').hide();
    currentFeatureEditing = "none";
    map.removeInteraction(draw);
}

/***************************************************************/
/***************************************************************/
/***                      Database access                    ***/
/***************************************************************/

/***************************************************************/

function loadPointsOfInterest() {
    pointOfInterestArrayToLoad.forEach(function (pointOfInterest) {
        let geom = new ol.geom.Point(ol.proj.fromLonLat(pointOfInterest.lonlat));
        let feature = new ol.Feature({
                geometry: geom,
            }
        );
        feature.setId("point_of_interest_" + pointOfInterest.id);
        source.addFeature(feature);
    });
}

function loadCourses() {
    let courseID = 0;
    courseArrayToLoad.forEach(function (course) {
        if (course !== null && course.length > 1) {
            let geom = new ol.geom.LineString(course);
            let feature = new ol.Feature({
                    geometry: geom,
                }
            );
            let order_num = 0;
            orderedCourseArray.forEach(function (orderedCourse) {
                if (orderedCourse.id === courseID){
                    order_num = orderedCourse.order_num;
                }
            });

            feature.setId("course_" + courseID);
            feature.setStyle(
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: courseColorArray[order_num-1],
                        width: 6
                    })
                })

            );
            source.addFeature(feature);
        }
        courseID++;
    });
}


let pointOfInterestArrayToStore = [];
let courseArrayToStore = [];

function storeDatasToDB() {
    let features = vector.getSource().getFeatures();

    features.forEach(function (feature) {
        if (feature.getId().indexOf("point_of_interest") !== -1) {
            pointOfInterestArrayToStore.push({
                id: feature.getId().replace('point_of_interest_', ''),
                lng: ol.proj.toLonLat(feature.getGeometry().getCoordinates())[0],
                lat: ol.proj.toLonLat(feature.getGeometry().getCoordinates())[1]
            });
        } else if (feature.getId().indexOf("course") !== -1) {
            courseArrayToStore.push({
                id: feature.getId().replace('course_', ''),
                track_point_array: feature.getGeometry().getCoordinates()
            });
        } else {
            console.log("error: unrecognized feature");
        }

    });

    let data = {
        pointOfInterestArray: pointOfInterestArrayToStore,
        courseArray: courseArrayToStore,
        defaultCourseArrayID: orderedCourseArray[0].id
    };
    $.ajax({
        type: 'POST',
        url: '/editraid/map',
        data: data,
        success: function (response) {
        },
        error: function (response) {
        }
    });
}

/***************************************************************/
/***************************************************************/
/***                        Interaction                      ***/
/***************************************************************/
/***************************************************************/

let selectElement = "singleselect";
// lookup for selection objects
let selection = {};
// feature property to act as identifier
let idProp = 'iso_a3';

map.on('click', function (event) {
    let selectedFeatures = map.getFeaturesAtPixel(event.pixel);
    if (selectedFeatures) {

        let feature = selectedFeatures[0];
        let fid = feature.get(idProp);

        if (selectElement.value === 'singleselect') {
            selection = {};
        }
        // add selected feature to lookup
        selection[fid] = feature;

        if (currentFeatureEditing === "course") {
            setCourseFeature();
        } else {
            setPointOfInterestFromCoordinates(ol.proj.toLonLat(selection[fid].getGeometry().getCoordinates()));
        }


    } else {
        overlay.setPosition(undefined);
        console.log("There is no feature(s) here");
    }
});

/***************************************************************/
/***************************************************************/
/***                           Popup                         ***/
/***************************************************************/
/***************************************************************/

closer.onclick = function () {
    overlay.setPosition(undefined);
    closer.blur();
    return false;
};

function showPopup(feature, header) {
    content.innerHTML = '<h6>' + header + '</h6>' +
        '<div class="input-group input-group-sm">' +
        '<input type="text" class="form-control" placeholder="intitulé du poste">' +
        '</div>' +
        '<button id="type" class="btn btn-xs btn-danger" onclick="removePointOfInterest(\'' + feature.getId() + '\')">supprimer</button>' +
        '<button id="type" class="btn btn-xs btn-default">enregistrer</button>';
    overlay.setPosition(feature.getGeometry().getCoordinates());
}

/***************************************************************/
/***************************************************************/
/***                         Top Panel                       ***/
/***************************************************************/
/***************************************************************/

let editing = false;

function animationTest() {
    if (editing) {
        resetInteraction();
        $('#add_point_of_interest_button').hide();
        $('#add_course_button').hide();
        $('#edit_button_icon').text(' Éditer la carte')
            .attr('class', 'fas fa-map-marked');
        $('#edit_button').attr('class', 'btn btn-info');
        editing = false;
    } else {
        $('#edit_button_icon').text('')
            .attr('class', 'fas fa-check');
        $('#edit_button').attr('class', 'btn btn-success');
        $('#add_point_of_interest_button').show("fast");
        $('#add_course_button').show("fast");
        editing = true;
    }
}

let idCurrentEditedCourse = 0;

function previousCourse() {
    if (idCurrentEditedCourse === 0) {
        idCurrentEditedCourse = orderedCourseArray.length - 1;
    } else {
        idCurrentEditedCourse--;
    }
    updateSelectedCourse();
}

function nextCourse() {
    if (idCurrentEditedCourse === orderedCourseArray.length - 1) {
        idCurrentEditedCourse = 0;
    } else {
        idCurrentEditedCourse++;
    }
    updateSelectedCourse();
}

//TODO measurement: https://openlayers.org/en/latest/examples/measure.html