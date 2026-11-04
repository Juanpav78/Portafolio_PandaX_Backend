import mongoose from "mongoose";
import { mongoUri } from "./env.js";

const MAX_INTENTOS = 5

// Una vez conectado, el driver de MongoDB reconecta solo si se cae la red; estos eventos sólo
// dejan rastro en el log para saber cuándo pasó.
mongoose.connection.on('disconnected', () => console.log('MongoDB desconectado, reintentando…'))
mongoose.connection.on('reconnected', () => console.log('MongoDB reconectado'))
mongoose.connection.on('error', error => console.log(`MongoDB error: ${error.message}`))

// La primera conexión sí hay que reintentarla a mano: en Atlas es normal que falle un par de
// segundos (DNS, cluster despertando). Si tras varios intentos sigue fallando se termina el
// proceso para que Render lo reinicie en vez de dejar una API viva que no puede responder.
const conectarDB = async () => {
    const uri = mongoUri()
    if (!uri) {
        console.log('Falta MONGODB_URI en el .env')
        process.exit(1)
    }

    for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
        try {
            const { connection } = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
            console.log(`MongoDB conectado: ${connection.host} / ${connection.name}`)
            return connection
        } catch (error) {
            console.log(`MongoDB intento ${intento}/${MAX_INTENTOS} falló: ${error.message}`)
            if (intento === MAX_INTENTOS) process.exit(1)
            await new Promise(r => setTimeout(r, intento * 2000))
        }
    }
}

export default conectarDB;
