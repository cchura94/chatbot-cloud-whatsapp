const express = require("express");
require("dotenv").config();
const router = require("./routes")

// inicializar express
const app = express();

// Declarar variables
const PORT = 3000;

// Middlewares
app.use(express.json()); // recibir datos en formato JSON

// habilitando rutas
app.use("/", router);

app.get("/saludo", (req, res) => {
    console.log("Mi nombre es: "+req.query.nombre + ", saludos desde: "+req.query.pais);
    return res.json({mensaje: "Hola "+req.query.nombre})
});

// Levantar el servidor 
app.listen(PORT, () => {
    console.log("Servidor corriendo en el puerto: "+PORT)
})