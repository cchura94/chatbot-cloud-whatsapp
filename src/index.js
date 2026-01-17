const express = require("express");
require("dotenv").config();
const axios = require("axios");
// inicializar express
const app = express();

// Declarar variables
const PORT = 3000;

// Middlewares
app.use(express.json()); // recibir datos en formato JSON

app.get("/saludo", (req, res) => {
    console.log("Mi nombre es: "+req.query.nombre + ", saludos desde: "+req.query.pais);
    return res.json({mensaje: "Hola "+req.query.nombre})
});

app.post("/enviar-mensaje", async (req, res) => {
    try {
        const { numero, mensaje } = req.body;

        if(!numero || !mensaje){
            return res.status(400).json({
                success: false,
                error: "Debes enviar numero y mensaje"
            })
        }

        // procesar el mensaje
        const payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": numero,
            "type": "text",
            "text": {
                "preview_url": true,
                "body": mensaje
            }
        }
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+process.env.WHATSAPP_ACCESS_TOKEN
        }

        const respuesta = await axios.post("https://graph.facebook.com/v22.0/"+process.env.WHASTAPP_PHONE_NUMBER_ID+"/messages", payload, {headers});
        return res.json(respuesta.data);
        
    } catch (error) {
        console.log(error);
        
    }
});

// Levantar el servidor 
app.listen(PORT, () => {
    console.log("Servidor corriendo en el puerto: "+PORT)
})