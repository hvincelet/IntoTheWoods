const pages_path = "../views/pages/";
const models = require('../models');

const sports = models.sport;
const courses = models.course;
const track_points = models.track_point;
const point_of_interests = models.point_of_interest;
const helper_posts = models.helper_post;

exports.displayMap = function (req, res) {
    const user = connected_user(req.sessionID);
    const raid = user.raid_list.find(function (raid) {
        return raid.id === parseInt(req.params.id);
    });

    if (!raid) {
        return res.redirect('/dashboard');
    }

    courses.findAll({
        where: {
            id_raid: raid.id
        }
    }).then(function (courses_found) {
        console.log(courses_found);
        sports.findAll().then(function (all_sports) {
            courses_found.sort(function (a, b) {
                return a.order_num - b.order_num;
            });

            const course_actions = courses_found.map(course => {
                return new Promise((resolve, reject) => {
                    course.dataValues['track_point_array'] = [];
                    track_points.findAll({
                        where: {
                            id_track: course.id
                        }
                    }).then(function (track_points_found) {
                        track_points_found.forEach(function (track_point) {
                            course.dataValues['track_point_array'].push(
                                [track_point.lng, track_point.lat]
                            );
                        });
                        let sportFound = all_sports.find(function (sport) {
                            return sport.id === course.id_sport;
                        });
                        course.dataValues['sport_label'] = sportFound.name;
                        return resolve();
                    });
                });
            });

            Promise.all(course_actions)
                .then(result => {
                    let pointOfInterestArrayToLoad = [];
                    let helperPostArrayToLoad = [];
                    point_of_interests.findAll({ // loads the array of points-of-interest
                        where: {
                            id_raid: raid.id
                        }
                    }).then(function (points_of_interest_found) {
                        const point_of_interest_actions = points_of_interest_found.map(point_of_interest => {
                            return new Promise((resolve, reject) => {
                                pointOfInterestArrayToLoad.push({
                                    id: point_of_interest.id,
                                    lonlat: [point_of_interest.lng, point_of_interest.lat]
                                });
                                helper_posts.findOne({
                                    where: {
                                        id_point_of_interest: point_of_interest.id
                                    }
                                }).then(function (helper_post_found) {
                                    if (helper_post_found !== null) {
                                        helperPostArrayToLoad.push(helper_post_found.dataValues);
                                    }
                                    return resolve();
                                })

                            });
                        });

                        Promise.all(point_of_interest_actions)
                            .then(result => {
                                res.render(pages_path + "template.ejs", {
                                    pageTitle: "Gestion des Raids",
                                    page: "edit_raid/map",
                                    user: user,
                                    raid: raid,
                                    pointOfInterestArrayToLoad: pointOfInterestArrayToLoad,
                                    courseArrayToLoad: courses_found,
                                    helperPostArrayToLoad: helperPostArrayToLoad
                                });
                            });
                    }).catch(err => console.log(err));
                });
        });
    });
};

exports.storeMapData = function (req, res) {

    let pointOfInterestServerIdArray = [];
    if (req.body.pointOfInterestArray !== undefined) {
        const store_point_of_interest_actions = req.body.pointOfInterestArray.map(pointOfInterest => {
            return new Promise((resolve, reject) => {
                if (pointOfInterest.is_new === 'true') {
                    point_of_interests.create({
                        id_raid: req.body.idRaid,
                        lat: pointOfInterest.lat,
                        lng: pointOfInterest.lng
                    }).then(function (pointOfInterestCreated) {
                        pointOfInterestServerIdArray.push({
                            clientId: pointOfInterest.id,
                            serverId: pointOfInterestCreated.dataValues.id
                        });
                        return resolve();
                    }).catch(err => console.log(err));
                } else if (pointOfInterest.id.indexOf("remove") !== -1) {
                    return point_of_interests.destroy({
                        where: {
                            id: pointOfInterest.id.replace('remove_', '')
                        }
                    });
                } else {
                    point_of_interests.findById(pointOfInterest.id)
                        .then(function (pointOfInterest_found) {
                            if (pointOfInterest_found !== null) { // point of interest is already present in DB, it must be updated
                                pointOfInterest_found.update({
                                    lat: pointOfInterest.lat,
                                    lng: pointOfInterest.lng
                                });
                            } else {
                                console.log("error: existing point not found");
                            }
                            return resolve();
                        }).catch(err => console.log(err));
                }
            });
        });

        Promise.all(store_point_of_interest_actions)
            .then(result => {
                if (req.body.helperPostArray !== undefined) {
                    req.body.helperPostArray.map(helper_post => {
                        if (helper_post.is_new === 'new') {
                            helper_posts.create({
                                id_point_of_interest: helper_post.id_point_of_interest,
                                description: helper_post.description,
                                nb_helper: helper_post.nb_helper
                            })
                        } else {

                            helper_posts.create({
                                id_point_of_interest: helper_post.id_point_of_interest,
                                description: helper_post.description,
                                nb_helper: helper_post.nb_helper
                            })
                        }
                    });
                }
                res.send({
                    pointOfInterestServerIdArray: pointOfInterestServerIdArray
                })
            }).catch(err => console.log(err));
    }

    if (req.body.courseArray !== undefined) {
        req.body.courseArray.map(course => {
            track_points.destroy({ // temporary
                where: {
                    id_track: course.id
                }
            }).then(function () {
                course.track_point_array.map(track_point => {
                    track_points.create({
                        id_track: course.id,
                        lat: track_point[1],
                        lng: track_point[0]
                    })
                });

                courses.update(
                    {distance: course.distance},
                    {where: {id: course.id}}
                )

            }).catch(err => console.log(err));
        });
    }
};
