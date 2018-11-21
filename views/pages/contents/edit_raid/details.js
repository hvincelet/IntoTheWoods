// JS for add Helpers table
var $ADD_HELPER_TABLE = $('#addHelperTable');
var $HIDDEN_ADD_HELPER_TABLE = $('#hidden-addHelperTable');

$('.table-addHelperTable').click(function () {
    var $clone = $HIDDEN_ADD_HELPER_TABLE.find('tr.hide').clone(true).removeClass('hide table-line');
    $ADD_HELPER_TABLE.append($clone);
});

$('.table-remove').click(function () {
    $(this).parents('tr').detach();
});

$('.cancel-addHelperTable').click(function () {
    $ADD_HELPER_TABLE.find('tr.duplicate').detach();
    var $clone = $HIDDEN_ADD_HELPER_TABLE.find('tr.hide').clone(true).removeClass('hide table-line');
    $ADD_HELPER_TABLE.append($clone);
});

// JS for confirm dialog
let $REMOVE_MODAL = $('#removeModal');
$REMOVE_MODAL.on('show.bs.modal', function (event) {
    let deleteButton = $(event.relatedTarget);
    let type = deleteButton.data('type');
    let userName = deleteButton.data('username');
    let userMail = deleteButton.data('usermail');
    let modal = $(this);
    modal.find('span.userName').text(userName);
    modal.find('span.userMail').text(userMail);
    modal.find('span.userType').text(type);
    if(type === "Helpers"){
        $("#confirmRemove-button").attr("onclick","removeHelper('"+deleteButton.data('login')+"', '"+userName+"')");
    }else{
        $("#confirmRemove-button").attr("onclick","removeOrganizer('"+userMail+"', '"+userName+"')");
    }

});

$('#confirmRemove-button').click(function () {
    let userMail = $('.modal-body').find('span.userMail').text();
    let userType = $('.modal-body').find('span.userType').text();
    // AJAX to delete user by this mail into type (Ex: delete user1@mail.com into organizer)
});

// JS for mail dialog
let $MAIL_MODAL = $('#mailModal');
$MAIL_MODAL.on('show.bs.modal', function (event) {
    let contactButton = $(event.relatedTarget);
    let mail = contactButton.data('mail');
    let subject = contactButton.data('type');
    let modal = $(this);
    modal.find('#recipient-name').val(mail);
    let subjectText = "[Into The Woods] ";
    if(subject === "Organizers"){
        subjectText += "Organisation "
    }else if(subject === "Helpers"){
        subjectText += "Bénévolat "
    }
    modal.find('#recipient-subject').val(subjectText + "<%=raid.name%> - Édition <%=raid.edition%>");
});

$('#sendMail-button').click(function () {
    let mail = $('#recipient-name').val();
    let subject = $('#recipient-subject').val();
    let message = $('#message-text').val();
    let $MESSAGE_MODAL = $('#messageModal');
    let $MESSAGE_MODAL_TITLE = $('#messageDialog');
    let $MESSAGE_MODAL_ICON = $('#messageIconDialog');
    let $MESSAGE_MODAL_CONTENT = $('#messageContentDialog');
    $('#mailModal').modal('hide');
    $.ajax({
        type: 'POST',
        url: '/editraid/<%= raid.id %>/sendMessage',
        data: {
            mails: mail.split(','),
            organizer: "<%= user.first_name%> <%= user.last_name %>",
            message: message,
            subject: subject,
            raid_name: "<%=raid.name%>"
        },
        success: function (response) {
            msg = JSON.parse(response).msg;
            if(msg === "ok"){
                $MESSAGE_MODAL_TITLE.html("Message envoyé");
                $MESSAGE_MODAL_ICON.html("<i class=\"far fa-check-circle\" style='color:greenyellow;font-size: 48px;'></i>");
                $MESSAGE_MODAL_CONTENT.html("Le message a bien été envoyé à <strong>" + mail + "</strong>.");
            }else{
                $MESSAGE_MODAL_TITLE.html("Message non envoyé...");
                $MESSAGE_MODAL_ICON.html("<i class=\"far fa-times-circle\" style='color:greenyellow;font-size: 48px;'></i>");
                $MESSAGE_MODAL_CONTENT.html("Le message n'a pas pu être envoyé à <strong>" + mail + "</strong>...");
            }
            $MESSAGE_MODAL.modal('show');
        },
        error: function (response) {
            let msg = JSON.parse(response).msg;
            $MESSAGE_MODAL_TITLE.html("Message non envoyé...");
            $MESSAGE_MODAL_ICON.html("<i class=\"far fa-times-circle\" style='color:greenyellow;font-size: 48px;'></i>");
            $MESSAGE_MODAL_CONTENT.html("Le message n'a pas pu être envoyé à <strong>" + mail + "</strong>...");
            $MESSAGE_MODAL.modal('show');
        }
    });
});

