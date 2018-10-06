/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('helper', {
    login: {
      type: DataTypes.STRING(7),
      allowNull: false,
      primaryKey: true
    },
    last_name: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    first_name: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    check_in: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    backup: {
      type: DataTypes.INTEGER(1),
      allowNull: true
    }
  }, {
    tableName: 'helper'
  });
};
