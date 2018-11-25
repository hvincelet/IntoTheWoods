const pages_path = __dirname+"/../views/pages/";
const models = require('../models');
const sender = require('./sender');

const raids = models.raid;
const sports = models.sport;
const courses = models.course;
const track_points = models.track_point;
const point_of_interests = models.point_of_interest;
const helper_posts = models.helper_post;
const assignments = models.assignment;
const helpers = models.helper;
assignments.belongsTo(helper_posts, {foreignKey: "id_helper_post"});
assignments.belongsTo(helpers, {foreignKey: "id_helper"});
helper_posts.belongsTo(point_of_interests, {foreignKey: "id_point_of_interest"});

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
                } else if (pointOfInterest.removed === 'true') {
                    const poi_id = pointOfInterest.id.replace('remove_', '');
                    removeAssignmentsForThisPoi(poi_id, req.body.idRaid);
                    return resolve();
                } else {
                    point_of_interests.findByPk(pointOfInterest.id)
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

                        if (helper_post.is_new === 'true') {

                            let pointOfInterest = pointOfInterestServerIdArray.find(function (client_server_Id) {
                                return client_server_Id.clientId === helper_post.id_point_of_interest;
                            });
                            let helper_post_created_promise;
                            if (pointOfInterest !== undefined){
                                helper_post_created_promise = helper_posts.create({
                                    id_point_of_interest: pointOfInterest.serverId,
                                    title: helper_post.description,
                                    nb_helper: helper_post.nb_helper
                                });
                            } else {
                                helper_post_created_promise = helper_posts.create({
                                    id_point_of_interest: helper_post.id_point_of_interest,
                                    title: helper_post.description,
                                    nb_helper: helper_post.nb_helper
                                });
                            }
                            helper_post_created_promise.then(function(new_helper_post_created){
                                assignments.findAll({
                                    include: [{
                                        model: helper_posts,
                                        include: [{
                                            model: point_of_interests,
                                            where: {
                                                id_raid: req.body.idRaid
                                            }
                                        }]
                                    }]
                                }).then(function(assignments_found){
                                    const unique_assignments_array = assignments_found.filter(function (assignment, index, array) {
                                        return array.findIndex(function (value) {
                                            return value.dataValues.id_helper === assignment.dataValues.id_helper;
                                        }) === index;
                                    });
                                    unique_assignments_array.map(assignment => {
                                        helpers.findByPk(assignment.dataValues.id_helper).then(function(helper_found){
                                            if(helper_found.dataValues.backup === 1){
                                                const max_order = Math.max.apply(Math, assignments_found.map(function(a) {
                                                    return (a.dataValues.id_helper === assignment.dataValues.id_helper) ? a.dataValues.order_num : 0;
                                                }));
                                                assignments.create({
                                                    id_helper: helper_found.dataValues.login,
                                                    id_helper_post: new_helper_post_created.dataValues.id,
                                                    order_num: max_order + 1
                                                });
                                            }
                                        });
                                    });
                                });
                            });
                        } else {
                            helper_posts.update({
                                    title: helper_post.description,
                                    nb_Helper: helper_post.nb_helper
                                },
                                {where: {id: helper_post.id}}
                            )
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
                if (course.track_point_array !== undefined) {
                    course.track_point_array.map(track_point => {
                        track_points.create({
                            id_track: course.id,
                            lat: track_point[1],
                            lng: track_point[0]
                        })
                    });
                }
                courses.update(
                    {distance: course.distance},
                    {where: {id: course.id}}
                )

            }).catch(err => console.log(err));
        });
    }
};

function removeAssignmentsForThisPoi(poi_id, raid_id){
    assignments.findAll({
        include: [{
            model: helper_posts,
            where: {
                id_point_of_interest: poi_id
            }
        }]
    }).then(function(assignments_found){
        let assignments_by_helper_counter = [];
        const destroying_all_assignments = assignments_found.map(assignment => {
            return new Promise(resolve => {
                let assignments_by_helper = assignments_by_helper_counter.find(assignment_by_helper => {
                    return assignment_by_helper.helper_id === assignment.dataValues.id_helper;
                });
                if(assignments_by_helper === undefined) {
                    assignments_by_helper_counter.push({helper_id: assignment.dataValues.id_helper, count: 1, helper_post_name: assignment.dataValues.helper_post.dataValues.title});
                }else{
                    assignments_by_helper.count += 1;
                    assignments_by_helper.helper_post_name = assignment.dataValues.helper_post.dataValues.title;
                }
                assignments.destroy({
                    where: {
                        id_helper_post: assignment.dataValues.id_helper_post,
                        id_helper: assignment.dataValues.id_helper
                    }
                }).then(function(){resolve()});
            });
        });
        Promise.all(destroying_all_assignments).then(function(result){
            const unique_assignments_array = assignments_found.filter(function (assignment, index, array) {
                return array.findIndex(function (value) {
                    return value.dataValues.id_helper_post === assignment.dataValues.id_helper_post;
                }) === index;
            });
            const destroying_all_helper_posts = unique_assignments_array.map(assignment => {
                return new Promise(resolve => {
                    helper_posts.destroy({
                        where: {
                            id: assignment.id_helper_post
                        }
                    }).then(function(){resolve();});
                });
            });
            Promise.all(destroying_all_helper_posts).then(result => {
                point_of_interests.destroy({
                    where: {
                        id: poi_id
                    }
                }).then(function(){
                    helper_posts.findAll({
                        include: [{
                            model: point_of_interests,
                            where: {
                                id_raid: raid_id
                            }
                        }]
                    }).then(function(helper_posts_found){
                        assignments_by_helper_counter.map(assignments_by_helper => {
                            if(assignments_by_helper.count === 1){
                                // Helper with only one assignment (attributed or not) becomes a backup + send a mail
                                helpers.findByPk(assignments_by_helper.helper_id).then(function(new_helper_backup){
                                    if(new_helper_backup.backup === 0) {
                                        raids.findByPk(raid_id).then(function(raid_found){
                                            sender.sendNewBackupDueToPoiDeletionMail(new_helper_backup.dataValues.email, raid_found.dataValues.name, raid_found.dataValues.edition, assignments_by_helper.helper_post_name);
                                            helper_posts_found.map(helper_post => {
                                                assignments.create({
                                                    id_helper_post: helper_post.dataValues.id,
                                                    id_helper: assignments_by_helper.helper_id,
                                                    order_num: 1
                                                });
                                            });
                                        });
                                    }
                                });
                            }
                        });
                    });
                });
            });
        });
    });
}