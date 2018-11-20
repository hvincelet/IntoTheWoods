const pages_path = "../views/pages/helpers/";
const models = require('../models');
const sender = require('./sender');

exports.inviteHelper = function (req, res) {
    const user = connected_user(req.sessionID);
    if(!user.raid_list.find(function(raid){return raid.id === parseInt(req.params.raid_id);})){
        return res.redirect('/dashboard');
    }
    const helper_emails = req.body.mails;
    let helper_invite_status = [];
    helper_emails.forEach(function(helper_email, index){
        if(helper_email !== user.login){
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
                    sender.inviteHelper({
                        email: helper_email,
                        raid: req.body.raid
                    });
                    helper_invite_status.push({
                        id: helper_email,
                        status: "ok"
                    });
                }
                if(index === helper_emails.length - 1) {
                    res.send(JSON.stringify({status: helper_invite_status}));
                }
            });
        }else{
            helper_invite_status.push({
                id: helper_email,
                status: "mail-is-login"
            });
        }
    });

    res.send(JSON.stringify({status: helper_invite_status}));
};

exports.displayRegister = function(req, res){
    const raid_id = req.query.raid;
    let get_post_clean = [];

    let point_of_interest_model = models.point_of_interest;
    let helper_post_model = models.helper_post;

    helper_post_model.belongsTo(point_of_interest_model, {foreignKey: 'id_point_of_interest'});

    models.raid.findById(raid_id, {attributes:['name', 'edition']}).then(function(raid_found){
        helper_post_model.findAll({
          include: [{
              model: point_of_interest_model,
              where: {
                  id_raid: raid_id
              }
          }],attributes: ['id', 'title', 'nb_helper']
        }).then(function(helper_posts_found){
            console.log(helper_posts_found);
            if(helper_posts_found.length > 0){
                helper_posts_found.forEach(function(helper_post, index, helper_posts_array){
                    models.assignment.findAndCountAll({
                        where: {
                            id_helper_post: helper_post.dataValues.id,
                            attributed: 1
                        }
                    }).then(function(all_assignement){
                        if(helper_post.dataValues.point_of_interest !== null && helper_post.dataValues.nb_helper - all_assignement.count > 0){
                            get_post_clean.push({'id':helper_post.dataValues.id,'title':helper_post.dataValues.title});
                        }else if(helper_post.dataValues.title === "Backup"){
                            get_post_clean.push({'id':helper_post.dataValues.id,'title':helper_post.dataValues.title});
                        }
                        if (index === helper_posts_array.length - 1) {
                            res.render(pages_path + "helper_register.ejs", {
                                pageTitle: "Inscription Bénévole",
                                activity: get_post_clean,
                                raid: {
                                    name: raid_found.dataValues.name,
                                    edition: raid_found.dataValues.edition
                                }
                            });
                        }
                    });
                });
            }else{
                res.render(pages_path + "helper_register.ejs", {
                    pageTitle: "Inscription Bénévole",
                    activity: get_post_clean,
                    raid: {
                        name: raid_found.dataValues.name,
                        edition: raid_found.dataValues.edition
                    }
                });
            }
        });
    });
};

exports.register = function (req, res) {

    let id_helper = Math.random().toString(36).substr(2, 7);
    const registerEmail = req.body.registerEmail;
    const registerUserLn = req.body.registerUserLn;
    const registerUserFn = req.body.registerUserFn;
    let helperPostsWished = JSON.parse(req.body.wishes);

    models.helper.findOne({
        where: {
            login: id_helper
        }
    }).then(function (helper_found) {
        while(helper_found !== null) {
            id_helper = Math.random().toString(36).substr(2, 7);
            models.helper.findOne({
                where: {
                    login: id_helper
                }
            }).then(function(test_helper) {
                helper_found = test_helper;
            });
        }
        models.helper.create({
            login: id_helper,
            email: registerEmail,
            last_name: registerUserLn,
            first_name: registerUserFn
        }).then(function () {
            helperPostsWished.map(wish =>{
                models.assignment.create({
                    id_helper: id_helper,
                    id_helper_post: wish.id,
                    order: wish.order
                });
            });
            res.redirect("/helper/" + id_helper + "/home");
        });
    });
};

exports.displayHome = function (req, res) {

    models.assignment.findAll({
        where: {
            id_helper: req.params.id
        }
    }).then(function (assignments_found) {
        if (assignments_found !== null) {
            const assignment_found = assignments_found.find(function(assignment){return assignment.attributed === 1;});
            if (assignment_found === undefined){
                res.render(pages_path + "helper_home.ejs", {
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
