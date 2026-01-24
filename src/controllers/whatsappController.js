const axios = require("axios");
const whatsappService = require("../services/whatsappService")
const openAIService = require("./../services/openaiService")
const Contacto = require("./../models/Contacto");
const Mensaje = require("./../models/Mensaje");

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
 
const userContext = {};
let contacto ;
let sw = true;

async function recibirMensajesWebhook(req, res){
    try {
        console.log(req.body);
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        if(!value?.messages){
            return res.status(200).send("No Mensaje");
        }
        const message = value.messages[0];
        const numero = message.from;
        const nombre = value.contacts?.[0]?.profile?.name || 'usuario';

        console.log(nombre, numero, ": ", message);

        contacto = await Contacto.findOne({where: {numero: numero}});
        if(!contacto){
            contacto = await Contacto.create({
                numero: numero,
                nombre: nombre
            })
        }

        console.log("CONTACTO_ID: "+contacto.id);

                

        if(message.type === "text"){
            mensajeUsuario = message.text.body.trim();
        }

        if(message.type === "interactive"){
            if(message.interactive.type == "button_reply"){
                mensajeUsuario = message.interactive.button_reply.id;
            }
        }

        // Guardar Mensaje del Usuario (entrante)

        console.log(contacto.id)
        await Mensaje.create({
            ContactoId: contacto.id,
            mensaje: mensajeUsuario,
            tipo: message.type,
            direccion: 'entrante',
            source: 'user'
        });

        if(contacto.saldo>0 && sw){
            sw=false;
            console.log("SALDO PENDIENTE A PAGAR: ", contacto.saldo);
            await whatsappService.enviarMensajeWhatsapp(numero, {
                 "type": "text",
                 "body": "Recordarle que tiene un saldo pendiente a pagar de: USD "+ contacto.saldo       
             });

             await Mensaje.create({
                ContactoId: contacto.id,
                mensaje: "Recordarle que tiene un saldo pendiente a pagar de: USD "+ contacto.saldo,
                tipo: 'text',
                direccion: 'saliente',
                source: 'bot'
            });
    
             
        }


        if(!userContext[numero]){
            userContext[numero] = {menuActual: "main", lista_mensajes: []};
            await enviarMenuSimple(numero, "main");
            // await enviarMenuConBotones(numero, "main");

            return res.sendStatus(200);
        }

        const menuActual = userContext[numero].menuActual;
        const menu = menuData[menuActual];
        const opcion = menu.opciones[mensajeUsuario];

        if(!opcion){
            // atender con Inteligencia artificial (OpenAI)
            const {respuestaIA, lista_mensajes} = await openAIService.conectarConOpenAi(mensajeUsuario, userContext[numero].lista_mensajes)
            userContext[numero].lista_mensajes = lista_mensajes;
            await whatsappService.enviarMensajeWhatsapp(numero, {
                "type": "text",
                "body": respuestaIA       
            });

            await Mensaje.create({
                ContactoId: contacto.id,
                mensaje: respuestaIA,
                tipo: 'text',
                direccion: 'saliente',
                source: 'ia'
            });
            return res.sendStatus(200);
        }

       
        // respuesta
        if(opcion.respuesta){
            await whatsappService.enviarMensajeWhatsapp(numero, opcion.respuesta);

            await Mensaje.create({
                ContactoId: contacto.id,
                mensaje: JSON.stringify(opcion.respuesta),
                tipo: opcion.respuesta.type,
                direccion: 'saliente',
                source: 'bot'
            });

            return res.sendStatus(200);
        }

        // subMenú
        if(opcion.submenu){
            userContext[numero].menuActual = opcion.submenu;
            await enviarMenuSimple(numero, opcion.submenu)
            // await enviarMenuConBotones(numero, opcion.submenu);
        }



        return res.sendStatus(200);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
} 


async function enviarMenuSimple(numero, menuKey){
    const menu = menuData[menuKey];

    const opcionesTexto = Object.entries(menu.opciones)
            .map(([key, opt]) => `- 👉 *${key}*: ${opt.text}`)
            .join("\n");
    
    const texto = `${menu.mensaje}\n\n${opcionesTexto}\n\n> *Indícanos qué opción te interesa conocer!* `  

    await whatsappService.enviarMensajeWhatsapp(numero, {
        "type": "text",
        "body": texto    
    });

    await Mensaje.create({
        ContactoId: contacto.id,
        mensaje: texto,
        tipo: 'text',
        direccion: 'saliente',
        source: 'bot'
    });
}

async function enviarMenuConBotones(numero, menuKey){
    const menu = menuData[menuKey];

    const buttons = Object.entries(menu.opciones)
            .map(([key, opt]) => ({
                type: "reply",
                reply: {
                    id: key,
                    title: opt.text
                }
            }));
    
    await whatsappService.enviarMensajeWhatsapp(numero, {
        "type": "buttons",
        "body": menu.mensaje,
        buttons    
    });
}

/*
// para botones
const menuData = {
    main: {
        mensaje: "*🍽️ Restaurante Sabor* 😋\n\nElige una opción:",
        opciones: {
            A: {
                text: "📖 Ver menú",
                submenu: "menu"
            },
            B: {
                text: "🛵 Hacer pedido",
                submenu: "pedido"
            },
            C: {
                text: "💬 Atención",
                respuesta: {
                    type: "text",
                    body: "👨‍🍳 Un asesor te atenderá."
                }
            }
        }
    },

    menu: {
        mensaje: "*📖 Menú*\n\nSelecciona categoría:",
        opciones: {
            1: {
                text: "🍔 Hamburguesas",
                submenu: "hamburguesas"
            },
            2: {
                text: "🍕 Pizzas",
                submenu: "pizzas"
            },
            3: {
                text: "⬅️ Volver",
                submenu: "main"
            }
        }
    },

    hamburguesas: {
        mensaje: "*🍔 Hamburguesas*\n\nElige una:",
        opciones: {
            A: {
                text: "🍔 Clásica",
                respuesta: {
                    type: "text",
                    body: "🍔 Clásica\n💰 Bs 25"
                }
            },
            B: {
                text: "🍔 Doble",
                respuesta: {
                    type: "text",
                    body: "🍔 Doble\n💰 Bs 35"
                }
            },
            C: {
                text: "⬅️ Volver",
                submenu: "menu"
            }
        }
    },

    pizzas: {
        mensaje: "*🍕 Pizzas*\n\nSelecciona:",
        opciones: {
            A: {
                text: "🍕 Pepperoni",
                respuesta: {
                    type: "text",
                    body: "🍕 Pepperoni\n💰 Bs 60"
                }
            },
            B: {
                text: "🍕 Familiar",
                respuesta: {
                    type: "text",
                    body: "🍕 Familiar\n💰 Bs 80"
                }
            },
            C: {
                text: "⬅️ Volver",
                submenu: "menu"
            }
        }
    },

    pedido: {
        mensaje: "*🛵 Pedido*\n\n¿Cómo deseas tu pedido?",
        opciones: {
            A: {
                text: "🏠 Delivery",
                respuesta: {
                    type: "text",
                    body: "📍 Envíanos tu dirección."
                }
            },
            B: {
                text: "🏪 Recoger",
                respuesta: {
                    type: "text",
                    body: "🕒 Listo en 20 min."
                }
            },
            C: {
                text: "⬅️ Volver",
                submenu: "main"
            }
        }
    }
};
*/

/*
const menuData = {
    main: {
        mensaje: "*🍽️ Bienvenido a Restaurante Sabor Casero* 😋\n\nSelecciona una *opción* para continuar:",
        opciones: {
            A: {
                text: "📖 Ver Menú",
                submenu: "menu"
            },
            B: {
                text: "🛵 Hacer Pedido",
                submenu: "pedido"
            },
            C: {
                text: "⏰ Horarios y Ubicación",
                respuesta: {
                    type: "location",
                    latitude: "-16.5003",
                    longitude: "-68.1238",
                    name: "Restaurante Sabor Casero",
                    address: "Calle Principal #45"
                }
            },
            D: {
                text: "💬 Hablar con un Asesor",
                respuesta: {
                    type: "text",
                    body: "👨‍🍳 En breve un asistente tomará tu pedido."
                }
            }
        }
    },

    menu: {
        mensaje: "*📖 Nuestro Menú*\n\nElige una categoría:",
        opciones: {
            1: {
                text: "🍔 Hamburguesas",
                submenu: "hamburguesas"
            },
            2: {
                text: "🍕 Pizzas",
                submenu: "pizzas"
            },
            3: {
                text: "🥤 Bebidas",
                submenu: "bebidas"
            },
            4: {
                text: "⬅️ Volver",
                submenu: "main"
            }
        }
    },

    hamburguesas: {
        mensaje: "*🍔 Hamburguesas*\n\nDeliciosas y jugosas 😍",
        opciones: {
            A: {
                text: "🍔 Clásica",
                respuesta: {
                    type: "text",
                    body: "🍔 Clásica\n💰 Precio: Bs 25\n🧀 Carne, queso y verduras"
                }
            },
            B: {
                text: "🍔 Doble",
                respuesta: {
                    type: "text",
                    body: "🍔 Doble\n💰 Precio: Bs 35\n🥩 Doble carne y queso"
                }
            },
            C: {
                text: "⬅️ Volver",
                submenu: "menu"
            }
        }
    },

    pizzas: {
        mensaje: "*🍕 Pizzas*\n\nRecién horneadas 🔥",
        opciones: {
            A: {
                text: "🍕 Pepperoni",
                respuesta: {
                    type: "text",
                    body: "🍕 Pepperoni\n💰 Precio: Bs 60\n🧀 Queso mozzarella y pepperoni"
                }
            },
            B: {
                text: "🍕 Familiar",
                respuesta: {
                    type: "text",
                    body: "🍕 Familiar\n💰 Precio: Bs 80\n👨‍👩‍👧‍👦 Ideal para compartir"
                }
            },
            C: {
                text: "⬅️ Volver",
                submenu: "menu"
            }
        }
    },

    bebidas: {
        mensaje: "*🥤 Bebidas*\n\nRefresca tu día 🧊",
        opciones: {
            A: {
                text: "🥤 Gaseosa",
                respuesta: {
                    type: "text",
                    body: "🥤 Gaseosa 500ml\n💰 Precio: Bs 8"
                }
            },
            B: {
                text: "🧃 Jugo Natural",
                respuesta: {
                    type: "text",
                    body: "🧃 Jugo Natural\n💰 Precio: Bs 10"
                }
            },
            C: {
                text: "⬅️ Volver",
                submenu: "menu"
            }
        }
    },

    pedido: {
        mensaje: "*🛵 Realizar Pedido*\n\n¿Dónde deseas recibir tu pedido?",
        opciones: {
            A: {
                text: "🏠 Delivery",
                respuesta: {
                    type: "text",
                    body: "📍 Envíanos tu dirección y tu pedido."
                }
            },
            B: {
                text: "🏪 Para Recoger",
                respuesta: {
                    type: "text",
                    body: "🕒 Tu pedido estará listo en 20 minutos."
                }
            },
            C: {
                text: "⬅️ Volver",
                submenu: "main"
            }
        }
    }
};
*/



const menuData = {
    main: {
        mensaje: "*🏦 Bienvenido a Banco Crédito Seguro* 💰\n\nSelecciona una *opción* para continuar:",
        opciones: {
            A: {
                text: "💵 Préstamos Disponibles",
                submenu: "prestamos"
            },
            B: {
                text: "📍 Nuestras Sucursales",
                respuesta: {
                    "type": "location",
                    "latitude": "-16.5003",
                    "longitude": "-68.1238",
                    "name": "Centro La Paz Bolivia",
                    "address": "Av 6 de Agosto, Nro 123"
                }
            },
            C: {
                text: "📄 Requisitos Generales",
                respuesta: {
                    "type": "document",
                    "link": "https://www.gob.mx/cms/uploads/attachment/file/93387/Temarios.pdf",
                    "filename": "Temario curso desarrollo",
                    "caption": "Este es el Temario curso:\n\n*Curso desarrollo Chatbots para whwtasapp* \nsi quieres participar contáctanos"
                }
            },
            D: {
                text: "👩‍💼 Hablar con un Asesor",
                respuesta: {
                    "type": "text",
                    "body": "Hola desde VSCode"        
                }
            },
            E: {
                text: "👩‍💼 Consular deuda pendiente",
                respuesta: {
                    "type": "image",
                    "link": "https://libelula.bo/wp-content/uploads/2020/12/banco_bcp_qr.png",
                    "caption": "Puede realizar su pago por este medio QR:\n\n\nUna vez realizado el pago. enviar el comprobante"
                }
            }
        }
    },

    prestamos: {
        mensaje: "*💵 Tipos de Préstamos Disponibles*\n\nSelecciona el que te interesa:",
        opciones: {
            1: {
                text: "🏠 Préstamo Hipotecario",
                submenu: "hipotecario"
            },
            2: {
                text: "🚗 Préstamo Vehicular",
                submenu: "vehicular"
            },
            3: {
                text: "📱 Préstamo Personal",
                submenu: "personal"
            },
            4: {
                text: "⬅️ Volver al Menú Principal",
                submenu: "main"
            }
        }
    },

    hipotecario: {
        mensaje: "*🏠 Préstamo Hipotecario*\n\nFinancia la casa de tus sueños 💙",
        opciones: {
            A: {
                text: "📊 Ver Detalles",
                respuesta: {
                        "type": "text",
                        "body": "✔️ Hasta 20 años de plazo\n✔️ Tasas desde 6.5%\n✔️ Financiamiento hasta el 80%"       
                }
                
            },
            B: {
                text: "📷 Ver Ejemplo",
                respuesta: {
                    "type": "image",
                    "link": "https://blumbitvirtual.edtics.com/pluginfile.php/5590/course/overviewfiles/chatbot%20%2815%29.png",
                    "caption": "🏡 Tu nuevo hogar comienza aquí"
                }
                
            },
            C: {
                text: "⬅️ Volver",
                submenu: "prestamos"
            }
        }
    },

    vehicular: {
        mensaje: "*🚗 Préstamo Vehicular*\n\nEstrena auto hoy mismo 😎",
        opciones: {
            A: {
                text: "📊 Información",
                respuesta: {
                    "type": "text",
                    "body": "🚘 Autos nuevos y usados\n📆 Plazos hasta 5 años\n💸 Tasas preferenciales"        
                }
                
            },
            B: {
                text: "⬅️ Volver",
                submenu: "prestamos"
            }
        }
    },

    personal: {
        mensaje: "*📱 Préstamo Personal*\n\nDinero rápido para lo que necesites 💳",
        opciones: {
            A: {
                text: "💡 Beneficios",
                respuesta: {
                    "type": "text",
                    "body": "⚡ Aprobación rápida\n📄 Pocos requisitos\n💰 Montos flexibles"        
                }
                
            },
            B: {
                text: "📄 Solicitar Información",
                respuesta: {
                    "type": "text",
                    "body": "📩 Déjanos tu nombre y un asesor te contactará."        
                }
            },
            C: {
                text: "⬅️ Volver",
                submenu: "prestamos"
            }
        }
    }
};



module.exports = {
    enviarMensaje,
    recibirMensajesWebhook
}

