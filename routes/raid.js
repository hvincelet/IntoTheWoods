const jdenticon = require('jdenticon');
const pages_path = "../views/pages/";
const models = require('../models');

const Nominatim = require('nominatim-geocoder');
const geocoder = new Nominatim();

let idCurrentRaid = 1; //for tests

exports.displayDescriptionForm = function (req, res) {
    let picture = jdenticon.toPng(user.first_name.concat(user.last_name), 80).toString('base64');

    const sports = [];
    models.sport.findAll({
        order: ['name']
    }).then(function (sports_found) {
        sports_found.forEach(function (sport) {
            sports.push(sport.dataValues.name);
        });

        res.render(pages_path + "template.ejs", {
            pageTitle: "Création d'un Raid",
            page: "create_raid/description",
            sports: sports,
            userName_fn: user.first_name,
            userName_ln: user.last_name,
            userName_initials: user.initials,
            userPicture: picture
        });
    });
};

exports.createRaid = function (req, res) {

    models.raid.create({
        name: req.body.raidName,
        edition: req.body.raidEdition,
        date: req.body.raidStartDate,
        place: req.body.raidPlace,
        lat: 0.0,
        lng: 0.0
    }).then(function (raid_created) {
        idCurrentRaid = raid_created.dataValues.id;

        geocoder.search({q: req.body.raidPlace}) // allows to list all the locations corresponding to the city entered
            .then((response) => {
                raid_created.update({
                    lat: response[0].lat,
                    lng: response[0].lon
                }).then(() => {
                    res.redirect('/editraid/map');
                })
            })
            .catch((error) => {
                console.log(error);
                res.redirect('/editraid/map');
            });
    });

};

exports.getGeocodedResults = function (req, res) {
    let geocoded_results = [];

    geocoder.search({q: req.body.query})
        .then((response) => {

            let data_to_send = [];
            response.forEach(function (place) {
                geocoded_results.push({
                    name: place.display_name,
                    lat: place.lat,
                    lon: place.lon
                });

                data_to_send.push(place.display_name);
            });

            res.send(JSON.stringify(data_to_send));

            //res.send(JSON.stringify(geocoded_results));

        })
        .catch((error) => {
            console.log("Error: " + error);
        });

};

exports.displayMap = function (req, res) {

    models.raid.findOne({ // loads the map associated with the raid "idCurrentRaid"
        where: {
            id: idCurrentRaid
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

                let picture = jdenticon.toPng(user.first_name.concat(user.last_name), 80).toString('base64');
                res.render(pages_path + "template.ejs", {
                    pageTitle: "Gestion des Raids",
                    page: "edit_raid/map",
                    userName_fn: user.first_name,
                    userName_ln: user.last_name,
                    userName_initials: user.initials,
                    userPicture: picture,
                    raid: raid_found.dataValues,
                    pointOfInterestArray: pointOfInterestArray
                });
            });
        });
    });

};

exports.storeMapDatas = function (req, res) {

    req.body.pointOfInterestArray.forEach(function (vector) {

        models.point_of_interest.findById(vector.id)
            .then(function (vector_found) {
                if (vector_found !== null) { // point of interest is already present in DB, it must be updated
                    console.log(vector);

                    vector_found.update({
                        lat: vector.lat,
                        lng: vector.lng
                    }).then(() => {
                    })

                } else { // this is a new point, it must be added
                    models.point_of_interest.create({
                        id_track: 1,
                        lat: vector.lat,
                        lng: vector.lng
                    })
                }
            });
    })
};