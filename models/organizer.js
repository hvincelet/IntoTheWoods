/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('organizer', {
    email: {
      type: DataTypes.STRING(45),
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
    password: {
      type: "TINYBLOB",
      allowNull: true
    }
  }, {
    tableName: 'organizer'
  });
};
