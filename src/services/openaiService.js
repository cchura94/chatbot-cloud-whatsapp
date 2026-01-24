const axios = require("axios");
const Producto = require("./../models/Producto")

async function conectarConOpenAi(mensajeUsuario, lista_mensajes){

    const lista_productos = await Producto.findAll(); 

    const tokenOpenAI = process.env.OPENAI_APIKEY_TOKEN;

    if(lista_mensajes.length == 0){
        lista_mensajes = [ {
            role: "system",
            content: "Actúa como parte del equipo de ventas de nuestra empresa y atenderás consultas de mensajes de whatsapp, responde en menos de 30 palabras, solo debes responder sobre nuestros productos. esta es nuestra lista actual de nuestros productos: "+ JSON.stringify(lista_productos)
        }];
    }
    lista_mensajes.push({
        role: "assistant",
        content: "DATOS DE PRODUCTOS ACTUALIZADO HASTA HOY: "+JSON.stringify(lista_productos)
    },
    {
        role: "user",
        content: mensajeUsuario
    })

    const { data } = await axios.post("https://api.openai.com/v1/chat/completions", {
        "model": "gpt-5-nano",
        "messages": lista_mensajes
    }, {headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer "+ tokenOpenAI
    }});

    // console.log("********************: ", data)
    const respuestaIA = data.choices[0].message.content;

    lista_mensajes.push({role: "assistant", content:respuestaIA })

    return {respuestaIA, lista_mensajes};
}

module.exports = {
    conectarConOpenAi
}