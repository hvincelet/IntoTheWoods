/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('sport', {
    id: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    area_type: {
      type: DataTypes.STRING(45),
      allowNull: true
    }
  }, {
    tableName: 'sport'
  });
};
