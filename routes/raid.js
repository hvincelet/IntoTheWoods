const jdenticon = require('jdenticon');
const pages_path = "../views/pages/";
const models = require('../models');

const Nominatim = require('nominatim-geocoder');
const geocoder = new Nominatim();

let idCurrentRaid;

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

        //geocoder.search( { q: 'Lannion, France' } ) // used for tests
        geocoder.search({q: req.body.raidPlace}) // allows to list all the locations corresponding to the city entered
            .then((response) => {
                console.log(response);
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

exports.displayMap = function (req, res) {

    models.raid.findOne({
        where: {
            id: idCurrentRaid
        }
    }).then(function (raid_found) {
        console.log(raid_found.dataValues);

        let picture = jdenticon.toPng(user.first_name.concat(user.last_name), 80).toString('base64');
        res.render(pages_path + "template.ejs", {
            pageTitle: "Gestion des Raids",
            page: "edit_raid/map",
            userName_fn: user.first_name,
            userName_ln: user.last_name,
            userName_initials: user.initials,
            userPicture: picture,
            raid: raid_found.dataValues
        });


    });


};