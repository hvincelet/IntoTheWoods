const jdenticon = require('jdenticon');
const pages_path = "../views/pages/";
const models = require('../models');


exports.displayLive = function(req, res){
	const idRaid = req.params.id;

	res.render(pages_path + "contents/live.ejs", {
		pageTitle: "Live !"
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
        console.log(stages_found);
        res.send(stages_found);
	});
}
