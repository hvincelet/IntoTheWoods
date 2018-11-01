/**********************************/
/*       Instantiate the map      */
/**********************************/

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
                color: '#37474f'
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

/**********************************/
/*  Fn dedicated to PoI edition   */
/**********************************/

let modify = new ol.interaction.Modify({source: source});
// map.addInteraction(modify);

let draw, snap; // global so we can remove them later
let typeSelect;

function addInteractions() {
    map.removeInteraction(draw);
    draw = new ol.interaction.Draw({
        source: source,
        type: typeSelect
    });
    map.addInteraction(draw);


    createMeasureTooltip();
    var listener;
    draw.on('drawstart',
        function (evt) {
            // set sketch
            sketch = evt.feature;

            /** @type {module:ol/coordinate~Coordinate|undefined} */
            var tooltipCoord = evt.coordinate;

            listener = sketch.getGeometry().on('change', function (evt) {
                var geom = evt.target;
                var output;
                if (geom instanceof ol.geom.Polygon) {
                    output = formatArea(geom);
                    tooltipCoord = geom.getInteriorPoint().getCoordinates();
                } else if (geom instanceof ol.geom.LineString) {
                    output = formatLength(geom);
                    tooltipCoord = geom.getLastCoordinate();
                }
                measureTooltipElement.innerHTML = output;
                measureTooltip.setPosition(tooltipCoord);
            });
        }, this);

    draw.on('drawend',
        function () {
            measureTooltipElement.innerHTML += " de " + orderedCourseArray[idCurrentEditedCourse].sport_label;
            measureTooltipElement.className = 'tooltip tooltip-static';
            measureTooltipElement.style.backgroundColor = courseColorArray[idCurrentEditedCourse];
            measureTooltipElement.style.borderTopColor = courseColorArray[idCurrentEditedCourse];


            measureTooltip.setOffset([0, -7]);
            // unset sketch
            sketch = null;
            // unset tooltip so that a new one can be created
            measureTooltipElement = null;
            createMeasureTooltip();
            ol.Observable.unByKey(listener);
        }, this);


}

snap = new ol.interaction.Snap({source: source});
map.addInteraction(snap);

function addPointOfInterest() {
    $('#panel-right').fadeOut();
    typeSelect = "Point";
    addInteractions();
}

/***************************************************************/
/***************************************************************/
/***                     Database access                     ***/
/***************************************************************/

    console.log(courseArray); // besoin du nom du sport

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
    let courseId = 0;
    courseArrayToLoad.forEach(function (course) {
        if (course !== null && course.length > 1) {
            let geom = new ol.geom.LineString(course);
            let feature = new ol.Feature({
                    geometry: geom,
                }
            );
            let order_num = 0;
            orderedCourseArray.forEach(function (orderedCourse) {
                if (orderedCourse.id === courseId) {
                    order_num = orderedCourse.order_num;
                }
            });
            feature.setId("course_" + courseId);
            feature.setStyle(
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: courseColorArray[order_num - 1],
                        width: 6
                    })
                })
            );
            source.addFeature(feature);
        }
        courseId++;
    });
}

let pointOfInterestArrayToStore = [];
let courseArrayToStore = [];

