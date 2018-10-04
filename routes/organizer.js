const jdenticon = require('jdenticon');
const pages_path = "../views/pages/";
const models = require('../models');
const crypto = require('crypto');

let first_name;
let last_name;
let initials;

exports.displayHome = function (req, res) {
    if (first_name !== undefined) { // must be replaced by a middleware
        let picture = jdenticon.toPng(first_name.concat(last_name), 80).toString('base64');

        res.render(pages_path + "template.ejs", {
            pageTitle: "Accueil",
            page: "accueil",
            userName_fn: first_name,
            userName_ln: last_name,
            userName_initials: initials,
            userPicture: picture
        });
    } else {
        res.redirect('/login');
    }
};

exports.displayLogScreen = function (req, res) {
    res.render(pages_path + "login.ejs", {
        pageTitle: "Connexion"
    });
};

exports.checkAuthentication = function (req, res) {
    let id = req.body.loginUsername;
    let hash = crypto.createHmac('sha256', req.body.loginPassword).digest('hex');

    models.organizer.findOne({
        where: {
            email: id, password: hash
        }
    }).then(function (organizer) {
        if (organizer !== null) {
            first_name = organizer.dataValues.first_name;
            last_name = organizer.dataValues.last_name;
            initials = first_name.charAt(0).concat(last_name.charAt(0)).toUpperCase();
            return res.redirect('/');
        } else {
            //return res.redirect('/login');
            res.render(pages_path + "login.ejs", {
                pageTitle: "Connexion",
                errorMessage: "Identifiants incorrects"
            });
        }
    });
};

exports.displayRegister = function (req, res) {
    res.render(pages_path + "register.ejs", {
        pageTitle: "Inscription"
    });
};

exports.register = function (req, res) {
    let hash = crypto.createHmac('sha256', req.body.registerPassword).digest('hex');
    let email = req.body.registerEmail;

    models.organizer.findOne({
        where: {
            email: email
        }
    }).then(function (organizer) {
        if (organizer !== null) { // organizer with entered email already exist
            res.render(pages_path + "register.ejs", {
                pageTitle: "Inscription",
                errorMessage: "Cette adresse email est déjà utilisée"
            });
        } else { // registration of the new organizer
            models.organizer.create({
                email: email,
                first_name: req.body.registerUserFn,
                last_name: req.body.registerUserLn,
                password: hash
            }).then(function () {
                res.redirect('/login');
            });
        }
    });

};

exports.createraid = function (req, res) {
    let picture = jdenticon.toPng(first_name.concat(last_name), 80).toString('base64');

    const sports = [];
    models.sport.findAll({order: ['name']}).then(function (sports_bdd) {
        sports_bdd.forEach(function (sport) {
            sports.push(sport.dataValues.name);
        });

        res.render(pages_path + "template.ejs", {
            pageTitle: "Création d'un Raid",
            page: "create_raid/"+req.params.page,
            sports : sports,
            userName_fn: first_name,
            userName_ln: last_name,
            userName_initials: initials,
            userPicture: picture
        });
    });
};