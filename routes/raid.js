const pages_path = "../views/pages/";
const models = require('../models');

const Nominatim = require('nominatim-geocoder');
const geocoder = new Nominatim();


exports.init = function(req, res){
    const user = connected_user(req.sessionID);
    res.render(pages_path + "template.ejs", {
        pageTitle: "Création d'un Raid",
        page: "create_raid/start",
        user: user
    });
};
exports.displayDescriptionForm = function (req, res) {
    const user = connected_user(req.sessionID);
    res.render(pages_path + "template.ejs", {
        pageTitle: "Création d'un Raid",
        page: "create_raid/description",
        user: user
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
        let user = connected_user(req.sessionID);
        user.idCurrentRaid = raid_created.dataValues.id;
        // console.log("user.idCurrentRaid = "+user.idCurrentRaid);
        models.team.create({
            id_raid: user.idCurrentRaid,
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
        const user = connected_user(req.sessionID);
        res.render(pages_path + "template.ejs", {
            pageTitle: "Création d'un Raid",
            page: "create_raid/sports",
            sports: sports,
            user: user
        });
    });

};

exports.saveSportsRanking = function (req, res) {
    let user = connected_user(req.sessionID);
    if(user.idCurrentRaid === -1){
        return res.redirect('/dashboard');
    }
    JSON.parse(req.body.sports_list).forEach(function (sport_row) {

        models.course.create({
            order_num: sport_row.order,
            label: sport_row.name,
            id_sport: sport_row.sport,
            id_raid: user.idCurrentRaid
        }).then(function () {
            models.raid.findOne({
                attributes: ['id', 'name', 'edition'],
                where: {id: user.idCurrentRaid}
            }).then(function(unique_raid_found){
                user.raid_list.push({
                    id: user.idCurrentRaid,
                    name: unique_raid_found.dataValues.name,
                    edition: unique_raid_found.dataValues.edition
                });
                res.redirect('/editraid/' + user.idCurrentRaid + '/map');
            });
        });

    });
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

exports.displayAllRaids = function (req, res) {
    const user = connected_user(req.sessionID);
    if(user.raid_list.length !== 0) {
        res.render(pages_path + "template.ejs", {
            pageTitle: "Gestion des Raids",
            page: "edit_raid/all",
            user: user
        });
    }else{
        res.redirect('/dashboard');
    }
};

exports.displayRaid = function (req, res) {
    const user = connected_user(req.sessionID);
    if(user.raid_list.length === 0) {
        res.redirect('/dashboard');
    }else{
        let found = user.raid_list.find(function (raid) {
            return raid.id === parseInt(req.params.id);
        });
        if(!found){
            res.redirect('/editraid')
        }else{ // User is authenticated and allow to access this page
            let organizers_linked_with_the_current_raid = [];
            let helpers_linked_with_the_current_raid = [];
             // get organizer (email, first_name, last_name)
            organizers_linked_with_the_current_raid.push({
                email: "graballa@enssat.fr",
                first_name: 'Gwendal',
                last_name: 'Raballand'
            });
            organizers_linked_with_the_current_raid.push({
                email: "jderoux@enssat.fr",
                first_name: 'Julien',
                last_name: 'Deroux'
            });

            // Get helpers (email, first_name, last_name, posts)
            helpers_linked_with_the_current_raid.push({
               email: 'hvincele@enssat.fr',
               first_name: 'Hugo',
               last_name: 'Vincelet',
               posts: ['Accueil', 'Buvette', 'Kayak', 'Circulation']
            })
            helpers_linked_with_the_current_raid.push({
                email: 'gsicard@enssat.fr',
                first_name: 'Guillaume',
                last_name: 'Sicard',
                posts: ['Circulation']
            });

            // Get Courses

            res.render(pages_path + "template.ejs", {
                pageTitle: "Gestion d'un Raid",
                page: "edit_raid/details",
                user: user,
                raid: found,
                organizers: organizers_linked_with_the_current_raid,
                helpers: helpers_linked_with_the_current_raid
            });
        }
    }
};