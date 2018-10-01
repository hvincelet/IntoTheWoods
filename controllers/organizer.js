const jdenticon = require('jdenticon');
const pages_path = "../views/pages/";
const models = require('../models');



exports.displayHome = function (req, res) {
    let picture = jdenticon.toPng("GwendalRaballand", 80).toString('base64');

    //models.get

    res.render(pages_path + "template.ejs", {
        pageTitle: "Accueil",
        page: "accueil",
        userName_fn: "Gwendal",
        userName_ln: "Raballand",
        userName_initials: "GR",
        userPicture: picture
    });
};

exports.displayLogScreen = function (req, res) {

    res.render(pages_path + "login.ejs", {
        pageTitle: "Connexion" // Nom de la page, affichée dans l'onglet
    });
};

exports.checkAuthentification = function (req, res) {
    let id = req.body.loginUsername;
    let pwd = req.body.loginPassword;

    console.log(id, pwd);
    return res.redirect('/');
};

exports.displayRegister = function (req, res) {
    res.render(pages_path + "register.ejs", {
        pageTitle: "Inscription" // Nom de la page, affichée dans l'onglet
    });
};

exports.register = function (req, res) {

    let pwd = req.body.registerPassword;

    //sha256 (registerPassword);

    //console.log(models());
    /*
    Organizer.module.create({
        email      :req.body.registerEmail,
        first_name :req.body.registerUserFn,
        last_name  :req.body.registerUserLn,
        password   :pwd
    });*/

    models.organizer.create({
        email      :req.body.registerEmail,
        first_name :req.body.registerUserFn,
        last_name  :req.body.registerUserLn,
        password   :pwd
    }).then(function() {
        res.redirect('/');
    });
};