const express_lib = require('express');
const favicon = require('serve-favicon');
const path = require('path');
const jdenticon = require('jdenticon');
const app = express_lib();
const pages_path = __dirname + "/views/pages";


app.get("/", function(req, resp)
{
	let project_name = "IntoTheWoods";
	let picture = jdenticon.toSvg("GwendalRaballand", 80);
	resp.render(pages_path + "/template.ejs", {
	    "pageTitle" : "Accueil",
	    "page" : "accueil",
        "userName_fn" : "Gwendal",
        "userName_ln" : "Raballand",
        "userName_fn_" : "G",
        "userName_ln_" : "R",
        "userPicture" : picture
	});
});

// Make favicon available
app.use(favicon(path.join(__dirname,'views','img','favicon.png')));
app.use("/views", express_lib.static(__dirname + '/views'));
app.set('view engine', 'ejs');
console.log('Listen on http://localhost:8080');
app.listen(8080);