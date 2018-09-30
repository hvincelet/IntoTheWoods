const express = require('express');
var path = require('path');
var favicon = require('serve-favicon');

var routes = require('./routes/index');
var organizers  = require('./routes/organizers');

const app = express();

app.get("/", function(req, resp)
{
	let project_name = "IntoTheWoods";
	resp.render('index.ejs', {"name" : project_name});
});

app.listen(8080);