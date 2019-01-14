let courseArrayToStore = [];

let distance;

function loadCourses(courseArray) {
    courseArray.map(course => {

        if (course.track_point_array.length > 1) {
            let geom = new ol.geom.LineString(course.track_point_array);
            let feature = new ol.Feature({
                    geometry: geom,
                }
            );

            feature.setId("course_" + course.id);
            feature.setStyle(
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: courseColorArray[course.order_num - 1],
                        width: 6
                    })
                })
            );

            createMeasureTooltip(course.id);
            measureTooltip.setPosition(course.track_point_array[course.track_point_array.length - 1]);
            measureTooltipElement.innerHTML += course.distance + " de " + course.sport_label;
            measureTooltipElement.className = 'tooltip tooltip-static';
            measureTooltipElement.style.backgroundColor = courseColorArray[course.order_num - 1];
            measureTooltip.setOffset([0, -7]);
            measureTooltipElement = null;

            source.addFeature(feature);
        }

        courseArrayToStore.push({
            id: course.id,
            order_num: course.order_num,
            label: course.label,
            sport_label: course.sport_label,
            distance: course.distance
        });

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

    let courseFeatureFound = allFeatures.find(function (feature) {
        return (feature.getId() === undefined) && (feature.getGeometry().getCoordinates().length > 1);
    });

    if (courseFeatureFound) {
        if (source.getFeatureById("course_" + (idCurrentEditedCourse + 1)) !== null) {
            removeCurrentEditedCourse();
        }

        console.log("Newly created course");
        courseFeatureFound.setId("course_" + courseArrayToStore[idCurrentEditedCourse].id);
        courseFeatureFound.setStyle(
            new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: courseColorArray[idCurrentEditedCourse],
                    width: 6
                })
            })
        );

        let courseFound = courseArrayToStore.find(function (course) {
            return course.id === courseArrayToStore[idCurrentEditedCourse].id;
        });
        courseFound['distance'] = distance;

        nextCourse();
        map.removeOverlay(helpTooltip);
        number_of_points = 0;
    }

    if (++number_of_points === 1) {
        updateHelpTooltipOverlay("Double-clic pour finir le tracé");
    }
}

let courseColorArray = ["#5c6bc0", "#ef5350", "#ffa726", "#66bb6a", "#7e57c2", "#26c6da", "#ec407a"]; // https://material.io/tools/color #400 color range

function updateSelectedCourse() {
    $('#current_course').css('background-color', courseColorArray[idCurrentEditedCourse])
        .text(courseArrayToStore[idCurrentEditedCourse].sport_label);

    $('#course-info-num').text(courseArrayToStore[idCurrentEditedCourse].order_num + "° épreuve");
    $('#course-info-label').text(courseArrayToStore[idCurrentEditedCourse].label);
    $('#course_info_tooltip').stop(true).fadeIn().delay(4000).fadeOut("slow");

    if (source.getFeatureById("course_" + (idCurrentEditedCourse + 1)) !== null) {
        $('#button-eraser').show();
    } else {
        $('#button-eraser').hide();
    }
}

function removeCurrentEditedCourse() {
    console.log("removed overlay id : " + (idCurrentEditedCourse + 1));
    feature = source.getFeatureById("course_" + (idCurrentEditedCourse + 1));
    source.removeFeature(feature);
    map.removeOverlay(map.getOverlayById(idCurrentEditedCourse + 1));
}

//TODO vérifier qu'il n'y existe pas déjà un tracé pour le parcours à créer
//TODO exprimer les coordonnées des track_point en lonlat
//TODO UPDATE et/ou INSERT des track_point ??????

