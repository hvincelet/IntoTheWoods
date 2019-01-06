const jdenticon = require('jdenticon');
const pages_path = "../views/pages/";
const models = require('../models');

// Register new participant default page
exports.displayRegister = function(req, res){
    var  get_raids_clean = [];

    let raid_model = models.raid;

    raid_model.findAll({
        attributes: ['id','name','date','edition']
    }).then(function(raids_found){
        if(raids_found !== null){
            const raidsCounter = raids_found.map(function(raid, index, raid_array){
                return new Promise(resolve => {
                    models.raid.findAndCountAll().then(function(all_assignement){
                        if(Date.parse(raid.dataValues.date) >= Date.now()){
                            get_raids_clean.push({'id':raid.dataValues.id,'name':raid.dataValues.name,'edition':raid.dataValues.edition,'date':raid.dataValues.date});
                        }
                        return resolve();
                    });
                })
            });


            Promise.all(raidsCounter).then(function(){
                if(get_raids_clean !== null && get_raids_clean.length > 0){
                    res.render(pages_path + "participant_register.ejs", {
                        pageTitle: "Inscription Participant",
                        raids: get_raids_clean
                    });
                }
                else{
                    res.render(pages_path + "participant_register.ejs", {
                        pageTitle: "Inscription Participant",
                        errorMessage: "Aucun raid à venir pour le moment. Veuillez réessayer plus tard."
                    });
                }
            })
        }
        else{
            res.render(pages_path + "participant_register.ejs", {
                pageTitle: "Inscription Participant",
                errorMessage: "Aucun raid à venir pour le moment. Veuillez réessayer plus tard."
            });
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
    //TODO
};