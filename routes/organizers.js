var models  = require('../models');
var express = require('express');
var router  = express.Router();

router.post('/create', function(req, res) {

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
