const jdenticon = require('jdenticon');
const pages_path = "../views/pages/";
const models = require('../models');

exports.displayRegister = function(req, res){

    // TODO : get helper post from database (link to current raid) and send it to ejs

    let find_id = 3; // temporary
    let get_post_clean = [];

    models.course.findAll({
        attributes: ['id'],
        where: {
            id_raid: find_id
        }
    }).then(function(get_course){

        if(get_course !== null) {
          
        }

        for(let course in get_course){
            models.point_of_interest.findAll({
                attributes: ['id'],
                where: {
                    id_track: get_course[course]['dataValues']['id']
                }
            }).then(function(get_point_of_interest){

                for(let point_of_interest in get_point_of_interest){
                    models.helper_post.findAll({
                        attributes: ['id','description'],
                        where: {
                            id_point_of_interest: get_point_of_interest[point_of_interest]['dataValues']['id']
                        }
                    }).then(function(get_helper_post){

                        for(let helper_post in get_helper_post) {
                            console.log(get_helper_post[helper_post]['dataValues']);
                            get_post_clean.push(get_helper_post[helper_post]['dataValues']);
                        }
                    });
                }
            });

            console.log(get_post_clean);
        }

        res.render(pages_path + "helper_register.ejs", {
            pageTitle: "Inscription Bénévole",
            activity: get_post_clean
        });
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
