const pages_path = __dirname+"/../views/pages/";
const models = require('../models');
const sender = require("./sender");
const crypto = require('crypto');

exports.cgu = function(req, res) {
    res.render(pages_path + "termsandpolicy.ejs", {
        pageTitle : "Termes et conditions d'utilisation" // Nom de la page, affichée dans l'onglet
    });
};

exports.displayHome = function (req, res) {
    const user = connected_user(req.sessionID);
    res.render(pages_path + "home.ejs", {
        pageTitle: 'Accueil'
    });
};

exports.forgotten_password = function(req, res) {
    const reset_password_session_id = Math.random().toString(36).substr(2, 30);
    models.organizer.findByPk(req.body.mail).then(function(organizer){
        if(organizer !== null) {
            organizer.update({
                reset_password_id: reset_password_session_id
            }).then(function(){
                sender.sendResetPasswordMail(req.body.mail, reset_password_session_id);
                res.send(JSON.stringify({status: "ok"}));
            });
        }else{
            res.send(JSON.stringify({status: "nok"}));
        }
    });
};

exports.display_change_password = function(req, res){
    models.organizer.findByPk(req.query.email).then(function(organizer_found){
        if(organizer_found !== null) {
            if (organizer_found.dataValues.reset_password_id === req.query.id) {
                return res.render(pages_path + "reset_password/change_password.ejs", {
                    pageTitle: "Nouveau mot de passe",
                    email: req.query.email,
                    reset_password_id: req.query.id
                });
            }
        }
        return res.redirect("/register");
    })
};

exports.register_new_password = function(req, res){
    models.organizer.findByPk(req.body.email).then(function(organizer_found){
        if(organizer_found !== null){
            if(organizer_found.dataValues.reset_password_id === req.body.reset_password_id) {
                organizer_found.update({
                    password: crypto.createHmac('sha256', req.body.password).digest('hex'),
                    reset_password_id: null
                }).then(function () {
                    res.redirect("/login?new_password=1");
                });
            }else{
                res.redirect("/");
            }
        }
    });
};