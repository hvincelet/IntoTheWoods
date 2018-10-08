const jdenticon = require('jdenticon');
const pages_path = "../views/pages/";
const models = require('../models');

const nominatim = require('nominatim');

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

exports.storeDescriptionInfos = function (req, res) {

    nominatim.search({ q: 'Rennes, 35000, France, France'}, function(err, opts, results) {
        console.log(results);
    });

    models.raid.create({
        name: req.body.raidName,
        date: req.body.raidStartDate,
        place: req.body.raidPlace,
        edition: req.body.raidEdition
    }).then(function (raid_created) {
        idCurrentRaid = raid_created.dataValues.id;
        res.redirect('/editraid/map');
    });

};

exports.displayMap = function (req, res) {

    let picture = jdenticon.toPng(user.first_name.concat(user.last_name), 80).toString('base64');
    res.render(pages_path + "template.ejs", {
        pageTitle: "Gestion des Raids",
        page: "edit_raid/map",
        userName_fn: user.first_name,
        userName_ln: user.last_name,
        userName_initials: user.initials,

        userPicture: picture
    });

};