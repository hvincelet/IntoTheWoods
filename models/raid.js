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
    start_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    edition: {
      type: DataTypes.INTEGER(6),
      allowNull: true
    },
    place: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    lat: {
      type: "DOUBLE",
      allowNull: true
    },
    lng: {
      type: "DOUBLE",
      allowNull: true
    },
    hashtag: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    allow_register: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    startRegister: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endRegister: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'raid'
  });
};
