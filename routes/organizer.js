const jdenticon = require('jdenticon');
const pages_path = "../views/pages/";
const models = require('../models');
const crypto = require('crypto');

exports.displayHome = function (req, res) {
    let picture = jdenticon.toPng(user.first_name.concat(user.last_name), 80).toString('base64');

    res.render(pages_path + "template.ejs", {
        pageTitle: "Accueil",
        page: "accueil",
        userName_fn: user.first_name,
        userName_ln: user.last_name,
        userName_initials: user.initials,
        userPicture: picture
    });
};

exports.displayLogScreen = function (req, res) {
    user.authenticated = false;
    res.render(pages_path + "login.ejs", {
        pageTitle: "Connexion"
    });
};

exports.idVerification = function (req, res) {
    let id = req.body.loginUsername;
    let hash = crypto.createHmac('sha256', req.body.loginPassword).digest('hex');

    models.organizer.findOne({
        where: {
            email: id, password: hash
        }
    }).then(function (organizer_found) {
        if (organizer_found !== null) { // the (email,password) couple exists => the organizer is authenticated
            user.authenticated = true;
            user.first_name = organizer_found.dataValues.first_name;
            user.last_name = organizer_found.dataValues.last_name;
            user.initials = user.first_name.charAt(0).concat(user.last_name.charAt(0)).toUpperCase();
            return res.redirect('/');
        } else {
            res.render(pages_path + "login.ejs", {
                pageTitle: "Connexion",
                errorMessage: "Identifiants incorrects..."
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
    }).then(function (organizer_found) {
        if (organizer_found !== null) { // organizer with entered email already exist
            res.render(pages_path + "register.ejs", {
                pageTitle: "Inscription",
                errorMessage: "Cette adresse email est déjà utilisée..."
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
