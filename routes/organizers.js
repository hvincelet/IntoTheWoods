var models  = require('../models');
var express = require('express');
var router  = express.Router();

router.post('/create', function(req, res) {
  models.Organizer.create({
    login      :req.body.login,
    first_name :req.body.first_name,
    last_name  :req.body.last_name,
    password   :req.body.password
  }).then(function() {
    res.redirect('/');
  });
});

router.get('/:login/destroy', function(req, res) {
  models.Organizer.destroy({
    where: {
      id       :req.params.login
    }
  }).then(function() {
    res.redirect('/');
  });
});

module.exports = router;
