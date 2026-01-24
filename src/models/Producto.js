const sequelize = require("../config/database");
const { Sequelize, DataTypes } = require('sequelize');

const Producto = sequelize.define(
  'Producto',
  {
    // Model attributes are defined here
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    precio: {
      type: DataTypes.DECIMAL(12,2),
      // allowNull defaults to true
    },
    descripcion: {type: DataTypes.TEXT},
    cantidad: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    imagen: {
        type: DataTypes.STRING
    }
  },
  {
    // Other model options go here
  },
);


Producto.sync();

module.exports = Producto;