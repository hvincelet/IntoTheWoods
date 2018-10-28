const pages_path = "../views/pages/";
const models = require('../models');

exports.displayMap = function (req, res) {
    models.raid.findOne({ // loads the map associated with the raid "idCurrentRaid"
        where: {
            //id: raid.idCurrentRaid
            id: 1 // for tests
        }
    }).then(function (raid_found) {
        models.course.findAll({
            where: {
                id_raid: raid_found.id
            }
        }).then(function (courses_found) {
            models.sport.findAll().then(function (all_sports) {
                courses_found.sort(function (a, b) {
                    return a.order_num - b.order_num;
                });
                let courseArrayToLoad = [];
                courses_found.forEach(function (course) {
                    courseArrayToLoad[course.id] = [];

                    models.track_point.findAll({
                        where: {
                            id_track: course.id
                        }
                    }).then(function (track_points_found) {

                        track_points_found.forEach(function (track_point) {
                            courseArrayToLoad[course.id].push(
                                [track_point.lng, track_point.lat]
                            );
                        });

                    });

                    all_sports.forEach(function (sport) {
                        if (course.id_sport === sport.id) {
                            course.dataValues["sport_label"] = sport.name;
                        }
                    });
                });

                let pointOfInterestArrayToLoad = [];
                models.point_of_interest.findAll({ // loads the array of points-of-interest
                    where: {
                        id_track: courses_found[0].id
                    }
                }).then(function (points_of_interest_found) {
                    points_of_interest_found.forEach(function (point_of_interest) {
                        pointOfInterestArrayToLoad.push({
                            id: point_of_interest.id,
                            lonlat: [point_of_interest.lng, point_of_interest.lat]
                        });
                    });

                    res.render(pages_path + "template.ejs", {
                        pageTitle: "Gestion des Raids",
                        page: "edit_raid/map",
                        userName_fn: user.first_name,
                        userName_ln: user.last_name,
                        userName_initials: user.initials,
                        userPicture: user.picture,
                        raid: raid_found.dataValues,
                        orderedCourseArray: courses_found,
                        pointOfInterestArrayToLoad: pointOfInterestArrayToLoad,
                        courseArrayToLoad: courseArrayToLoad
                    });
                });

            });

        });
    });

};

exports.storeMapDatas = function (req, res) {

    req.body.pointOfInterestArray.forEach(function (pointOfInterest) {
        if (pointOfInterest.id.indexOf("new") !== -1) {
            models.point_of_interest.create({
                id_track: req.body.defaultCourseArrayID,
                lat: pointOfInterest.lat,
                lng: pointOfInterest.lng
            })
        } else if (pointOfInterest.id.indexOf("remove") !== -1) {
            models.point_of_interest.destroy({
                where: {
                    id: pointOfInterest.id.replace('remove_', '')
                }
            })
        } else {
            models.point_of_interest.findById(pointOfInterest.id)
                .then(function (pointOfInterest_found) {
                    if (pointOfInterest_found !== null) { // point of interest is already present in DB, it must be updated
                        pointOfInterest_found.update({
                            lat: pointOfInterest.lat,
                            lng: pointOfInterest.lng
                        }).then(() => {
                        })
                    } else {
                        console.log("error: existing point not found")
                    }
                });
        }
    });

    req.body.courseArray.forEach(function (course) {
        if (course.id.indexOf("new") !== -1) {
            course.id = course.id.replace('new_', ''); // temporary
        }

        models.track_point.destroy({ // temporary
            where: {
                id_track: course.id
            }
        }).then(function () {
            course.track_point_array.forEach(function (track_point) {
                models.track_point.create({
                    id_track: course.id,
                    lat: track_point[1],
                    lng: track_point[0]
                });
            });

        });

    });
};