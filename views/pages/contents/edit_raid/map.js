// Prevent change page during editing
$(window).bind('beforeunload', function (e) {
    if (editing) {
        return "Êtes-vous sûr de vouloir quitter le mode édition ?";
    }
});

/***************************************************************
 ***************************************************************
 ***                    Map Instantiation                    ***
 ***************************************************************
 ***************************************************************/

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
        zoom: 14
    })
});

/***************************************************************
 ***************************************************************
 ***                      Draw & Modify                      ***
 ***************************************************************
 ***************************************************************/

let currentFeatureEditing = "none";

let modify = new ol.interaction.Modify({source: source});

let draw, snap; // global so we can remove them later
let typeSelect;

function addInteractions() {
    map.removeInteraction(draw);
    draw = new ol.interaction.Draw({
        source: source,
        type: typeSelect
    });

    map.addInteraction(draw);

    createMeasureTooltip(idCurrentEditedCourse + 1);
    let listener;
    draw.on('drawstart',
        function (evt) {
            // set sketch
            sketch = evt.feature;

            /** @type {module:ol/coordinate~Coordinate|undefined} */
            let tooltipCoord = evt.coordinate;

            listener = sketch.getGeometry().on('change', function (evt) {
                let geom = evt.target;
                let output;
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
            distance = measureTooltipElement.innerHTML;
            measureTooltipElement.innerHTML += " de " + courseArrayToStore[idCurrentEditedCourse].sport_label;
            measureTooltipElement.className = 'tooltip tooltip-static';
            measureTooltipElement.style.backgroundColor = courseColorArray[idCurrentEditedCourse];
            // measureTooltipElement.style.borderTopColor = courseColorArray[idCurrentEditedCourse];

            measureTooltip.setOffset([0, -7]);
            // unset sketch
            sketch = null;
            // unset tooltip so that a new one can be created
            measureTooltipElement = null;
            createMeasureTooltip(idCurrentEditedCourse + 1);
            ol.Observable.unByKey(listener);
        }, this);
}

snap = new ol.interaction.Snap({source: source});
map.addInteraction(snap);

function resetInteraction() {
    $('#panel-right').hide();
    currentFeatureEditing = "none";
    map.removeInteraction(draw);
}

/***************************************************************
 ***************************************************************
 ***                     Database access                     ***
 ***************************************************************
 ***************************************************************/

function storeDataToDB() {
    const source = vector.getSource();

    const store_point_of_interest_actions = pointOfInterestArrayToStore.map(pointOfInterestToStore => {
        return new Promise((resolve, reject) => {
            let pointOfInterestToStoreId = "point_of_interest_" + pointOfInterestToStore.id;
            if (pointOfInterestToStore.is_new) {
                pointOfInterestToStoreId = 'new_' + pointOfInterestToStoreId;
            }
            pointOfInterestToStore['id'] = pointOfInterestToStore.id;
            if (!pointOfInterestToStore.removed) {
                pointOfInterestToStore['lng'] = ol.proj.toLonLat(source.getFeatureById(pointOfInterestToStoreId).getGeometry().getCoordinates())[0];
                pointOfInterestToStore['lat'] = ol.proj.toLonLat(source.getFeatureById(pointOfInterestToStoreId).getGeometry().getCoordinates())[1];
            }
            return resolve();
        });
    });

    Promise.all(store_point_of_interest_actions)
        .then(result => {
            const store_course_actions = courseArrayToStore.map(courseToStore => {
                return new Promise((resolve, reject) => {
                    if (source.getFeatureById("course_" + courseToStore.id) !== null) {
                        courseToStore['track_point_array'] = source.getFeatureById("course_" + courseToStore.id).getGeometry().getCoordinates();
                    }
                    return resolve();
                });
            });

            Promise.all(store_course_actions)
                .then(result => {
                    let data = {
                        pointOfInterestArray: pointOfInterestArrayToStore,
                        courseArray: courseArrayToStore,
                        helperPostArray: helperPostArrayToStore,
                        idRaid: raid.id
                    };
                    $.ajax({
                        type: 'POST',
                        url: '/editraid/' + raid.id + '/map',
                        data: data,
                        success: function (response) {
                            updateFeaturesId(response);
                        },
                        error: function (response) {
                        }
                    });
                });
        });
}

function updateFeaturesId(data) {
    updatePointOfInterestId(data.pointOfInterestServerIdArray);
}

/***************************************************************
 ***************************************************************
 ***                        Interaction                      ***
 ***************************************************************
 ***************************************************************/

map.on('click', function (event) {
    let selectedFeatures = map.getFeaturesAtPixel(event.pixel);
    if (selectedFeatures) {
        if (currentFeatureEditing === "course") {
            setCourseFeature();
        } else {
            setPointOfInterestFromCoordinates(ol.proj.toLonLat(selectedFeatures[0].getGeometry().getCoordinates()));
        }
    } else {
        overlay.setPosition(undefined);
        console.log("There is no feature(s) here");
    }
});

/***************************************************************
 ***************************************************************
 ***                           Popup                         ***
 ***************************************************************
 ***************************************************************/

closer.onclick = function () {
    overlay.setPosition(undefined);
    closer.blur();
    return false;
};

function showPopup(feature, header) {
    let title = "";
    let nbHelper = 1;

    let helperPost = helperPostArrayToStore.find(function (helperPost) {
        return parseInt(feature.getId().replace("point_of_interest_", "")) === helperPost.id_point_of_interest;
    });

    if (helperPost !== undefined) {
        title = helperPost.title;
        nbHelper = helperPost.nb_helper;
    }

    content.innerHTML = '<h6>' + header + '</h6>' +
        '<div class="input-group-sm">' +
        '<input id="' + feature.getId() + '_label" type="text" class="form-control row-margin" placeholder="Intitulé du poste" value=\"' + title + '\">' +
        // '<textarea id="' + feature.getId() + '_label" type="text" class="form-control" placeholder="intitulé du poste">' + title + '</textarea>' +
        '<div class="row">' +
        '<div class="col"><label>Nombre de bénévole :</label></div>' +
        '<div class="col-sm-4 input-group-sm"><input id="' + feature.getId() + '_nbHelper" type="number" value=\"' + nbHelper + '\" class="form-control" min="1"></div>' +
        '</div>' +
        '</div>' +
        '<div>' +
        '<button id="type" style="margin-right: 5px;" class="btn btn-xs btn-danger" onclick="removePointOfInterest(\'' + feature.getId() + '\')">Supprimer</button>' +
        '<button id="type" class="btn btn-xs btn-default" onclick="editHelperPost(\'' + feature.getId() + '\')">Enregistrer</button>' +
        '</div>';
    overlay.setPosition(feature.getGeometry().getCoordinates());

}

/***************************************************************
 ***************************************************************
 ***                       Help Tooltip                      ***
 ***************************************************************
 ***************************************************************/

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

/***************************************************************
 ***************************************************************
 ***                     Measure Tooltip                     ***
 ***************************************************************
 ***************************************************************/

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

function createMeasureTooltip(featureId) {
    if (measureTooltipElement) {
        measureTooltipElement.parentNode.removeChild(measureTooltipElement);
    }
    measureTooltipElement = document.createElement('div');
    measureTooltipElement.className = 'tooltip tooltip-measure';
    measureTooltip = new ol.Overlay({
        id: featureId,
        element: measureTooltipElement,
        offset: [0, -15],
        positioning: 'bottom-center'
    });
    map.addOverlay(measureTooltip);
}

/***************************************************************
 ***************************************************************
 ***                         Top Panel                       ***
 ***************************************************************
 ***************************************************************/

let editing = false;

function showTopPanel() {
    if (editing) {
        storeDataToDB();
        map.removeInteraction(modify);
        map.removeOverlay(helpTooltip);
        resetInteraction();
        $('#button-eraser').hide();
        $('#abort_button').hide();
        $('#add_point_of_interest_button').hide();
        $('#add_course_button').hide();
        $('#edit_button_icon').text('  Éditer la carte')
            .attr('class', 'fas fa-map-marked');
        $('#edit_button').attr('class', 'btn btn-info')
            .attr('title', 'Ajouter, modifier et déplacer des éléments sur la carte');
        editing = false;
    } else {
        map.addInteraction(modify);
        $('#edit_button_icon').text('')
            .attr('class', 'fas fa-check');
        $('#edit_button').attr('class', 'btn btn-success')
            .attr('title', 'Enregistrer les modifications');
        $('#abort_button').show("fast");
        $('#add_point_of_interest_button').show("fast");
        $('#add_course_button').show("fast");
        editing = true;
    }
}

function abortChanges() {
    // clear all features on the screen
    vector.getSource().clear();
    map.overlays_.clear();

    // clear temporary features lists
    pointOfInterestArrayToStore = [];
    helperPostArrayToStore = [];
    courseArrayToStore = [];

    loadPointsOfInterest(pointOfInterestArrayToLoad);
    loadCourses(courseArrayToLoad);
    loadHelperPost(helperPostArrayToLoad);

    showTopPanel();
}


let idCurrentEditedCourse = 0;

function previousCourse() {
    if (idCurrentEditedCourse === 0) {
        idCurrentEditedCourse = courseArrayToStore.length - 1;
    } else {
        idCurrentEditedCourse--;
    }
    updateSelectedCourse();
}

function nextCourse() {
    if (idCurrentEditedCourse === courseArrayToStore.length - 1) {
        idCurrentEditedCourse = 0;
    } else {
        idCurrentEditedCourse++;
    }
    updateSelectedCourse();
}

//TODO Centré sur la france si pas de localisation

loadPointsOfInterest(pointOfInterestArrayToLoad);
loadCourses(courseArrayToLoad);
loadHelperPost(helperPostArrayToLoad);


// https://openlayers.org/en/latest/examples/gpx.html

/***************************************************************
 ***************************************************************
 ***                     Import/Export GPX                   ***
 ***************************************************************
 ***************************************************************/

let gpxFormat = new ol.format.GPX();
let gpxFeatures;


//$('#gpxErrorModal').hide();
//$('#exampleModal').modal('show');

function handleFileSelect(evt) {
    let files = evt.target.files; // FileList object

    // files is a FileList of File objects. List some properties.
    let output = [];
    for (let i = 0, f; f = files[i]; i++) {
        if (files[i].type === "application/gpx+xml") {

            let reader = new FileReader();
            reader.readAsText(files[i], "UTF-8");
            reader.onload = function (evt) {
                //console.log(evt.target.result);


                gpxFeatures = gpxFormat.readFeatures(evt.target.result, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                });
                gpxLayer.getSource().addFeatures(gpxFeatures);
                console.log("gpxFeatures", gpxFeatures)
            };
            output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
                f.size, ' bytes, last modified: ',
                f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
                '</li>');



            $('#exampleModal').modal('show');

        } else {
            let $MESSAGE_MODAL = $('#messageModal');
            let $MESSAGE_MODAL_TITLE = $('#messageDialog');
            let $MESSAGE_MODAL_ICON = $('#messageIconDialog');
            let $MESSAGE_MODAL_CONTENT = $('#messageContentDialog');

            $MESSAGE_MODAL_TITLE.html("Problème à l'import");
            $MESSAGE_MODAL_ICON.html("<i class=\"far fa-times-circle\" style='color:red;font-size: 48px;'></i>");
            $MESSAGE_MODAL_CONTENT.html("Le format du fichier sélectionné n'est pas le bon. Veillez à ouvrir un fichier .gpx");
            $MESSAGE_MODAL.modal('show');
        }
    }
    document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
}