function storeDatasToDB() {
    let features = vector.getSource().getFeatures();

<<<<<<< HEAD
    features.forEach(function (feature) {
        if (feature.getId().indexOf("point_of_interest") !== -1) {
            pointOfInterestArrayToStore.push({
                id: feature.getId().replace('point_of_interest_', ''),
                lng: ol.proj.toLonLat(feature.getGeometry().getCoordinates())[0],
                lat: ol.proj.toLonLat(feature.getGeometry().getCoordinates())[1]
            });
        } else {
            console.log("error: unrecognized feature");
        }
=======
    const actions = features.map(feature => {
        return new Promise((resolve, reject) => {

            // features.forEach(function (feature) {
            if (feature.getId().indexOf("point_of_interest") !== -1) {
                pointOfInterestArrayToStore.push({
                    id: feature.getId().replace('point_of_interest_', ''),
                    lng: ol.proj.toLonLat(feature.getGeometry().getCoordinates())[0],
                    lat: ol.proj.toLonLat(feature.getGeometry().getCoordinates())[1]
                });
                return resolve();
            } else if (feature.getId().indexOf("course") !== -1) {
                courseArrayToStore.push({
                    id: feature.getId().replace('course_', ''),
                    track_point_array: feature.getGeometry().getCoordinates()
                });
                return resolve();
            } else {
                console.log("error: unrecognized feature");
                return resolve();
            }
>>>>>>> Synchronization of feature ids between client and server + save the state of the map when clicking on validate editing

        });
    });

    Promise.all(actions)
        .then(result => {
            pointOfInterestArrayToStore = [];
            courseArrayToStore = [];
        }).catch(err => console.log(err));

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
            updateFeaturesId(response)
        },
        error: function (response) {
        }
    });

}

<<<<<<< HEAD
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

//https://openlayers.org/en/latest/examples/select-features.html
//selectInteraction.getFeatures();

/**********************************/
/*           Interaction          */
/**********************************/
=======
function updateFeaturesId(data) {
    data.pointOfInterestUpdatedIdArray.map(pointOfInterestUpdatedId => {
        console.log("new_point_of_interest_" + pointOfInterestUpdatedId.clientId);
        let feature = vector.getSource().getFeatureById("new_point_of_interest_" + pointOfInterestUpdatedId.clientId);
        feature.setId("point_of_interest_" + pointOfInterestUpdatedId.serverId);
    });
}

/***************************************************************/
/***************************************************************/
/***                        Interaction                      ***/
/***************************************************************/
/***************************************************************/
>>>>>>> Synchronization of feature ids between client and server + save the state of the map when clicking on validate editing

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

let temp_id_num = 1;

function getFeatureIDFromCoordinates(coordinates) {
    // Get the array of features
    let allFeatures = vector.getSource().getFeatures();

    // Go through this array and get coordinates of their geometry.
    allFeatures.forEach(function (feature) {

        if ((ol.proj.toLonLat(feature.getGeometry().getCoordinates())[0] === coordinates[0]) &&
            (ol.proj.toLonLat(feature.getGeometry().getCoordinates())[1] === coordinates[1])) {

            if (feature.getId() === undefined) { // this is a newly created feature
                console.log("Newly created feature");
                feature.setId("new_point_of_interest_" + temp_id_num++);
                showPopup(feature, "Créer le point d'intérêt");
            } else {
                console.log("Id of the selected feature : " + feature.getId());
                showPopup(feature, "Editer le point d'intérêt");
            }

        }

    });
    return undefined;
}


// TODO : popup à la création d'un point d'intérêt


/**********************************/
/*             Popup              */
/**********************************/

/**
 * Add a click handler to hide the popup.
 * @return {boolean} Don't follow the href.
 */
closer.onclick = function () {
    overlay.setPosition(undefined);
    closer.blur();
    return false;
};

function showPopup(feature, header) {
    content.innerHTML = '<h6>' + header + '</h6>' +
        '<div class="input-group-sm">' +
        '<input id="' + feature.getId() + '_label" type="text" class="form-control" placeholder="intitulé du poste">' +
        '<div class="row">' +
        '<div class="col"><p>Nombre de bénévole :</p></div>' +
        '<div class="col-sm-4 input-group-sm"><input id="' + feature.getId() + '_nbHelper" type="number" value="1" class="form-control" min="1"></div>' +
        '</div>' +
        '</div>' +
        '<button id="type" class="btn btn-xs btn-danger" onclick="removePointOfInterest(\'' + feature.getId() + '\')">supprimer</button>' +
        '<button id="type" class="btn btn-xs btn-default" onclick="createHelperPost(\'' + feature.getId() + '\')">enregistrer</button>';
    overlay.setPosition(feature.getGeometry().getCoordinates());
}

