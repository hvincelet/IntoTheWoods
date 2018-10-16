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
      allowNull: false
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
      }
    },
    id_raid: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: false,
      references: {
        model: 'raid',
        key: 'id'
      }
    }
  }, {
    tableName: 'course'
  });
};
