const jdenticon = require('jdenticon');
const pages_path = "../views/pages/";

exports.displayHome = function(req, res) {
    let picture = jdenticon.toPng("GwendalRaballand", 80).toString('base64');

    res.render(pages_path + "template.ejs", {
        pageTitle : "Accueil",
        page : "accueil",
        userName_fn : "Gwendal",
        userName_ln : "Raballand",
        userName_initials : "GR",
        userPicture : picture
    });
};

exports.displayLogScreen = function(req, res) {
    res.render(pages_path + "login.ejs", {
        pageTitle : "Connexion" // Nom de la page, affichée dans l'onglet
    });
};

exports.checkAuthentification = function(req, res) {
    let id = req.body.loginUsername;
    let pwd = req.body.loginPassword;
    console.log('ici');
    console.log(id, pwd);
};