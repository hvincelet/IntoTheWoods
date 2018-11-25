let helperPostArrayToStore = [];

function loadHelperPost(helperPostArray) {
    helperPostArray.map(helperPost => {
        helperPostArrayToStore.push({
            id: helperPost.id,
            title: helperPost.title,
            id_point_of_interest: helperPost.id_point_of_interest,
            nb_helper: helperPost.nb_helper,
            is_new: false
        });
    });
}

function editHelperPost(featureId) {
    let title = $('#' + featureId + '_label').val();
    let nbHelper = $('#' + featureId + '_nbHelper').val();

    let helperPostFound = helperPostArrayToStore.find(function (helperPost) {
        return helperPost.id_point_of_interest === parseInt(featureId.replace("point_of_interest_", ""));
    });

    if (helperPostFound) {
        helperPostFound.title = title;
        helperPostFound.nb_helper = nbHelper;
    } else {
        helperPostArrayToStore.push({
            id_point_of_interest: parseInt(featureId.replace('point_of_interest_', '').replace('new_', '')),
            title: title,
            nb_helper: nbHelper,
            is_new: true
        });
    }
    overlay.setPosition(undefined);
}