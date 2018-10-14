const jdenticon = require('jdenticon');
const pages_path = "../views/pages/";
const models = require('../models');

exports.displayRegister = function(req, res){

    // TODO : get raid and activities informations from database and send it to ejs
    models.raid.findAll({
        attributes: ['id','name','edition','date','place']
    }).then(function(get_raid) {

        // TODO : get helper post  from database and send it to ejs
        //models.helper_post.findAll({
        //    attributes: ['id','id_point_of_interest','description']
        //});

        let get_raid_clean = [];
        for(let raid in get_raid) {
            get_raid_clean.push(get_raid[raid]['dataValues']);
        }

        if(get_raid_clean.length > 0) {
            res.render(pages_path + "helper_register.ejs", {
                pageTitle: "Inscription Bénévole",
                raids: get_raid_clean
          });
        }

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
                    id_helper: id,
                    id_helper: ...
                }).then(function () {

                    // TODO: redirect to helper_register with validMessage (organizer manage your inscription)

                    //res.render(pages_path + "helper_register.ejs", {
                    //    pageTitle: "Inscription Bénévole",
                    //    valideMessage: "Organizer manage your inscription, you will be contact soon..."
                    //});

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

            // TODO : page to see the map with the path to go to helper post

        } else { // id of new helper does not exist
            res.render(pages_path + "helper_register.ejs", {
                pageTitle: "Inscription Bénévole",
                errorMessage: "Cet identifiant n'existe pas..."
            });
        }
    });
};
