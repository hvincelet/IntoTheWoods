

const express_lib = require('express');
const app = express_lib();

app.get("/", function(req, resp)
{
	let project_name = "IntoTheWoods";
	resp.render('default.ejs', {"name" : project_name});
});

app.listen(8080);