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
