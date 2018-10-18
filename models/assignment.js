/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('assignment', {
    id_helper: {
      type: DataTypes.STRING(7),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'helper',
        key: 'login'
      }
    },
    id_helper_post: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'helper_post',
        key: 'id'
      }
    },
    attributed: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    }
  }, {
    tableName: 'assignment'
  });
};
