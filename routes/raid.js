const pages_path = __dirname + "/../views/pages/";
const models = require('../models');

const Nominatim = require('nominatim-geocoder');
const geocoder = new Nominatim();
const ejs = require('ejs');
const fs = require('fs');
const raids = models.raid;

exports.init = function (req, res) {
    const user = connected_user(req.sessionID);
    res.render(pages_path + "template.ejs", {
        pageTitle: "Création d'un Raid",
        page: "create_raid/start",
        user: user
    });
};

exports.from_exist = function (req, res){
    raids.findAll({
        attributes: ['id', 'name', 'edition', 'date', 'place'],
        order: ['name', 'edition']
    }).then(function (raids_founds) {
        let raids = [];
        if(raids_founds !== null){
            raids_founds.map(raid => {
                raids.push({
                    id: raid.id,
                    name: raid.name,
                    edition: raid.edition,
                    date: raid.date,
                    place: raid.place
                });
            });
        }

        res.render(pages_path + "template.ejs", {
            pageTitle: "Sélection d'un raid existant",
            page: "create_raid/from_exist",
            user: connected_user(req.sessionID),
            raids: raids
        });
    });
};

exports.displayDescriptionForm = function (req, res) {
    const user = connected_user(req.sessionID);
    if(req.query.raid !== undefined){
        raids.findOne({
            where: {id: parseInt(req.query.raid)},
            attributes: ['id', 'name', 'place', 'edition']
        }).then(function (raid_found) {
            let raid = {};
            if(raid_found !== null){
                raid = {
                    id: raid_found.id,
                    name: raid_found.name,
                    place: raid_found.place,
                    edition: raid_found.edition
                };
            }

            res.render(pages_path + "template.ejs", {
                pageTitle: "Création d'un Raid",
                page: "create_raid/description",
                user: user,
                raid: raid
            });
        });
    }else{
        res.render(pages_path + "template.ejs", {
            pageTitle: "Création d'un Raid",
            page: "create_raid/description",
            user: user
        });
    }
};

exports.createRaid = function (req, res) {
    const raid_source = req.body.raid_source !== undefined ? "?raid_source="+req.body.raid_source : "";

    models.raid.create({
        name: req.body.raidName,
        edition: req.body.raidEdition,
        date: req.body.raidStartDate,
        place: req.body.raidPlace,
        lat: 0.0,
        lng: 0.0
    }).then(function (raid_created) {
        models.helper_post.create({
            title: "Backup",
            nb_helper: -1
        });
        let user = connected_user(req.sessionID);
        user.idCurrentRaid = raid_created.dataValues.id;
        models.team.create({
            id_raid: user.idCurrentRaid,
            id_organizer: user.login
        });

        geocoder.search({q: req.body.raidPlace}) // allows to list all the locations corresponding to the city entered
            .then((response) => {
                if (typeof response[0].lat !== undefined) {
                    raid_created.update({
                        place: response[0].display_name,
                        lat: response[0].lat,
                        lng: response[0].lon
                    }).then(() => {
                        res.redirect('/createraid/sports'+raid_source);
                    })
                } else {
                    if (req.body.selectedPlace !== "") {
                        let selectedParse = JSON.parse(req.body.selectedPlace);
                        raid_created.update({
                            lat: selectedParse.lat,
                            lng: selectedParse.lon
                        }).then(() => {
                            res.redirect('/createraid/sports'+raid_source);
                        })
                    } else {
                        res.redirect('/createraid/sports'+raid_source);
                    }
                }
            })
            .catch((error) => {
                console.log(error);
                res.redirect('/createraid/sports'+raid_source);
            });
    });

};

exports.displaySportsTable = function (req, res) {
    let user = connected_user(req.sessionID);
    if(req.query.idraid !== undefined){
        user.idCurrentRaid = req.query.idraid;
    }
    const sports = [];
    models.sport.findAll({
        order: ['name']
    }).then(function (sports_found) {
        sports_found.map(sport => {
            sports.push({name: sport.dataValues.name, id: sport.dataValues.id});
        });

        if(req.query.raid_source !== undefined){
            models.course.findAll({
                attributes: ['id_sport', 'label'],
                where: {id_raid: req.query.raid_source},
                order: ['order_num']
            }).then(function (sports_founds) {
                let selected_sports = [];
                if(sports_founds !== null){
                    sports_founds.map(sport => {
                        let find = sports.find(function (element) {
                            return element.id === sport.id_sport;
                        });
                        selected_sports.push({id: find.id, label: sport.label});
                    });
                }
                res.render(pages_path + "template.ejs", {
                    pageTitle: "Création d'un Raid",
                    page: "create_raid/sports",
                    sports: sports,
                    selected_sports: selected_sports,
                    raid_source: req.query.raid_source,
                    user: user
                });
            });
        }else{
            res.render(pages_path + "template.ejs", {
                pageTitle: "Création d'un Raid",
                page: "create_raid/sports",
                sports: sports,
                user: user
            });
        }
    });
};

