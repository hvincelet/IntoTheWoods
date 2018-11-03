function loadCourses() {
    let courseId = 0;
    courseArrayToLoad.forEach(function (course) {
        if (course !== null && course.length > 1) {
            let geom = new ol.geom.LineString(course);
            let feature = new ol.Feature({
                    geometry: geom,
                }
            );
            let orderedCourseFound = orderedCourseArray.find(function (orderedCourse) {
                return orderedCourse.id === courseId;
            });
            feature.setId("course_" + courseId);
            feature.setStyle(
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: courseColorArray[orderedCourseFound.order_num - 1],
                        width: 6
                    })
                })
            );
            source.addFeature(feature);
        }
        courseId++;
    });
}

function addCourse() {
    updateSelectedCourse();
    $('#panel-right').fadeIn();
    currentFeatureEditing = "course";
    typeSelect = "LineString";
    addInteractions();
    addHelpTooltipOverlay("Un clic pour commencer le tracé");
}

let number_of_points = 0;

function setCourseFeature() {
    // Get the array of features
    let allFeatures = vector.getSource().getFeatures();

    let courseFound = allFeatures.find(function (feature) {
        return (feature.getId() === undefined) && (feature.getGeometry().getCoordinates().length > 1);
    });

    if (courseFound) {
        console.log("Newly created course");
        courseFound.setId("new_course_" + orderedCourseArray[idCurrentEditedCourse].id);
        courseFound.setStyle(
            new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: courseColorArray[idCurrentEditedCourse],
                    width: 6
                })
            })
        );
        nextCourse();
        map.removeOverlay(helpTooltip);
        number_of_points = 0
    }

    if (++number_of_points === 1) {
        updateHelpTooltipOverlay("Double-clic pour finir le tracé");
    }

}

let courseColorArray = ["#5c6bc0", "#ef5350", "#ffa726", "#66bb6a", "#7e57c2", "#26c6da", "#ec407a"]; // https://material.io/tools/color #400 color range

function updateSelectedCourse() {
    $('#current_course').css('background-color', courseColorArray[idCurrentEditedCourse])
        .text(orderedCourseArray[idCurrentEditedCourse].sport_label);

    $('#course-info-num').text(orderedCourseArray[idCurrentEditedCourse].order_num + "° épreuve");
    $('#course-info-label').text(orderedCourseArray[idCurrentEditedCourse].label);
    $('#course_info_tooltip').stop(true).fadeIn().delay(4000).fadeOut("slow");
}

//TODO vérifier qu'il n'y existe pas déjà un tracé pour le parcours à créer
//TODO exprimer les coordonnées des track_point en lonlat
//TODO pb asynchrone entre INSERT et SELECT des parcours arpès la création du raid
//TODO UPDATE et/ou INSERT des track_point ??????

