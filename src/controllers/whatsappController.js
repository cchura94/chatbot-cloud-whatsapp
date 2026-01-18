const axios = require("axios");
const whatsappService = require("../services/whatsappService")

async function enviarMensaje(req, res){
    try {
        const { numero, mensaje } = req.body;

        if(!numero || !mensaje){
            return res.status(400).json({
                success: false,
                error: "Debes enviar numero y mensaje"
            })
        }

        const response = await whatsappService.enviarMensajeWhatsapp(numero, mensaje);
        
        return res.status(200).json({success: true, data: response});
    } catch (error) {
        res.status(500).json({success: false, error: error.message});
        
    }
}


module.exports = {
    enviarMensaje
}