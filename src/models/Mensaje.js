const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');
const Contacto = require("./Contacto");

const Mensaje = sequelize.define(
  'Mensaje',
  {
    // Model attributes are defined here
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.STRING, // text, image
      // allowNull defaults to true
    },
    direccion: {type: DataTypes.ENUM('entrante', 'saliente')},
    source: {
        type: DataTypes.ENUM('user', 'bot', 'ia', 'manual')
    },
    // ContactoId: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
    
  },
  {
    // Other model options go here
  },
);

Contacto.hasMany(Mensaje); // 1:N
Mensaje.belongsTo(Contacto); // N:1

Mensaje.sync();

module.exports = Mensaje;