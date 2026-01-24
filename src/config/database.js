const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('bd_chatbot_wha_node', 'postgres', 'postgresql', {
    host: 'localhost',
    port: 5433,
    dialect: 'postgres'
});


async function testConexion() {
    try {
        await sequelize.authenticate();
        console.log('CONEXION CORRECTA A BD!!!".');
      } catch (error) {
        console.error('ERROR DE CONEXION  BD', error);
      }
}

testConexion();

module.exports = sequelize;