/***************************************************************/
/***************************************************************/
/***                       Help Tooltip                      ***/
/***************************************************************/
/***************************************************************/

let helpTooltipElement;
let helpTooltip;

let pointerMoveHandler = function (evt) {
    if (currentFeatureEditing === "course") {
        if (evt.dragging) {
            return;
        }
        helpTooltip.setPosition(evt.coordinate);
    }
};

createHelpTooltip();

map.on('pointermove', pointerMoveHandler);

map.getViewport().addEventListener('mouseout', function () {
    helpTooltipElement.classList.add('hidden');
});

function createHelpTooltip() {
    if (helpTooltipElement) {
        helpTooltipElement.parentNode.removeChild(helpTooltipElement);
    }
    helpTooltipElement = document.createElement('div');
    helpTooltipElement.className = 'tooltip hidden';
    helpTooltip = new ol.Overlay({
        element: helpTooltipElement,
        offset: [15, 0],
        positioning: 'center-left'
    });
}

function addHelpTooltipOverlay(msg) {
    helpTooltipElement.innerHTML = msg;
    map.addOverlay(helpTooltip);
}

function updateHelpTooltipOverlay(msg) {
    helpTooltipElement.innerHTML = msg;
}

/***************************************************************/
/***************************************************************/
/***                     Measure Tooltip                     ***/
/***************************************************************/
/***************************************************************/

let measureTooltipElement;
let measureTooltip;

let formatLength = function (line) {
    let length = ol.sphere.getLength(line);
    let output;
    if (length > 100) {
        output = (Math.round(length / 1000 * 100) / 100) +
            ' ' + 'km';
    } else {
        output = (Math.round(length * 100) / 100) +
            ' ' + 'm';
    }
    return output;
};

let formatArea = function (polygon) {
    let area = getArea(polygon);
    let output;
    if (area > 10000) {
        output = (Math.round(area / 1000000 * 100) / 100) +
            ' ' + 'km<sup>2</sup>';
    } else {
        output = (Math.round(area * 100) / 100) +
            ' ' + 'm<sup>2</sup>';
    }
    return output;
};

function createMeasureTooltip() {
    if (measureTooltipElement) {
        measureTooltipElement.parentNode.removeChild(measureTooltipElement);
    }
    measureTooltipElement = document.createElement('div');
    measureTooltipElement.className = 'tooltip tooltip-measure';
    measureTooltip = new ol.Overlay({
        element: measureTooltipElement,
        offset: [0, -15],
        positioning: 'bottom-center'
    });
    map.addOverlay(measureTooltip);
}


/***************************************************************/
/***************************************************************/
/***                         Top Panel                       ***/
/***************************************************************/
/***************************************************************/

let editing = false;

function showTopPanel() {
    if (editing) {
        storeDatasToDB();
        map.removeInteraction(modify);
        map.removeOverlay(helpTooltip);
        resetInteraction();
        $('#add_point_of_interest_button').hide();
        $('#add_course_button').hide();
        $('#edit_button_icon').text(' Éditer la carte');
        $('#edit_button_icon').attr('class', 'fas fa-map-marked');
        $('#edit_button').attr('class', 'btn btn-info');
        editing = false;
    } else {
        map.addInteraction(modify);
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

let courseColorArray = ["#5c6bc0", "#ef5350", "#ffa726", "#66bb6a", "#7e57c2"];
function updateSelectedCourse() {
    $('#current_course').css('background-color', courseColorArray[idCurrentEditedCourse]);
    $('#current_course').text(courseArray[idCurrentEditedCourse].sport_label);
}
//TODO measurement: https://openlayers.org/en/latest/examples/measure.html
//TODO Centré sur la france si pas de localisation
//TODO bouton pour enregistrer les changements
//TODO Centré sur la france si pas de localisation
//TODO bouton pour enregistrer les changements

function createHelperPost(featureId) {
    console.log($('#' + featureId + '_label').val());
    console.log($('#' + featureId + '_nbHelper').val());
}
