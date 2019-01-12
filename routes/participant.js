const jdenticon = require('jdenticon');
const pages_path = "../views/pages/";
const models = require('../models');

const fs = require('fs');
const pdf = require('html-pdf');
var options = { format: 'A4', orientation: 'landscape' };
const QRCode = require('qrcode');

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
    //TODO : home for participant (supposition : contains live and others informations)
    models.participant.findOne({
      where: {
        id_participant: req.params.id
      }
    }).then(function(participant_found){
      if(participant_found !== null){
        models.raid.findOne({
          where: {
            id: participant_found.dataValues.id_raid
          }
        }).then(function(raid_found){
          if(raid_found !== null){
            res.render(pages_path + "runners" + "/runners_home.ejs", {
                pageTitle: "Accueil Participant",
                participant: participant_found,
                raid: raid_found
            });
          }
        })
      }
    });
};

exports.generateQRCode = function(req, res){
    //TODO : generate QR Code PDFs for all participant
    const raid = 1
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
                    console.log(res); // { filename: '/app/participants.pdf' }
                  });
                }
              });
            });
          }
        });
      }
    });
};
