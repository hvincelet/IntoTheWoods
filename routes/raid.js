const jdenticon = require('jdenticon');
const pages_path = "../views/pages/";
const models = require('../models');

exports.displayStart = function (req, res) {
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
            page: "create_raid/" + req.params.page,
            sports: sports,
            userName_fn: user.first_name,
            userName_ln: user.last_name,
            userName_initials: user.initials,
            userPicture: picture
        });
    });
};

exports.storeInformations = function (req, res) {

};