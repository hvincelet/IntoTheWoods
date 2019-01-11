const pages_path = "../views/pages/";
const models = require('../models');
const Twitter = require('twitter');
const config = require('../config/config')[global.env];
const credentials = require('../' + config.credentials);

exports.displayLive = function(req, res){
	const idRaid = req.params.id;

	/*****************/
    /*    Twitter    */
    /*****************/

    models.raid.findByPk(idRaid).then(function(raid_found){
        if(raid_found === null) return res.redirect("/");
        let text = "";
        if(raid_found.dataValues.hashtag !== null && raid_found.dataValues.hashtag !== ""){
            let client = new Twitter({
                consumer_key: credentials.twitter.TWITTER_CONSUMER_KEY,
                consumer_secret: credentials.twitter.TWITTER_CONSUMER_SECRET,
                access_token_key: credentials.twitter.TWITTER_ACCESS_TOKEN_KEY,
                access_token_secret: credentials.twitter.TWITTER_ACCESS_TOKEN_SECRET
            });
            client.get('search/tweets', {q: "#" + raid_found.dataValues.hashtag}, function(error, tweets, response) {
                let tweetsHtml = [];
                const getAllTweets = tweets.statuses.map(function(status){
                    return new Promise(function(resolve){
                        const id = status.id_str;
                        const name = status.screen_name;
                        const tweetDate = status.created_at;
                        client.get('statuses/oembed', {url: 'https://twitter.com/' + name + '/status/' + id})
                            .then(function(data){
                                tweetsHtml.push({date: new Date(tweetDate), html:data.html});
                                resolve();
                            });
                    });
                });
                Promise.all(getAllTweets).then(function(){
                    tweetsHtml.sort((a, b) => {
                        return a.date - b.date;
                    });
                    tweetsHtml.forEach((tweetHtml) => {
                        text += tweetHtml.html + '<br>';
                    });
                    res.render(pages_path + "contents/live/live.ejs", {
                        pageTitle: "Live !",
                        text: text
                    });
                });
            });
        }else{
            res.render(pages_path + "contents/live/live.ejs", {
                pageTitle: "Live !",
                text: text
            });
        }
    });
};

exports.displayAllLive = function(req, res){

    res.render(pages_path + "contents/live/raid_selection.ejs", {
        pageTitle: "Sélection d'un Live!"
    });
};

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
};
