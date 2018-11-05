/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('helper_post', {
    id: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    id_point_of_interest: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: false,
      references: {
        model: 'point_of_interest',
        key: 'id'
      }
    },
    description: {
      type: DataTypes.STRING(1024),
      allowNull: true
    },
    nb_helper: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: true,
      defaultValue: '1'
    }
  }, {
    tableName: 'helper_post'
  });
};
