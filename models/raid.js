/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('raid', {
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    place: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    edition: {
      type: DataTypes.INTEGER(6),
      allowNull: true
    }
  }, {
    tableName: 'raid'
  });
};