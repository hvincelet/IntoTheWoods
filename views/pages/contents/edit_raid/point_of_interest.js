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

    // Go through this array and get coordinates of their geometry.
    allFeatures.forEach(function (feature) {
        if ((ol.proj.toLonLat(feature.getGeometry().getCoordinates())[0] === coordinates[0]) &&
            (ol.proj.toLonLat(feature.getGeometry().getCoordinates())[1] === coordinates[1])) {

            if (feature.getId() === undefined) { // this is a newly created point-of-interest
                console.log("Newly created point-of-interest");
                feature.setId("new_point_of_interest_" + ++lastPointOfInterestCreatedID);
                showPopup(feature, "Créer le point d'intérêt");
            } else {
                console.log("Id of the selected feature : " + feature.getId());
                showPopup(feature, "Editer le point d'intérêt");
            }

            map.removeOverlay(helpTooltip);
        }
    });
}
