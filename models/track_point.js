/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('track_point', {
    id_track: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: false,
      references: {
        model: 'course',
        key: 'id'
      }
    },
    lat: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    lng: {
      type: DataTypes.FLOAT,
      allowNull: true
    }
  }, {
    tableName: 'track_point'
  });
};
