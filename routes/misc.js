const pages_path = __dirname+"/../views/pages/";
const models = require('../models');

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