exports.saveSportsRanking = function (req, res) {
    let user = connected_user(req.sessionID);
    const save_sports_actions = JSON.parse(req.body.sports_list).map(sport_row => {
        return new Promise(resolve => {
            models.course.create({
                order_num: sport_row.order,
                label: sport_row.name,
                id_sport: sport_row.sport,
                id_raid: user.idCurrentRaid
            }).then(function () {
                return resolve();
            });
        });
    });

    Promise.all(save_sports_actions).then(result => {
        models.raid.findByPk(user.idCurrentRaid).then(function (unique_raid_found) {
            let already_added = user.raid_list.some(function (element) {
                return element.id === user.idCurrentRaid
            });

            if(!already_added){
                user.raid_list.push({
                    id: user.idCurrentRaid,
                    name: unique_raid_found.dataValues.name,
                    date: unique_raid_found.dataValues.date,
                    start_time: null,
                    allow_register: 0,
                    edition: unique_raid_found.dataValues.edition,
                    place: unique_raid_found.dataValues.place,
                    lat: unique_raid_found.dataValues.lat,
                    lng: unique_raid_found.dataValues.lng
                });
            }

            if(req.body.raid_source !== undefined && req.body.copy_courses === "true"){
                const courses = models.course;
                const pois = models.point_of_interest;
                const track_point = models.track_point;
                const hp = models.helper_post;

                track_point.belongsTo(courses, {foreignKey: 'id_track'});
                hp.belongsTo(pois, {foreignKey: 'id_point_of_interest'});

                track_point.findAll({
                    include: [{
                        model: courses,
                        where: {id_raid: req.body.raid_source}
                    }],
                    order: ['id_track', 'id']
                }).then(function (source_track_points_found) {
                    if(source_track_points_found !== null){
                        courses.findAll({
                            where: {id_raid: user.idCurrentRaid}
                        }).then(function (new_courses_found) {
                            if(new_courses_found !== null){
                                let create_trackpoint_actions = source_track_points_found.map(trackpoint => {
                                    return new Promise(resolve => {
                                        let new_course_associated = new_courses_found.find(function (element) {
                                            return element.label === trackpoint.dataValues.course.label;
                                        });

                                        track_point.create({
                                            id_track: new_course_associated.id,
                                            lat: trackpoint.lat,
                                            lng: trackpoint.lng
                                        }).then(function () {
                                            new_course_associated.update({
                                                distance: trackpoint.dataValues.course.distance
                                            }).then(function () {
                                                return resolve();
                                            });
                                        });
                                    });
                                });

                                Promise.all(create_trackpoint_actions).then( result => {
                                    hp.findAll({
                                        include: [{
                                            model: pois,
                                            where: {id_raid: req.body.raid_source}
                                        }]
                                    }).then(function (hp_found) {
                                        if(hp_found !== null){
                                            let create_hp_and_pois_actions = hp_found.map(helper_post => {
                                                return new Promise(resolve => {
                                                    pois.create({
                                                        id_raid: user.idCurrentRaid,
                                                        lat: helper_post.dataValues.point_of_interest.lat,
                                                        lng: helper_post.dataValues.point_of_interest.lng
                                                    }).then(function (poi_created) {
                                                        hp.create({
                                                            id_point_of_interest: poi_created.id,
                                                            title: helper_post.title,
                                                            description: helper_post.description,
                                                            nb_helper: helper_post.nb_helper
                                                        }).then(function () {
                                                            return resolve();
                                                        })
                                                    });
                                                });
                                            });

                                            Promise.all(create_hp_and_pois_actions).then(result => {
                                                return res.redirect('/editraid/' + user.idCurrentRaid + '/map');
                                            });
                                        }
                                    });
                                });
                            }
                        });
                    }
                });
            }else{
                return res.redirect('/editraid/' + user.idCurrentRaid + '/map');
            }
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
    if (user.raid_list.length !== 0) {
        res.render(pages_path + "template.ejs", {
            pageTitle: "Gestion des Raids",
            page: "edit_raid/all",
            user: user
        });
    } else {
        res.redirect('/dashboard');
    }
};

exports.displayRaid = function (req, res) {
    const user = connected_user(req.sessionID);
    const raid = user.raid_list.find(function (raid) {
        return raid.id === parseInt(req.params.id);
    });
    if (!raid) {
        return res.redirect('/dashboard');
    }else {
        /***************************/
        /* DEBUG RAID NOT FINISHED */
        /***************************/
        models.course.findOne({
            where: {
                id_raid: req.params.id
            }
        }).then(function (course_found) {
            if (course_found === null) {
                return res.redirect('/createraid/sports?idraid=' + req.params.id);
            }
        });

        /************************/
        /*    Organizer infos   */
        /************************/

        let team_model = models.team;
        let organizer_model = models.organizer;

        team_model.belongsTo(organizer_model, {foreignKey: 'id_organizer'});
        team_model.findAll({
            include: [{
                model: organizer_model,
                attributes: ['email', 'last_name', 'first_name']
            }],
            attributes: ['id_organizer'],
            where: {
                id_raid: req.params.id
            }
        }).then(function (organizers_found) {

            let organizers_linked_with_the_current_raid = [];
            organizers_found.forEach(function (organizer) {
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
            let point_of_interest_model = models.point_of_interest;

            assignment_model.belongsTo(helper_model, {foreignKey: 'id_helper'});
            assignment_model.belongsTo(helper_post_model, {foreignKey: 'id_helper_post'});
            helper_post_model.belongsTo(point_of_interest_model, {foreignKey: 'id_point_of_interest'});

            assignment_model.findAll({
                include: [{
                    model: helper_post_model,
                    attributes: ['id', 'title'],
                    include: [{
                        model: point_of_interest_model,
                        where: {
                            id_raid: req.params.id
                        }
                    }]
                }],
                order: [['order_num', 'ASC']]
            }).then(function (assignment_found) {
                const unique_assignments_array = assignment_found.filter(function (assignment, index, array) {
                    return array.findIndex(function (value) {
                        return value.dataValues.id_helper === assignment.dataValues.id_helper;
                    }) === index;
                });

                const storeHelperActions = unique_assignments_array.map((assignment) => {
                    return new Promise((resolve, reject) => {
                        if (assignment.dataValues.helper_post === null) {
                            return resolve();
                        }
                        helper_model.findOne({
                            attributes: ['login', 'email', 'last_name', 'first_name'],
                            where: {
                                login: assignment.dataValues.id_helper
                            }
                        }).then(function (helper_found) {
                            const assignments_by_id_helper = assignment_found.filter(function (value) {
                                return value.dataValues.id_helper === helper_found.dataValues.login;
                            });
                            let helper = {
                                login: helper_found.dataValues.login,
                                email: helper_found.dataValues.email,
                                last_name: helper_found.dataValues.last_name,
                                first_name: helper_found.dataValues.first_name,
                                assignment: []
                            };
                            assignments_by_id_helper.forEach(function (assignment_by_id_helper) {
                                if (assignment_by_id_helper.dataValues.helper_post !== null) {
                                    helper.assignment.push({
                                        id: assignment_by_id_helper.dataValues.id_helper_post,
                                        description: assignment_by_id_helper.dataValues.helper_post.dataValues.title,
                                        attributed: assignment_by_id_helper.dataValues.attributed
                                    });
                                }
                            });
                            data_helper.push(helper);
                            return resolve();
                        });
                    });

                });

                Promise.all(storeHelperActions).then(result => {

                    /*********************/
                    /*    Course infos   */
                    /*********************/

                    let courses_linked_with_the_current_raid = [];

                    let course_model = models.course;
                    let sport_model = models.sport;

                    course_model.belongsTo(sport_model, {foreignKey: 'id_sport'});
                    course_model.findAll({
                        attributes: ['order_num'],
                        include: [{
                            model: sport_model,
                            attributes: ['name']
                        }],
                        where: {
                            id_raid: req.params.id
                        }
                    }).then(function (course_name_and_order_found) {
                        course_name_and_order_found.map(course => {
                            courses_linked_with_the_current_raid.push({
                                order: course.dataValues.order_num,
                                name: course.dataValues.sport.name
                            });
                        });

                        /*********************************/
                        /*    Points of interest infos   */
                        /*********************************/

                        let poi = [];

                        let poi_model = models.point_of_interest;
                        let helper_post_model = models.helper_post;
                        helper_post_model.belongsTo(poi_model, {foreignKey: "id_point_of_interest"});
                        helper_post_model.findAll({
                            attributes: ["id", "title", "nb_helper", "description"],
                            include: {
                                model: poi_model,
                                where: {
                                    id_raid: req.params.id
                                }
                            }
                        }).then(function (helper_posts) {
                            helper_posts.forEach(function (helper_post) {
                                poi.push({
                                    id: helper_post.dataValues.id,
                                    name: helper_post.dataValues.title,
                                    nb_helper: helper_post.dataValues.nb_helper,
                                    description: helper_post.dataValues.description
                                });
                            });

                            // Prepare render for JS file
                            let compile = ejs.compile(fs.readFileSync(pages_path + "contents/edit_raid/details.js", 'utf-8'));
                            let scripts_compiled = compile({raid: raid, user: user});

                            res.render(pages_path + "template.ejs", {
                                pageTitle: "Gestion d'un Raid",
                                page: "edit_raid/details",
                                user: user,
                                organizers: organizers_linked_with_the_current_raid,
                                helpers: data_helper,
                                courses: courses_linked_with_the_current_raid,
                                raid: raid,
                                scripts: scripts_compiled,
                                pois: poi
                            });
                        });
                    });
                });
            });

        });
    }
};

exports.savePoi = function (req, res) {
    let user = connected_user(req.sessionID);
    const raid = user.raid_list.find(function (raid) {
        return raid.id === parseInt(req.params.id);
    });
    if (!raid) {
        return res.redirect('/dashboard');
    }else {
        const save_poi_actions = req.body.pois.map(poi =>{
            return new Promise(resolve => {
                models.helper_post.findOne({
                    where: {
                        id: poi.id
                    }
                }).then(function (helper_post_found) {
                    if(helper_post_found !== null){
                        helper_post_found.update({
                            title: poi.name,
                            description: poi.description,
                            nb_helper: poi.number_helper
                        }).then(function () {
                            return resolve();
                        });
                    }
                });
            });
        });

        Promise.all(save_poi_actions).then(result => {
            res.send(JSON.stringify({msg: "ok"}));
        });
    }
};

exports.allowregister = function (req, res) {
    let user = connected_user(req.sessionID);
    const raid = user.raid_list.find(function (raid) {
        return raid.id === parseInt(req.params.id);
    });
    if (!raid) {
        return res.redirect('/dashboard');
    }else {
        models.raid.findOne({
            where: {
                id: raid.id
            }
        }).then(function (raid_found) {
            if(raid_found === null){
                return res.send(JSON.stringify({msg: "not-found"}));
            }else{
                raid_found.update({
                    allow_register: parseInt(req.body.status)
                }).then(function () {
                    raid.allow_register = parseInt(req.body.status);
                    return res.send(JSON.stringify({msg: "ok"}));
                });
            }
        });
    }
};

exports.starttime = function (req, res) {
    let user = connected_user(req.sessionID);
    const raid = user.raid_list.find(function (raid) {
        return raid.id === parseInt(req.params.id);
    });
    if (!raid) {
        return res.redirect('/dashboard');
    }else {
        models.raid.findOne({
            where: {
                id: raid.id
            }
        }).then(function (raid_found) {
            if(raid_found === null){
                return res.send(JSON.stringify({msg: "not-found"}));
            }else{
                raid_found.update({
                    start_time: req.body.start_time
                }).then(function () {
                    raid.start_time = req.body.start_time;
                    return res.send(JSON.stringify({msg: "ok"}));
                });
            }
        });
    }
};

exports.setStartTime = function(req, res){
    let idRaid = req.body.idRaid;

    models.raid.findOne({
        where: {
            id: idRaid
        }
    }).then(function (raid_found) {
        if (raid_found !== null) {
            let time = new Date();
            models.raid.update(
                {
                    start_time: time.toLocaleTimeString()
                },
                {where: {
                        id: idRaid
                    }
                });
        }
        else{
            console.log("erreur");
            //TODO : renvoyer un message d'erreur
        }
    });
};

exports.generateQRCode = function(req, res){
  // Generate QR Code PDFs for all participant
  const raid = req.params.id;
  models.raid.findOne({
    where: {
      id: raid
    },
    attributes: ['id','name','edition']
  }).then(function(raid_found){
    if(raid_found !== null){
      models.participant.findAll({
        where: {
          id_raid: raid
        },
        attributes: ['id_participant']
      }).then(function(participant_found){
        if(participant_found !== null){
          let cpt = 0;
          let html = '';
          participant_found.forEach(function(participant){
            QRCode.toDataURL(participant.id_participant.toString(), { errorCorrectionLevel: 'L', width:350 }, function (err, url) {
              if (err) return console.log(err);
              //console.log(url)
              html = html+"<html>"+
                         "<body>"+
                         "<center>"+
                           "<div style='height: 10px;'></div>"+
                           "<p style='font-size: 40pt;'><strong>"+participant.id_participant+"</strong><br>"+
                           "<img src='"+url+"'></img><br>"+
                           "<strong>"+raid_found.name.toUpperCase()+" "+raid_found.edition+"</strong></p>"+
                         "</center>"+
                         "</body>"+
                         "</html>";
              cpt=cpt+1;
              if(cpt==participant_found.length){
                pdf.create(html, options).toFile('./participants.pdf', function(err, res) {
                  if (err) return console.log(err);
                  //console.log(res); // { filename: '/app/participants.pdf' }
                });
              }
            });
          });
        }
      });
    }
  });
}
