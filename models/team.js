/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('team', {
    id_raid: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'raid',
        key: 'id'
      }
    },
    id_organizer: {
      type: DataTypes.STRING(45),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'organizer',
        key: 'email'
      }
    }
  }, {
    tableName: 'team'
  });
};
