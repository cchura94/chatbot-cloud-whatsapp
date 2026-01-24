const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const Contacto = sequelize.define(
  'Contacto',
  {
    // Model attributes are defined here
    numero: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING,
      // allowNull defaults to true
    },
    fechaInteraccion: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
    saldo: {
        type: DataTypes.DECIMAL(13, 2),
        defaultValue: 0
    }
  },
  {
    // Other model options go here
  },
);


Contacto.sync();

module.exports = Contacto;