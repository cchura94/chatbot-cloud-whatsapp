const express = require("express");
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
        const { numero, mensaje } = req.query;
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
            'Authorization': 'Bearer <ACCESS_TOKEN>'
        }

        const respuesta = await axios.post("https://graph.facebook.com/<API_VERSION>/<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/messages", payload, {headers});
        return respuesta.data;
        
    } catch (error) {
        
    }
});

// Levantar el servidor 
app.listen(PORT, () => {
    console.log("Servidor corriendo en el puerto: "+PORT)
})