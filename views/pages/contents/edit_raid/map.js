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

/**********************************/
/*  Fn dedicated to PoI edition   */
/**********************************/

let modify = new ol.interaction.Modify({source: source});
map.addInteraction(modify);

let draw, snap; // global so we can remove them later

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

function getVectorCoordonates() {
    // Get the array of features
    let features = vector.getSource().getFeatures();

    // Go through this array and get coordinates of their geometry.
    features.forEach(function (feature) {
        console.log(ol.proj.toLonLat(feature.getGeometry().getCoordinates())); // /!\ retourne des projections != coord lonlat
    });
}

function addVectorCoordonates() {

    let pointsOfInterest = [[-3.4455227851867667, 48.818696208434886],
        [-3.4416174888610835, 48.81996777291283],
        [-3.437025547027587, 48.820363364171556]];

    pointsOfInterest.forEach(function (pointsOfInterestCoords) {
        let geom = new ol.geom.Point(ol.proj.fromLonLat(pointsOfInterestCoords));
        let feature = new ol.Feature({
                id: 'pointOfInterest',
                geometry: geom,
                popuptext: 'test'
            }
        );
        source.addFeature(feature);
    });

}

//https://openlayers.org/en/latest/examples/select-features.html
//selectInteraction.getFeatures();

