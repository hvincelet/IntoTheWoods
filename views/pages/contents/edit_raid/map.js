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
            color: '#6200ee',
            width: 3
        }),
        image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
                color: '#6200ee'
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

/**********************************/
/*  Fn dedicated to PoI edition   */
/**********************************/

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


function addPointOfInterest() {
    typeSelect = "Point";
    addInteractions();
}

function addCourse() {
    typeSelect = "LineString";
    addInteractions();
}

function resetInteraction() {
    map.removeInteraction(draw);
}


// I/O DB
const pointOfInterestArrayToStore = [];
function storeDatasToDB() {
    let features = vector.getSource().getFeatures();

    features.forEach(function (feature) {
        if (feature.getId().indexOf("point_of_interest") !== -1) {
            pointOfInterestArrayToStore.push({
                id: feature.getId().replace('point_of_interest_', ''),
                lng: ol.proj.toLonLat(feature.getGeometry().getCoordinates())[0],
                lat: ol.proj.toLonLat(feature.getGeometry().getCoordinates())[1]
            });
        } else {
            console.log("not a point_of_interest");
        }

    });

    let data = {
        pointOfInterestArray: pointOfInterestArrayToStore,
        courseArray: courseArray
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

        // compare the coordinates with the features to get the id of the selected one
        getFeatureIDFromCoordinates(ol.proj.toLonLat(selection[fid].getGeometry().getCoordinates()));
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
    content.innerHTML = '<h6>' + header + '</h6><input type="text" class="form-control col-sm" placeholder="intitulé du poste">' +
        '<button id="type" class="btn btn-xs btn-danger" onclick="removeFeature(\'' + feature.getId() + '\')">supprimer</button><button id="type" class="btn btn-xs btn-default">enregistrer</button><code>' + feature.getId() + '</code>';
    overlay.setPosition(feature.getGeometry().getCoordinates());
}

function removeFeature(featureId) {
    let feature = vector.getSource().getFeatureById(featureId);
    // remove on the map
    source.removeFeature(feature);
    // remove on the DB
    if (feature.getId().indexOf("new") === -1) {
            pointOfInterestArrayToStore.push({
                id: "remove_" + feature.getId().replace('point_of_interest_', '')
            });
    }

    overlay.setPosition(undefined);
};
