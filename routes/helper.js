const jdenticon = require('jdenticon');
const pages_path = "../views/pages/";
const models = require('../models');
const Sequelize = require('sequelize');

exports.displayRegister = function(req, res){

    let find_id = 3; // temporary
    let get_post_clean = [];

    let course_model = models.course;
    let point_of_interest_model = models.point_of_interest;
    let helper_post_model = models.helper_post;

    point_of_interest_model.belongsTo(course_model, {foreignKey: 'id_track'});
    helper_post_model.belongsTo(point_of_interest_model, {foreignKey: 'id_point_of_interest'});

    // TODO : get point of interest from database link to current raid (JOIN LEVEL 1)
    /*
    point_of_interest_model.findAll({
        include: [{
            model: course_model,
            where: {
                id_raid: find_id
            }
        }],
        attributes: ['id','lat','lng']
    }).then(function(point_of_interest_found){
        if(point_of_interest_found){
            //console.log(point_of_interest_found);
            point_of_interest_found.forEach(function(tuple){
                console.log(tuple.dataValues);
            });
        }
    });
    */

    // TODO : get helper_post from database link to point of interest of current raid (JOIN LEVEL 2)
    helper_post_model.findAll({
      include: [{
          model: point_of_interest_model,
          include: [{
              model: course_model,
              where: {
                  id_raid: find_id
              }
          }]
      }],
      attributes: ['id','description']
    }).then(function(helper_post_found){
        if(helper_post_found !== null){
            helper_post_found.forEach(function(tuple){
                if(tuple.dataValues.point_of_interest != null){
                    get_post_clean.push({'id':tuple.dataValues.id,'description':tuple.dataValues.description});
                }
            });
            res.render(pages_path + "helper_register.ejs", {
                pageTitle: "Inscription Bénévole",
                activity: get_post_clean
            });
        }
    });
};

exports.register = function(req, res){

    let id = Math.random().toString(36).substr(2, 6); // generate id helper
    let registerEmail = req.body.registerEmail;
    let registerUserLn = req.body.registerUserLn;
    let registerUserFn = req.body.registerUserFn;
    let registerRun = req.body.registerRun;

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
                email: registerEmail,
                last_name: registerUserLn,
                first_name: registerUserFn
            }).then(function () {
                // TODO: create assignment with poste(s) and helper in assignment table
                registerRun.forEach(function(id_activity){
                    models.assignment.create({ // create assignment with the new helper and poste(s)
                        id_helper: id,
                        id_helper_post: id_activity
                    });
                });
                // TODO: redirect to helper_register with validMessage (organizer manage your inscription)
                res.render(pages_path + "helper_register.ejs", {
                    pageTitle: "Inscription Bénévole"
                });
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
