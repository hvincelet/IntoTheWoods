let pointOfInterestArrayToStore = [];

function loadPointsOfInterest(pointArray) {
    console.log(typeof pointArray);
    pointArray.map(pointOfInterest => {
        let geom = new ol.geom.Point(ol.proj.fromLonLat(pointOfInterest.lonlat));
        let feature = new ol.Feature({
                geometry: geom,
            }
        );
        feature.setId("point_of_interest_" + pointOfInterest.id);
        source.addFeature(feature);

        pointOfInterestArrayToStore.push({
            id: pointOfInterest.id,
            is_new: false,
            removed: false
        });
    });
}

function addPointOfInterest() {
    $('#panel-right').fadeOut();
    currentFeatureEditing = 'point_of_interest';
    typeSelect = "Point";
    addInteractions();
    map.removeOverlay(helpTooltip);
}

function removePointOfInterest(featureId) {
    let feature = vector.getSource().getFeatureById(featureId);
    // remove on the map
    source.removeFeature(feature);

    // remove on the DB
    let pointOfInterestFound = pointOfInterestArrayToStore.find(function (pointOfInterest) {
        if (pointOfInterest.is_new) {
            return (parseInt(featureId.replace('new_point_of_interest_','')) === pointOfInterest.id);
        } else {
            return (parseInt(featureId.replace('point_of_interest_','')) === pointOfInterest.id);
        }
    });

    if (pointOfInterestFound.is_new) {
        pointOfInterestArrayToStore.splice(pointOfInterestArrayToStore.indexOf(pointOfInterestFound), 1);
    } else {
        pointOfInterestFound.removed = true;
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
        if (pointOfInterestFound.getId() === undefined) {
            console.log("Newly created point-of-interest");
            pointOfInterestFound.setId("new_point_of_interest_" + ++lastPointOfInterestCreatedID);

            pointOfInterestArrayToStore.push({
                id: lastPointOfInterestCreatedID,
                is_new: true,
                removed: false
            });

            showPopup(pointOfInterestFound, "Créer le point d'intérêt");
        } else {
            showPopup(pointOfInterestFound, "Editer le point d'intérêt");
        }
        map.removeOverlay(helpTooltip);
    }
}

function updatePointOfInterestId(serverId) {
    serverId.map(pointOfInterestServerId => {
        let feature = vector.getSource().getFeatureById("new_point_of_interest_" + pointOfInterestServerId.clientId);
        feature.setId("point_of_interest_" + pointOfInterestServerId.serverId);

        let pointOfInterestFound = pointOfInterestArrayToStore.find(function (pointOfInterest) {
            return (pointOfInterest.id === parseInt(pointOfInterestServerId.clientId)) && pointOfInterest.is_new;
        });

        pointOfInterestFound.id = pointOfInterestServerId.serverId;
        pointOfInterestFound.is_new = false;

        let helperPostFound = helperPostArrayToStore.find(function (helperPost) {
            console.log(helperPost.id_point_of_interest);
            console.log(pointOfInterestServerId.clientId);
            return helperPost.id_point_of_interest === parseInt(pointOfInterestServerId.clientId);
        });
        if (helperPostFound !== undefined) {
            helperPostFound.id_point_of_interest = pointOfInterestServerId.serverId;
            helperPostFound.is_new = false;
        }

    });
}
