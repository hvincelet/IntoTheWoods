/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('video', {
    id_raid: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: false,
      references: {
        model: 'raid',
        key: 'id'
      }
    },
    url: {
      type: DataTypes.STRING(128),
      allowNull: true
    }
  }, {
    tableName: 'video'
  });
};