var defaultStyle = {
    'Point': new ol.style.Style({
        image: new ol.style.Circle({
            fill: new ol.style.Fill({
                color: 'rgba(255,255,0,0.5)'
            }),
            radius: 5,
            stroke: new ol.style.Stroke({
                color: '#ff0',
                width: 1
            })
        })
    }),
    'LineString': new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#f00',
            width: 3
        })
    }),
    'Polygon': new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(0,255,255,0.5)'
        }),
        stroke: new ol.style.Stroke({
            color: '#0ff',
            width: 1
        })
    }),
    'MultiPoint': new ol.style.Style({
        image: new ol.style.Circle({
            fill: new ol.style.Fill({
                color: 'rgba(255,0,255,0.5)'
            }),
            radius: 5,
            stroke: new ol.style.Stroke({
                color: '#f0f',
                width: 1
            })
        })
    }),
    'MultiLineString': new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#0f0',
            width: 3
        })
    }),
    'MultiPolygon': new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(0,0,255,0.5)'
        }),
        stroke: new ol.style.Stroke({
            color: '#00f',
            width: 1
        })
    })
};

let styleFunction = function (feature, resolution) {
    let featureStyleFunction = feature.getStyleFunction();
    if (featureStyleFunction) {
        return featureStyleFunction.call(feature, resolution);
    } else {
        return defaultStyle[feature.getGeometry().getType()];
    }
};

let gpxLayer = new ol.layer.Vector({
    source: new ol.source.Vector({}),
    style: styleFunction
});

map.addLayer(gpxLayer);

document.getElementById('files').addEventListener('change', handleFileSelect, false);