$('#save-helper-post').click(function () {
    let $MESSAGE_MODAL = $('#messageModal');
    let $MESSAGE_MODAL_TITLE = $('#messageDialog');
    let $MESSAGE_MODAL_ICON = $('#messageIconDialog');
    let $MESSAGE_MODAL_CONTENT = $('#messageContentDialog');

    $.ajax({
        type: 'POST',
        url: '/helper/assign',
        data: {
            assignments_array: assignment
        },
        success: function (response) {
            msg = JSON.parse(response).msg;
            if(msg === "ok"){
                $MESSAGE_MODAL_TITLE.html("Postes assignés");
                $MESSAGE_MODAL_ICON.html("<i class=\"far fa-check-circle\" style='color:greenyellow;font-size: 48px;'></i>");
                $MESSAGE_MODAL_CONTENT.html("Les postes ont bien été attribués aux helpers concernés.<br/><small>Afin de voir les changements, raffraichissez la page.</small>");
            }else{
                $MESSAGE_MODAL_TITLE.html("Postes non assignés...");
                $MESSAGE_MODAL_ICON.html("<i class=\"far fa-times-circle\" style='color:greenyellow;font-size: 48px;'></i>");
                $MESSAGE_MODAL_CONTENT.html("Les postes n'ont pas pu être assignés aux helpers...");
            }
            $MESSAGE_MODAL.modal('show');
        },
        error: function (response) {
            let msg = JSON.parse(response).msg;
            $MESSAGE_MODAL_TITLE.html("Postes non assignés...");
            $MESSAGE_MODAL_ICON.html("<i class=\"far fa-times-circle\" style='color:greenyellow;font-size: 48px;'></i>");
            $MESSAGE_MODAL_CONTENT.html("Les postes n'ont pas pu être assignés aux helpers...");
            $MESSAGE_MODAL.modal('show');
        }
    });
});

