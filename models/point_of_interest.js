/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('point_of_interest', {
    id: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    id_track: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: false,
      references: {
        model: 'course',
        key: 'id'
      }
    },
    lat: {
      type: "DOUBLE",
      allowNull: true
    },
    lng: {
      type: "DOUBLE",
      allowNull: true
    }
  }, {
    tableName: 'point_of_interest'
  });
};
