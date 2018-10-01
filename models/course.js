/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('course', {
    id: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    order_num: {
      type: DataTypes.INTEGER(5).UNSIGNED,
      allowNull: false,
      unique: true
    },
    label: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    id_sport: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: false,
      references: {
        model: 'sport',
        key: 'id'
      },
      unique: true
    },
    id_track: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: true,
      unique: true
    }
  }, {
    tableName: 'course'
  });
};
