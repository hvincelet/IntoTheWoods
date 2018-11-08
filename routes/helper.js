const jdenticon = require('jdenticon');
const pages_path = "../views/pages/";
const models = require('../models');

exports.inviteHelper = function(req, res) {
    const user = connected_user(req.sessionID);
    if(!user.raid_list.find(function(raid){return raid.id == req.params.raid_id})){
        return res.redirect('/dashboard');
    }
    const helper_emails = req.body.mails;
    //const helper_emails = ['hvincele@enssat.fr'];
    helper_emails.forEach(function(helper_email){
        if(helper_email != user.login){
            let assignment_model = models.assignment;
            let helper_model = models.helper;
            let helper_post_model = models.helper_post;
            let point_of_interest_model = models.point_of_interest;

            helper_model.belongsTo(assignment_model, {foreignKey: 'login'});
            assignment_model.belongsTo(helper_post_model, {foreignKey: 'id_helper_post'});
            helper_post_model.belongsTo(point_of_interest_model, {foreignKey: 'id_point_of_interest'});

            helper_model.findOne({
                where: {
                    email: helper_email
                },
                include: [{
                    model: assignment_model,
                    include: [{
                        model: helper_post_model,
                        include:[{
                            model: point_of_interest_model,
                            where: {
                                id_raid: req.params.id
                            }
                        }]
                    }]
                }]
            }).then(function(helper_found){
                if(!helper_found){
                    //sender.sendMailToHelperToInviteThem(helper_email, );
                }
            });
        }
    });
};

exports.displayRegister = function(req, res){

    let raid_id = req.query.raid;
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
                  id: raid_id
              }
          }]
      }],
      attributes: ['id','description','nb_helper']
    }).then(function(helper_posts_found){
        if(helper_posts_found !== null){
            helper_posts_found.forEach(function(helper_post, index, helper_posts_array){
                models.assignment.findAndCountAll({
                    where: {
                        id_helper_post: helper_post.dataValues.id,
                        attributed: 1
                    }
                }).then(function(all_assignement){
                    if(helper_post.dataValues.point_of_interest != null && helper_post.dataValues.nb_helper - all_assignement.count > 0){
                        get_post_clean.push({'id':helper_post.dataValues.id,'description':helper_post.dataValues.description});
                    }
                    if(index == helper_posts_array.length -1){
                        res.render(pages_path + "helper_register.ejs", {
                            pageTitle: "Inscription Bénévole",
                            activity: get_post_clean
                        });
                    }
                });
            });
        }
    });
};

exports.register = function(req, res){

    let id_helper = Math.random().toString(36).substr(2, 6);
    const registerEmail = req.body.registerEmail;
    const registerUserLn = req.body.registerUserLn;
    const registerUserFn = req.body.registerUserFn;
    const helperPostsWished = req.body.registerRun;

    models.helper.findOne({
        where: {
            login: id_helper
        }
    }).then(function (helper_found) {
        if (helper_found !== null) {
            while(helper_found !== null) {
                id_helper = Math.random().toString(36).substr(2, 6);
                models.helper.findOne({
                    where: {
                        login: id_helper
                    }
                }).then(function(test_helper) {
                    helper_found = test_helper;
                });
            }
        } else {
            models.helper.create({
                login: id_helper,
                email: registerEmail,
                last_name: registerUserLn,
                first_name: registerUserFn
            }).then(function () {
                // TODO : sort helperPostsWished 
                helperPostsWished.forEach(function(id_activity){
                    models.assignment.create({
                        id_helper: id_helper,
                        id_helper_post: id_activity,
                        attributed: 0
                    });
                });
                res.redirect("/helper/" + id_helper + "/home");
            });
        }
    });
};

exports.displayHome = function(req, res){

    models.assignment.findOne({
        where: {
            id_helper: req.params.id
        }
    }).then(function (assignment_found) {
        if (assignment_found !== null) {
            if (assignment_found.attributed == 0){
                res.render(pages_path + "helper_register.ejs", {
                    pageTitle: "Inscription Bénévole",
                    errorMessage: "Vous n'avez pas encore été attribué à un poste."
                });
            } else {

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
                errorMessage: "Cet identifiant n'existe pas."
            });
        }
    });
};
