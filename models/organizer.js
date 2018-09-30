'use strict';

module.exports = (sequelize, DataTypes) => {
  var Organizer = sequelize.define('Organizer', {
    username: DataTypes.STRING
  });

  Organizer.associate = function(models) {
    models.Organizer.hasMany(models.Task);
  };

  return Organizer;
};
