const jdenticon = require('jdenticon');
const pages_path = "../views/pages/";
const models = require('../models');

// Register new participant default page
exports.displayRegister = function(req, res){
    let raid_id = req.query.raid;
    let get_raids_clean = [];

    let raid_model = models.raid;

    raid_model.findAll({
      attributes: ['id','name','date','edition']
    }).then(function(raids_found){
        if(raids_found !== null){
            raids_found.forEach(function(raid, index, raid_array){
                models.raid.findAndCountAll().then(function(all_assignement){
                    if(Date.parse(raid.dataValues.date) >= Date.now()){
                        get_raids_clean.push({'id':raid.dataValues.id,'name':raid.dataValues.name,'edition':raid.dataValues.edition,'date':raid.dataValues.date});
                    }

                    if(index == raid_array.length -1){
                        res.render(pages_path + "participant_register.ejs", {
                            pageTitle: "Inscription Participant",
                            raids: get_raids_clean
                        });
                    }
                });
            });
        }
        else{
            //TODO mettre un render
        }
    });
};

exports.register = function(req, res){
    const registerUserLn = req.body.registerUserLn;
    const registerUserFn = req.body.registerUserFn;
    const partipantRaid = req.body.registerRun;

    models.participant.create({
        id_raid: partipantRaid,
        first_name: registerUserFn,
        last_name: registerUserLn
    }).then(function () {
        res.redirect("/");
        //sender.sendMailToOrganizer(req.body.email, hash);
        //res.send(JSON.stringify({msg: "ok"}));
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
                    errorMessage: "Vous n'avez pas encore été attribué à un poste."
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
                errorMessage: "Cet identifiant n'existe pas."
            });
        }
    });
};
