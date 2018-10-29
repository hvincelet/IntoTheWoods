const jdenticon = require('jdenticon');
const pages_path = "../views/pages/";
const models = require('../models');

// Register new Helper default page
exports.displayRegister = function(req, res){

    let find_id = 1; // temporary
    let get_post_clean = [];

    let raid_model = models.raid;
    let point_of_interest_model = models.point_of_interest;
    let helper_post_model = models.helper_post;

    point_of_interest_model.belongsTo(raid_model, {foreignKey: 'id_raid'});
    helper_post_model.belongsTo(point_of_interest_model, {foreignKey: 'id_point_of_interest'});

    // Get helper_post from database link to point of interest of current raid (JOIN LEVEL 2)
    helper_post_model.findAll({
      include: [{
          model: point_of_interest_model,
          include: [{
              model: raid_model,
              where: {
                  id: find_id
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

// Register new Helper with post form
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
                // Create assignment with poste(s) and helper in assignment table
                registerRun.forEach(function(id_activity){
                    models.assignment.create({ // create assignment with the new helper and poste(s)
                        id_helper: id,
                        id_helper_post: id_activity
                    });
                });
                // Redirect to helper_register with validMessage (organizer manage your inscription)
                res.render(pages_path + "helper_register.ejs", {
                    pageTitle: "Inscription Bénévole"
                });
            });
        }
    });
};

exports.displayHome = function(req, res){

    let id = req.params.id;

    models.assignment.findOne({
        where: {
            id_helper: id
        }
    }).then(function (assignment_found) {
        if (assignment_found !== null) { // id of helper exist
            if (assignment_found.attributed == 0){
                res.render(pages_path + "helper_register.ejs", {
                    pageTitle: "Inscription Bénévole",
                    errorMessage: "Cet identifiant n'a pas encore été attribué à un poste..."
                });
            } else {
                // TODO : page to see the map with the path to go to helper post
                console.log(assignment_found.id_helper);
                console.log(assignment_found.id_helper_post);

                models.helper.findOne({
                    where: {
                        login: assignment_found.id_helper
                    }
                }).then(function(helper_found){
                    if (helper_found !== null){
                        models.helper_post.findOne({
                            where: {
                                id: assignment_found.id_helper_post
                            }
                        }).then(function(helper_post_found){
                            if (helper_post_found !== null){
                                models.point_of_interest.findOne({
                                    where: {
                                        id: helper_post_found.id_point_of_interest
                                    }
                                }).then(function(point_of_interest_found){
                                    if (point_of_interest_found !== null){
                                        res.render(pages_path + "helper_home.ejs", {
                                            pageTitle: "Parcours Bénévole",
                                            assignment: assignment_found,
                                            helper: helper_found,
                                            helper_post: helper_post_found,
                                            point_of_interest: point_of_interest_found
                                        });
                                    }
                                });
                            }
                        })
                    }
                })
            }

        } else { // id of helper does not exist
            res.render(pages_path + "helper_register.ejs", {
                pageTitle: "Inscription Bénévole",
                errorMessage: "Cet identifiant n'existe pas ..."
            });
        }
    });
};
