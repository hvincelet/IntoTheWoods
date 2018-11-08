const pages_path = "../views/pages/";
const models = require('../models');

const Nominatim = require('nominatim-geocoder');
const geocoder = new Nominatim();


exports.init = function(req, res){
    const user = connected_user(req.sessionID);
    res.render(pages_path + "template.ejs", {
        pageTitle: "Création d'un Raid",
        page: "create_raid/start",
        user: user
    });
};
exports.displayDescriptionForm = function (req, res) {
    const user = connected_user(req.sessionID);
    res.render(pages_path + "template.ejs", {
        pageTitle: "Création d'un Raid",
        page: "create_raid/description",
        user: user
    });
};

exports.createRaid = function (req, res) {

    models.raid.create({
        name: req.body.raidName,
        edition: req.body.raidEdition,
        date: req.body.raidStartDate,
        place: req.body.raidPlace,
        lat: 0.0,
        lng: 0.0
    }).then(function (raid_created) {
        let user = connected_user(req.sessionID);
        user.idCurrentRaid = raid_created.dataValues.id;
        models.team.create({
            id_raid: user.idCurrentRaid,
            id_organizer: user.login
        });

        geocoder.search({q: req.body.raidPlace}) // allows to list all the locations corresponding to the city entered
            .then((response) => {
                if (response[0].lat !== undefined) {
                    raid_created.update({
                        place: response[0].display_name,
                        lat: response[0].lat,
                        lng: response[0].lon
                    }).then(() => {
                        res.redirect('/createraid/sports');
                    })
                } else {
                    if (req.body.selectedPlace !== "") {
                        let selectedParse = JSON.parse(req.body.selectedPlace);

                        raid_created.update({
                            lat: selectedParse.lat,
                            lng: selectedParse.lon
                        }).then(() => {
                            res.redirect('/createraid/sports');
                        })
                    }
                    res.redirect('/createraid/sports');
                }
            })
            .catch((error) => {
                console.log(error);
                res.redirect('/createraid/sports');
            });
    });

};

exports.displaySportsTable = function (req, res) {
    const sports = [];
    models.sport.findAll({
        order: ['name']
    }).then(function (sports_found) {
        sports_found.forEach(function (sport) {
            sports.push({name: sport.dataValues.name, id: sport.dataValues.id});
        });
        const user = connected_user(req.sessionID);
        res.render(pages_path + "template.ejs", {
            pageTitle: "Création d'un Raid",
            page: "create_raid/sports",
            sports: sports,
            user: user
        });
    });

};

exports.saveSportsRanking = function (req, res) {
    let user = connected_user(req.sessionID);
    const save_sports_actions = JSON.parse(req.body.sports_list).map(sport_row => {
        return new Promise(resolve => {
            console.log(sport_row);
            models.course.create({
                order_num: sport_row.order,
                label: sport_row.name,
                id_sport: sport_row.sport,
                id_raid: user.idCurrentRaid
            }).then(function () { return resolve(); });
        });
    });

    Promise.all(save_sports_actions).then(result => {
        models.raid.findOne({
            attributes: ['id', 'name', 'date', 'edition', 'place','lat','lng'],
            where: {id: user.idCurrentRaid}
        }).then(function(unique_raid_found){
            user.raid_list.push({
                id: user.idCurrentRaid,
                name: unique_raid_found.dataValues.name,
                date: unique_raid_found.dataValues.date,
                edition: unique_raid_found.dataValues.edition,
                place: unique_raid_found.dataValues.place,
                lat: unique_raid_found.dataValues.lat,
                lng: unique_raid_found.dataValues.lng
            });
            return res.redirect('/editraid/' + user.idCurrentRaid + '/map');
        });
    });
};

exports.getGeocodedResults = function (req, res) {
    let geocoded_results = [];

    geocoder.search({q: req.body.query})
        .then((response) => {
            response.forEach(function (place) {
                geocoded_results.push({
                    name: place.display_name,
                    lat: place.lat,
                    lon: place.lon
                });
            });
            res.send(JSON.stringify(geocoded_results));
        })
        .catch((error) => {
            console.log("Error: " + error);
        });

};

