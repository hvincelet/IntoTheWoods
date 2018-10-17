/**********************************/
/*       Instantiate the map      */
/**********************************/

let raster = new ol.layer.Tile({
    source: new ol.source.OSM()
});

let source = new ol.source.Vector();

let vector = new ol.layer.Vector({
    source: source,

    style: new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new ol.style.Stroke({
            color: '#6200ee',
            width: 2
        }),
        image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
                color: '#6200ee'
            })
        })
    })
});

let map = new ol.Map({
    target: 'map',
    layers: [raster, vector],
    view: new ol.View({
        center: ol.proj.fromLonLat([raid.lng, raid.lat]),
        zoom: 15
    })
});

loadPointsOfInterest();

/**********************************/
/*  Fn dedicated to PoI edition   */
/**********************************/

let modify = new ol.interaction.Modify({source: source});
map.addInteraction(modify);

var draw, snap; // global so we can remove them later

function addInteractions() {
    draw = new ol.interaction.Draw({
        source: source,
        type: "Point"
    });

    map.addInteraction(draw);
    snap = new ol.interaction.Snap({source: source});
    map.addInteraction(snap);
}

function addPointOfInterest() {
    addInteractions();
}

function stopAddingPointOfInterest(){
    delete draw;
    delete snap;
}

function getVectorCoordonates() {
    // Get the array of features
    let features = vector.getSource().getFeatures();

    // Go through this array and get coordinates of their geometry.
    features.forEach(function (feature) {
        console.log(feature.getId());
        console.log(ol.proj.toLonLat(feature.getGeometry().getCoordinates()));
    });
}

function storePointsOfInterest() {
    let pointOfInterestArrayToStore = [];

    let features = vector.getSource().getFeatures();

    features.forEach(function (feature) {
        pointOfInterestArrayToStore.push({
            id: feature.getId(),
            lng: ol.proj.toLonLat(feature.getGeometry().getCoordinates())[0],
            lat: ol.proj.toLonLat(feature.getGeometry().getCoordinates())[1]
        });
    });

    let data = {
        pointOfInterestArray: pointOfInterestArrayToStore
    };
    $.ajax({
        type: 'POST',
        url: '/editraid/map',
        data: data,
        success: function (response) {
        },
        error: function (response) {
        }
    });

}

function loadPointsOfInterest() {

    pointOfInterestArrayToLoad.forEach(function (pointOfInterest) {
        let geom = new ol.geom.Point(ol.proj.fromLonLat(pointOfInterest.lonlat));
        let feature = new ol.Feature({
                geometry: geom,
            }
        );
        feature.setId(pointOfInterest.id);
        source.addFeature(feature);
    });

}

//https://openlayers.org/en/latest/examples/select-features.html
//selectInteraction.getFeatures();

/****************Interactions**/



let selectSingleClick = new ol.interaction.Select();

let changeInteraction = function() {

    if (selectSingleClick !== null) {
        map.addInteraction(selectSingleClick);
        selectSingleClick.on('select', function(e) {
            // console.log('&nbsp;' +
            //     e.target.getFeatures().getLength() +
            //     ' selected features (last operation selected ' + e.selected.length +
            //     ' and deselected ' + e.deselected.length + ' features)') ;
            console.log(e.selected);
            //e.selected.values().id

        });
    }
};


changeInteraction();