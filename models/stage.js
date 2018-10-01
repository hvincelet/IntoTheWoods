/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('stage', {
    id_participant: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'participant',
        key: 'id'
      }
    },
    id_course: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'course',
        key: 'id'
      }
    },
    time: {
      type: DataTypes.TIME,
      allowNull: true
    }
  }, {
    tableName: 'stage'
  });
};