exports.displayAllRaids = function (req, res) {
    const user = connected_user(req.sessionID);
    if(user.raid_list.length !== 0) {
        res.render(pages_path + "template.ejs", {
            pageTitle: "Gestion des Raids",
            page: "edit_raid/all",
            user: user
        });
    }else{
        res.redirect('/dashboard');
    }
};

exports.displayRaid = function(req, res) {
    const user = connected_user(req.sessionID);
    const raid = user.raid_list.find(function(raid){return raid.id == req.params.id});
    if(!raid){
        return res.redirect('/dashboard');
    }

    /************************/
    /*    Organizer infos   */
    /************************/

    let team_model = models.team;
    let organizer_model = models.organizer;

    team_model.belongsTo(organizer_model, {foreignKey: 'id_organizer'});
    team_model.findAll({ // Get all organizers assigned to the current raid
        include: [{
            model: organizer_model,
            attributes: ['email','last_name','first_name']
        }],
        attributes: ['id_organizer'],
        where: {
            id_raid: req.params.id
        }
    }).then(function(organizers_found){

        let organizers_linked_with_the_current_raid = [];
        organizers_found.forEach(function(organizer){
            organizers_linked_with_the_current_raid.push({
                email: organizer.dataValues.organizer.dataValues.email,
                first_name: organizer.dataValues.organizer.dataValues.first_name,
                last_name: organizer.dataValues.organizer.dataValues.last_name
            });
        });

        /*********************/
        /*    Helper infos   */
        /*********************/

        let data_helper = [];

        let assignment_model = models.assignment;
        let helper_model = models.helper;
        let helper_post_model = models.helper_post;

        helper_model.belongsTo(assignment_model, {foreignKey: 'login'});
        assignment_model.belongsTo(helper_post_model, {foreignKey: 'id_helper_post'});

        helper_model.findAll({
            include: [{
                model: assignment_model,
                attributes: ['id_helper','id_helper_post','attributed'],
                include: [{
                    model: helper_post_model,
                    attributes: ['id','description']
                }],
            }],
            attributes: ['login','email','last_name','first_name']
        }).then(function(assignment_found){
            assignment_found.forEach(function(tuple){
                let create_user = 0;
                data_helper.forEach(function(object){
                    if(object['user'] == tuple.dataValues.login){
                        create_user = 1;
                    }
                });
                if(create_user == 0){
                    data_helper.push(
                        {
                            'user':tuple.dataValues.login,
                            'data':{
                                'email':tuple.dataValues.email,
                                'last_name':tuple.dataValues.last_name,
                                'first_name':tuple.dataValues.first_name,
                                'assignment':[]
                            }
                        }
                    );
                }
                data_helper.forEach(function(object){
                    if(object['user'] == tuple.dataValues.login){
                        object['data']['assignment'].push(
                            {
                                'id':tuple.dataValues.assignment.dataValues.helper_post.dataValues.id,
                                'description':tuple.dataValues.assignment.dataValues.helper_post.dataValues.description,
                                'attributed':tuple.dataValues.assignment.dataValues.attributed
                            }
                        );
                    }
                });
            });


            /*********************/
            /*    Course infos   */
            /*********************/

            let courses_linked_with_the_current_raid = [];

            let course_model = models.course;
            let sport_model = models.sport;

            sport_model.belongsTo(course_model, {foreignKey: 'id'});
            const Sequelize = require('sequelize');
            sport_model.findAll({
                attributes: ['name'],
                include: [{
                    model: course_model,
                    attributes: ['order_num'],
                    where: {
                        id_sport: Sequelize.col('sport.id'),
                        id_raid: req.params.id
                    }
                }]
            }).then(function(course_name_and_order_found){
                course_name_and_order_found.map(course => {
                    /*courses_linked_with_the_current_raid.push({
                        order: course.dataValues.course.order_num,
                        name: course.dataValues.name
                    });*/
                    courses_linked_with_the_current_raid[course.dataValues.course.order_num] = course.dataValues.name;
                });
                res.render(pages_path + "template.ejs", {
                    pageTitle: "Gestion d'un Raid",
                    page: "edit_raid/details",
                    user: user,
                    organizers: organizers_linked_with_the_current_raid, // [{email, first_name, last_name}]
                    helpers: data_helper, // [{email, first_name, last_name, posts_asked:[{helper_post_id, description}]}]
                    courses: courses_linked_with_the_current_raid,
                    raid: raid
                });
            });
        });

    });
};