const pages_path = __dirname+"/../views/pages/";

exports.cgu = function(req, res) {
    res.render(pages_path + "termsandpolicy.ejs", {
        pageTitle : "Termes et conditions d'utilisation" // Nom de la page, affichée dans l'onglet
    });
};