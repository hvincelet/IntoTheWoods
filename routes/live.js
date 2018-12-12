const jdenticon = require('jdenticon');
const pages_path = "../views/pages/";
const models = require('../models');


exports.displayLive = function(req, res){
	const idRaid = req.params.id;

    let coursesModel = models.course;
    let sportsModel = models.sport;

    coursesModel.belongsTo(sportsModel, {foreignKey: 'id_sport'});

    coursesModel.findAll({
        attributes: ['id', 'order_num', 'label'],
        where: {
            id_raid: idRaid
        },
        include: [{
            model: sportsModel,
            attributes: ['name'],
        }]
    }).then(function(coursesFound){
        models.participant.findAll({
            where: {
                id_raid: idRaid
            }
        }).then(function(participantsFound){
            if(coursesFound !== null) {
                res.render(pages_path + "contents/live.ejs", {
                    pageTitle: "Live !",
                    courses: coursesFound,
                    participants : participantsFound
                });
            }
            else{
                res.render(pages_path + "contents/live.ejs", {
                    pageTitle: "Live !"
                });
            }
        });
    });
}

exports.getData = function(req, res){
	const idRaid = req.params.id;
	let get_stages_clean = [];

    let stage_model = models.stage;
    let course_model = models.course;
    let participant_model = models.participant;

    stage_model.belongsTo(course_model, {foreignKey: 'id_course'});
    stage_model.belongsTo(participant_model, {foreignKey: 'id_participant'});

	stage_model.findAll({
      	include: [{
            model: course_model,
    		where: {id_raid: idRaid}
    	},
        {
            model: participant_model
        }],
        raw:true
	}).then(function(stages_found){
        res.send(stages_found);
	});
}
