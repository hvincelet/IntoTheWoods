const express_lib = require('express');
const favicon = require('serve-favicon');
const path = require('path');
const jdenticon = require('jdenticon');
const app = express_lib();
const pages_path = __dirname + "/views/pages/";


app.get("/", function(req, resp) {
	let picture = jdenticon.toPng("GwendalRaballand", 80).toString('base64');

	resp.render(pages_path + "template.ejs", {
	    "pageTitle" : "Accueil",
	    "page" : "accueil",
        "userName_fn" : "Gwendal",
        "userName_ln" : "Raballand",
        "userName_initials" : "GR",
        "userPicture" : picture
	});
});

app.get("/login", function (req, resp) {
    if(req.query.logout === undefined){
        resp.render(pages_path + "login.ejs", {
            "pageTitle" : "Connexion"
        });
    }else{
        resp.render(pages_path + "logout.ejs", {
            "pageTitle" : "Déconnexion"
        });
    }
});

app.get("/register", function (req, resp) {
    resp.render(pages_path + "register.ejs", {
        "pageTitle" : "Inscription"
    });
});

app.get("/termsandpolicy", function (req, resp) {
    resp.render(pages_path + "termsandpolicy.ejs", {
        "pageTitle" : "Termes et conditions d'utilisation"
    });
});

// Make favicon available
app.use(favicon(path.join(__dirname,'views','img','favicon.png')));
app.use("/views", express_lib.static(__dirname + '/views'));
app.set('view engine', 'ejs');

// Do not write routes before these lines (handle 404 error)
app.use(function(req, resp, next) {
    resp.render(pages_path + "404.ejs", {
        "pageTitle" : "Erreur 404"
    });
});

console.log('Listen on http://localhost:8080');
app.listen(8080);