// JS for invite organizer and helpers
function validateEmail(email) {
    var expr = /^([\w-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
    return expr.test(email);
}

function inviteOrganizer() {
    let mail = $('#mail_organizer').val();
    let $MESSAGE_MODAL = $('#messageModal');
    let $MESSAGE_MODAL_TITLE = $('#messageDialog');
    let $MESSAGE_MODAL_ICON = $('#messageIconDialog');
    let $MESSAGE_MODAL_CONTENT = $('#messageContentDialog');
    if (validateEmail(mail)){
        let data = {
            mail: mail,
            raid: {
                name: "<%= raid.name%>",
                edition: "<%= raid.edition%>"
            }
        };
        $.ajax({
            type: 'POST',
            url: '/team/<%= raid.id %>/inviteorganizers',
            data: data,
            success: function (response) {
                let msg = JSON.parse(response).msg;
                if(msg === "ok"){
                    $('#mail_organizer').val("");
                    $MESSAGE_MODAL_TITLE.html("Organisateur invité·e !");
                    $MESSAGE_MODAL_ICON.html("<i class=\"far fa-check-circle\" style='color:greenyellow;font-size: 48px;'></i>");
                    $MESSAGE_MODAL_CONTENT.html("L'organisat·eur·rice a bien été invité·e.");
                    $MESSAGE_MODAL.modal('show');
                }else{
                    $MESSAGE_MODAL_TITLE.html("Erreur...");
                    $MESSAGE_MODAL_ICON.html("<i class=\"far fa-times-circle\" style='color:red;font-size: 48px;'></i>");
                    if(msg === "no-account"){
                        $MESSAGE_MODAL_CONTENT.html("Impossible d'inviter cet·te organisat·eur·rice car il n'a pas créé de compte organisat·eur·rice sur cette plateforme.");
                    }else if(msg === "not-added"){
                        $MESSAGE_MODAL_CONTENT.html("Impossible d'inviter cet·te organisat·eur·rice...<br/>Merci de réitérer votre invitation dans quelques minutes.");
                    }else if(msg === "mail-is-login"){
                        $MESSAGE_MODAL_CONTENT.html("Impossible de vous invitez vous même comme organisat·eur·rice...");
                    }else if(msg === "already-in-team"){
                        $MESSAGE_MODAL_CONTENT.html("Cet·te organisat·eur·rice est déjà dans l'équipe...");
                    }else{
                        $MESSAGE_MODAL_CONTENT.html("Impossible d'inviter cet·te organisat·eur·rice...");
                    }
                    $MESSAGE_MODAL.modal('show');
                }
            },
            error: function (response) {
                let msg = JSON.parse(response).msg;
                $MESSAGE_MODAL_TITLE.html("Erreur...");
                $MESSAGE_MODAL_ICON.html("<i class=\"far fa-times-circle\" style='color:red;font-size: 48px;'></i>");
                $MESSAGE_MODAL_CONTENT.html("Impossible d'inviter cet·te organizer...");
                $MESSAGE_MODAL.modal('show');
            }
        });
    }else{
        if(mail.length > 0){
            $MESSAGE_MODAL_TITLE.html("Erreur...");
            $MESSAGE_MODAL_ICON.html("<i class=\"far fa-times-circle\" style='color:red;font-size: 48px;'></i>");
            $MESSAGE_MODAL_CONTENT.html("Merci de saisir une adresse e-mail valide...");
            $MESSAGE_MODAL.modal('show');
        }
    }
}

function inviteHelpers(){
    let $MESSAGE_MODAL = $('#messageModal');
    let $MESSAGE_MODAL_TITLE = $('#messageDialog');
    let $MESSAGE_MODAL_ICON = $('#messageIconDialog');
    let $MESSAGE_MODAL_CONTENT = $('#messageContentDialog');
    let mails = [];

    $('#addHelperTable').find('tr').each(function () {
        let mail = $(this).find('td.helper_mail').text();
        if(validateEmail(mail)){
            mails.push(mail);
        }
    });

    $('#modal-helpers').modal('hide');
    $.ajax({
        type: 'POST',
        url: '/team/<%= raid.id %>/invitehelpers',
        data: {mails: mails, raid: {name: "<%=raid.name%>", edition: "<%=raid.edition%>", id: "<%=raid.id%>"}},
        success: function (response) {
            invited_status = JSON.parse(response).status;
            let helpers_not_invited = "";
            $MESSAGE_MODAL_TITLE.html("Bénévole·s invité·e·s");
            $MESSAGE_MODAL_ICON.html("<i class=\"far fa-check-circle\" style='color:greenyellow;font-size: 48px;'></i>");
            $MESSAGE_MODAL_CONTENT.html("Ces bénévole·s ont bien été invité·e·s :<ul>");
            invited_status.map( helper => {
                if(helper.status === "ok"){
                    $MESSAGE_MODAL_CONTENT.append("<li>" + helper.id + "</li>");
                }else{
                    helpers_not_invited += "<li>" + helper.id + "</li>";
                }
            });
            $MESSAGE_MODAL_CONTENT.append("</ul>");
            if(helpers_not_invited !== ""){
                $MESSAGE_MODAL_CONTENT.append("Ces bénévole·s n'ont pas pu être invité·e·s : <ul>" + helpers_not_invited + "</ul>");
            }
            $MESSAGE_MODAL.modal('show');
        },
        error: function (response) {
            let msg = JSON.parse(response).msg;
            $MESSAGE_MODAL_TITLE.html("Erreur...");
            $MESSAGE_MODAL_ICON.html("<i class=\"far fa-times-circle\" style='color:red;font-size: 48px;'></i>");
            $MESSAGE_MODAL_CONTENT.html("Impossible d'inviter les bénévole·s...");
            $MESSAGE_MODAL.modal('show');
        }
    });
}

function updatePOI(){
    let $MESSAGE_MODAL = $('#messageModal');
    let $MESSAGE_MODAL_TITLE = $('#messageDialog');
    let $MESSAGE_MODAL_ICON = $('#messageIconDialog');
    let $MESSAGE_MODAL_CONTENT = $('#messageContentDialog');
    let pois = [];

    $('#poi_table').find('tr').each(function () {
        let poi_id = $(this).find('td.poi_id').text();
        if(poi_id !== ""){
            let poi_name = $(this).find('td.poi_name').text();
            let poi_number_helper = parseInt($(this).find('input.poi_number_helper').val());
            let poi_description = $(this).find('td.poi_description').text();
            pois.push({id: poi_id, name: poi_name, number_helper: poi_number_helper, description: poi_description});
        }
    });

    $.ajax({
        type: 'POST',
        url: '/editraid/<%= raid.id %>/updatepoi',
        data: {pois: pois},
        success: function (response) {
            msg = JSON.parse(response).msg;
            if(msg === "ok"){
                $MESSAGE_MODAL_TITLE.html("Points d'intérêts sauvegardés !");
                $MESSAGE_MODAL_ICON.html("<i class=\"far fa-check-circle\" style='color:greenyellow;font-size: 48px;'></i>");
                $MESSAGE_MODAL_CONTENT.html("Les points d'intérêts ont bien été sauvegardés.");
                $MESSAGE_MODAL.modal('show');
            }else{
                $MESSAGE_MODAL_TITLE.html("Points d'intérêts non sauvegardés...");
                $MESSAGE_MODAL_ICON.html("<i class=\"far fa-times-circle\" style='color:red;font-size: 48px;'></i>");
                $MESSAGE_MODAL_CONTENT.html("Les points d'intérêts n'ont pas pu être sauvegardés...");
                $MESSAGE_MODAL.modal('show');
            }
        },
        error: function (response) {
            let msg = JSON.parse(response).msg;
            $MESSAGE_MODAL_TITLE.html("Erreur...");
            $MESSAGE_MODAL_ICON.html("<i class=\"far fa-times-circle\" style='color:red;font-size: 48px;'></i>");
            $MESSAGE_MODAL_CONTENT.html("Impossible d'enregistrer les points d'intérêts...");
            $MESSAGE_MODAL.modal('show');
        }
    });
}

function removeOrganizer(id, name){
    let $MESSAGE_MODAL = $('#messageModal');
    let $MESSAGE_MODAL_TITLE = $('#messageDialog');
    let $MESSAGE_MODAL_ICON = $('#messageIconDialog');
    let $MESSAGE_MODAL_CONTENT = $('#messageContentDialog');

    $('#removeModal').modal('hide');
    $.ajax({
        type: 'POST',
        url: '/editraid/<%= raid.id %>/removeOrganizer',
        data: {organizer_id: id},
        success: function (response) {
            msg = JSON.parse(response).msg;
            if(msg === "ok"){
                $MESSAGE_MODAL_TITLE.html("L'organisat·eur·rice a bien été supprimé·e");
                $MESSAGE_MODAL_ICON.html("<i class=\"far fa-check-circle\" style='color:greenyellow;font-size: 48px;'></i>");
                $MESSAGE_MODAL_CONTENT.html("L'organisat·eur·rice "+name+" a bien été supprimé·e de l'équipe organisatrice de ce raid.");
                $MESSAGE_MODAL.modal('show');
            }else{
                $MESSAGE_MODAL_TITLE.html("L'organisat·eur·rice n'a pas pu être supprimé·e");
                $MESSAGE_MODAL_ICON.html("<i class=\"far fa-times-circle\" style='color:red;font-size: 48px;'></i>");
                $MESSAGE_MODAL_CONTENT.html("L'organisat·eur·rice "+name+" n'a pas pu être supprimé·e de l'équipe organisatrice de ce raid.<br/>Merci de réessayer dans quelques instants.");
                $MESSAGE_MODAL.modal('show');
            }
        },
        error: function (response) {
            let msg = JSON.parse(response).msg;
            $MESSAGE_MODAL_TITLE.html("Erreur...");
            $MESSAGE_MODAL_ICON.html("<i class=\"far fa-times-circle\" style='color:red;font-size: 48px;'></i>");
            $MESSAGE_MODAL_CONTENT.html("L'organisat·eur·rice "+name+" n'a pas pu être supprimé·e de l'équipe organisatrice de ce raid...");
            $MESSAGE_MODAL.modal('show');
        }
    });
}

function removeHelper(id, name){
    let $MESSAGE_MODAL = $('#messageModal');
    let $MESSAGE_MODAL_TITLE = $('#messageDialog');
    let $MESSAGE_MODAL_ICON = $('#messageIconDialog');
    let $MESSAGE_MODAL_CONTENT = $('#messageContentDialog');

    $('#removeModal').modal('hide');
    $.ajax({
        type: 'POST',
        url: '/editraid/<%= raid.id %>/removeHelper',
        data: {helper_id: id},
        success: function (response) {
            msg = JSON.parse(response).msg;
            if(msg === "ok"){
                $MESSAGE_MODAL_TITLE.html("Le/la bénévole a bien été supprimé·e");
                $MESSAGE_MODAL_ICON.html("<i class=\"far fa-check-circle\" style='color:greenyellow;font-size: 48px;'></i>");
                $MESSAGE_MODAL_CONTENT.html("Le/la bénévole "+name+" a bien été supprimé·e de l'équipe des bénévoles de ce raid.");
                $MESSAGE_MODAL.modal('show');
            }else{
                $MESSAGE_MODAL_TITLE.html("Le/la bénévole n'a pas pu être supprimé·e");
                $MESSAGE_MODAL_ICON.html("<i class=\"far fa-times-circle\" style='color:red;font-size: 48px;'></i>");
                $MESSAGE_MODAL_CONTENT.html("Le/la bénévole "+name+" n'a pas pu être supprimé·e de l'équipe des bénévoles de ce raid.<br/>Merci de réessayer dans quelques instants.");
                $MESSAGE_MODAL.modal('show');
            }
        },
        error: function (response) {
            let msg = JSON.parse(response).msg;
            $MESSAGE_MODAL_TITLE.html("Erreur...");
            $MESSAGE_MODAL_ICON.html("<i class=\"far fa-times-circle\" style='color:red;font-size: 48px;'></i>");
            $MESSAGE_MODAL_CONTENT.html("Le/la bénévole "+name+" n'a pas pu être supprimé·e de l'équipe des bénévoles de ce raid...");
            $MESSAGE_MODAL.modal('show');
        }
    });
}