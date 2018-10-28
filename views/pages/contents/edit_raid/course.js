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
            feature.setId("new_course_" + orderedCourseArray[idCurrentEditedCourse].id);
            feature.setStyle(
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: courseColorArray[idCurrentEditedCourse],
                        width: 6
                    })
                })

            );
            nextCourse();
        }

    });
}

let courseColorArray = ["#5c6bc0", "#ef5350", "#ffa726", "#66bb6a", "#7e57c2", "#26c6da", "#ec407a"]; // https://material.io/tools/color #400 color range

function updateSelectedCourse() {
    $('#current_course').css('background-color', courseColorArray[idCurrentEditedCourse])
        .text(orderedCourseArray[idCurrentEditedCourse].sport_label);
}

//TODO vérifier qu'il n'y existe pas déjà un tracé pour le parcours à créer
//TODO exprimer les coordonnées des track_point en lonlat
//TODO pb asynchrone entre INSERT et SELECT des parcours arpès la création du raid
//TODO UPDATE et/ou INSERT des track_point ??????

