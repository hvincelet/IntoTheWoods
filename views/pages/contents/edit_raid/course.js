function addCourse() {
    updateSelectedCourse();
    $('#panel-right').fadeIn();
    currentFeatureEditing = "course";
    typeSelect = "LineString";
    addInteractions();
}

function setCourseFeature() {

    // Get the array of features
    let allFeatures = vector.getSource().getFeatures();

    // Go through this array and get coordinates of their geometry.
    allFeatures.forEach(function (feature) {

        if ((feature.getId() === undefined) && (feature.getGeometry().getCoordinates().length > 1)) {  // this is a newly created course
            console.log("Newly created course");
            feature.setId("new_course_" + courseArray[idCurrentEditedCourse].id);
            feature.setStyle(
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: courseColorArray[idCurrentEditedCourse],
                        width: 3
                    })
                })

            );
            nextCourse();
        }

    });

}

//TODO vérifier qu'il n'y existe pas déjà un tracé pour le parcours à créer
//TODO exprimer les coordonnées des track_point en lonlat
//TODO pb asynchrone entre INSERT et SELECT des parcours arpès la création du raid
//TODO UPDATE et/ou INSERT des track_point ??????

