/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('participant', {
    id_participant: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    id_raid: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: false,
      references: {
        model: 'raid',
        key: 'id'
      }
    },
    last_name: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    first_name: {
      type: DataTypes.STRING(30),
      allowNull: true
    }
  }, {
    tableName: 'participant'
  });
};
