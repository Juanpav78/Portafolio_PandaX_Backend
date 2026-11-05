import mongoose from "mongoose";

// Consecutivos que nunca se reutilizan (COT-0001, COT-0002…). Si se borra la cotización 7, la
// siguiente sigue siendo la 8: un número comercial repetido confundiría al cliente y al registro.
const contadorSchema = mongoose.Schema({
    _id: { type: String },      // nombre del consecutivo, p. ej. 'cotizacion'
    valor: { type: Number, default: 0 },
}, { versionKey: false });

const Contador = mongoose.model("Contador", contadorSchema);

// Incrementa y devuelve el siguiente número de forma atómica. La primera vez arranca desde el
// mayor número ya usado en `Model` (por si existían documentos antes del contador).
export const siguienteNumero = async (nombre, Model, campo = 'numero') => {
    if (!(await Contador.exists({ _id: nombre }))) {
        const ultimo = await Model.findOne({ [campo]: { $exists: true } }).sort({ [campo]: -1 }).select(campo).lean()
        // upsert con $setOnInsert: si dos peticiones llegan a la vez, sólo una lo inicializa
        await Contador.updateOne({ _id: nombre }, { $setOnInsert: { valor: ultimo?.[campo] ?? 0 } }, { upsert: true })
    }
    const { valor } = await Contador.findOneAndUpdate({ _id: nombre }, { $inc: { valor: 1 } }, { new: true })
    return valor
}

export default Contador;
