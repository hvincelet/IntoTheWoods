const jdenticon = require('jdenticon');
const pages_path = "../views/pages/";
const models = require('../models');

const Nominatim = require('nominatim-geocoder');
const geocoder = new Nominatim();

let idCurrentRaid;

exports.init = function(req, res){
    res.render(pages_path + "template.ejs", {
        pageTitle: "Création d'un Raid",
        page: "create_raid/start",
        userName_fn: user.first_name,
        userName_ln: user.last_name,
        userName_initials: user.initials,
        userPicture: user.picture
    });
};
exports.displayDescriptionForm = function (req, res) {
    res.render(pages_path + "template.ejs", {
        pageTitle: "Création d'un Raid",
        page: "create_raid/description",
        userName_fn: user.first_name,
        userName_ln: user.last_name,
        userName_initials: user.initials,
        userPicture: user.picture
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
        models.team.create({
            id_raid: idCurrentRaid,
            id_organizer: user.login
        });

        geocoder.search({q: req.body.raidPlace}) // allows to list all the locations corresponding to the city entered
            .then((response) => {
                if (response[0].lat !== undefined) {
                    raid_created.update({
                        place: response[0].display_name,
                        lat: response[0].lat,
                        lng: response[0].lon
                    }).then(() => {
                        res.redirect('/createraid/sports');
                    })
                } else {
                    if (req.body.selectedPlace !== "") {
                        let selectedParse = JSON.parse(req.body.selectedPlace);

                        raid_created.update({
                            lat: selectedParse.lat,
                            lng: selectedParse.lon
                        }).then(() => {
                            res.redirect('/createraid/sports');
                        })
                    }
                    res.redirect('/createraid/sports');
                }
            })
            .catch((error) => {
                console.log(error);
                res.redirect('/createraid/sports');
            });
    });

};

exports.displaySportsTable = function (req, res) {
    const sports = [];
    models.sport.findAll({
        order: ['name']
    }).then(function (sports_found) {
        sports_found.forEach(function (sport) {
            sports.push({name: sport.dataValues.name, id: sport.dataValues.id});
        });

        res.render(pages_path + "template.ejs", {
            pageTitle: "Création d'un Raid",
            page: "create_raid/sports",
            sports: sports,
            userName_fn: user.first_name,
            userName_ln: user.last_name,
            userName_initials: user.initials,
            userPicture: user.picture
        });
    });

};

exports.saveSportsRanking = function (req, res) {

    JSON.parse(req.body.sports_list).forEach(function (sport_row) {

        models.course.create({
            order_num: sport_row.order,
            label: sport_row.name,
            id_sport: sport_row.sport,
            id_raid: idCurrentRaid
        }).then(function () {
            res.redirect('/editraid/map');
        });

    })

};

exports.getGeocodedResults = function (req, res) {
    let geocoded_results = [];

    geocoder.search({q: req.body.query})
        .then((response) => {
            response.forEach(function (place) {
                geocoded_results.push({
                    name: place.display_name,
                    lat: place.lat,
                    lon: place.lon
                });
            });
            res.send(JSON.stringify(geocoded_results));
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
                        id_track: req.body.courseArray[0].id,
                        lat: vector.lat,
                        lng: vector.lng
                    })
                }
            });
    })
};