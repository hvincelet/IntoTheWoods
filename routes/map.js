const pages_path = "../views/pages/";
const models = require('../models');

exports.displayMap = function (req, res) {
    models.raid.findOne({ // loads the map associated with the raid "idCurrentRaid"
        where: {
            id: raid.idCurrentRaid
            //id: 1 // for tests
        }
    }).then(function (raid_found) {
        models.course.findAll({
            where: {
                id_raid: raid_found.id
            }
        }).then(function (courses_found) {

            let pointOfInterestArray = [];
            models.point_of_interest.findAll({ // loads the array of points-of-interest
                where: {
                    id_track: courses_found[0].id
                }
            }).then(function (points_of_interest_found) {
                points_of_interest_found.forEach(function (point_of_interest) {
                    pointOfInterestArray.push({
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
                    courseArray: courses_found,
                    pointOfInterestArray: pointOfInterestArray
                });
            });
        });
    });

};

exports.storeMapDatas = function (req, res) {

    req.body.pointOfInterestArray.forEach(function (pointOfInterest) {

        if (pointOfInterest.id.indexOf("new") !== -1) {
            models.point_of_interest.create({
                id_track: req.body.courseArray[0].id,
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

    })
};
