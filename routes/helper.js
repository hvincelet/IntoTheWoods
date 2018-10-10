const jdenticon = require('jdenticon');
const pages_path = "../views/pages/";
const models = require('../models');

exports.displayRegister = function(req, res){

    res.render(pages_path + "helper_register.ejs", {
    pageTitle: "Inscription Bénévole"
    });

};

exports.register = function(req, res){

    let id = Math.random().toString(36).substr(2, 6); // generate id helper

    models.helper.findOne({
        where: {
            login: id
        }
    }).then(function (helper_found) {
        if (helper_found !== null) { // helper with id generated already exist
            while(helper_found !== null) {
                id = Math.random().toString(36).substr(2, 6);
                models.helper.findOne({
                    where: {
                        login:id
                    }
                }).then(function(test_helper) {
                    helper_found = test_helper;
                });
            }
        } else { // helper with id generated does not exist
            models.helper.create({ // registration of the new helper
                login: id,
                email: req.body.registerEmail,
                last_name: req.body.registerUserLn,
                first_name: req.body.registerUserFn
            }).then(function () {
                // TODO: create assignment with poste(s) and helper in assignment table
                
                /*
                models.assignment.create({ // create assignment with the new helper and poste(s)
                    login: id,
                    email: req.body.registerEmail,
                    last_name: req.body.registerUserLn,
                    first_name: req.body.registerUserFn
                }).then(function () {
                    // TODO:

                });
                */
            });
        }
    });
};

exports.displayHome = function(req, res){

    let id = req.params.id;

    models.helper.findOne({
        where: {
            login: id
        }
    }).then(function (helper_found) {
        if (helper_found !== null) { // id of helper exist

            console.log(helper_found.login);
            console.log(helper_found.last_name);
            console.log(helper_found.first_name);

        } else { // id of new helper does not exist
            res.render(pages_path + "helper_register.ejs", {
                pageTitle: "Inscription Bénévole",
                errorMessage: "Cet identifiant n'existe pas..."
            });
        }
    });
};
