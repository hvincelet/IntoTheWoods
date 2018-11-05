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

function addPointOfInterest() {
    $('#panel-right').fadeOut();
    currentFeatureEditing = "point_of_interest";
    typeSelect = "Point";
    addInteractions();
    map.removeOverlay(helpTooltip);
}

function removePointOfInterest(featureId) {
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
}

let lastPointOfInterestCreatedID = 0;
function setPointOfInterestFromCoordinates(coordinates) {
    // Get the array of features
    let allFeatures = vector.getSource().getFeatures();

    let pointOfInterestFound = allFeatures.find(function (feature) {
        return (ol.proj.toLonLat(feature.getGeometry().getCoordinates())[0] === coordinates[0]) &&
            (ol.proj.toLonLat(feature.getGeometry().getCoordinates())[1] === coordinates[1]);
    });

    if (pointOfInterestFound) {
        if (pointOfInterestFound.getId() === undefined) { // this is a newly created point-of-interest
            console.log("Newly created point-of-interest");
            pointOfInterestFound.setId("new_point_of_interest_" + ++lastPointOfInterestCreatedID);
            showPopup(pointOfInterestFound, "Créer le point d'intérêt");
        } else {
            console.log("Id of the selected feature : " + pointOfInterestFound.getId());
            showPopup(pointOfInterestFound, "Editer le point d'intérêt");
        }
        map.removeOverlay(helpTooltip);
    }
}