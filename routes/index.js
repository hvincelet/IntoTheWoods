var models  = require('../models');
var express = require('express');
var router  = express.Router();

router.get('/', function(req, res) {
	models.Organizer.findAll({
		include: [ models.Task ]
	}).then(function(organizers) {
		res.render('index', {
			title: 'IntoTheWoods: Organizer Example',
			organizers: organizers
		});
	});
});

module.exports = router;
