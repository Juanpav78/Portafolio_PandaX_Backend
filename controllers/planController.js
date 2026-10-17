import Plan from "../models/Plan.js";

const CAMPOS_PLAN = ['nombre', 'descripcion', 'estado', 'prioridad', 'tecnologias', 'fechaInicio', 'fechaLimite']
const CAMPOS_TAREA = ['titulo', 'completada', 'fechaLimite']

// Copia sólo los campos permitidos del body. Evita que el cliente pueda reescribir
// `creador` (y robar o esconder planes) o reemplazar el array de tareas completo.
// Una fecha vacía ("") se guarda como null para poder borrarla desde el formulario.
const tomarCampos = (body, campos) => Object.fromEntries(
    campos
        .filter(campo => body[campo] !== undefined)
        .map(campo => [campo, campo.startsWith('fecha') && body[campo] === '' ? null : body[campo]])
)

// Todas las consultas filtran por creador: aunque hoy sólo hay un admin, así un usuario
// nunca puede leer ni tocar planes ajenos aunque adivine su id.
const buscarPlan = (id, usuario) => Plan.findOne({ _id: id, creador: usuario._id })

// Responde 404 tanto si el plan no existe como si el id no es un ObjectId válido (CastError):
// para quien llama ambos casos significan lo mismo, "ese plan no está".
const responderError = (res, error) => {
    if (error.name === 'ValidationError') {
        return res.status(400).json({ msg: Object.values(error.errors)[0].message })
    }
    if (error.name === 'CastError') {
        return res.status(404).json({ msg: 'Plan no encontrado' })
    }
    console.log(error)
    return res.status(500).json({ msg: 'Error en el servidor' })
}

const getPlanes = async (req, res) => {
    const planes = await Plan.find({ creador: req.usuario._id }).sort({ fechaLimite: 1, createdAt: -1 })
    res.json({ planes })
}

const createPlan = async (req, res) => {
    try {
        const plan = await Plan.create({ ...tomarCampos(req.body, CAMPOS_PLAN), creador: req.usuario._id })
        res.status(201).json(plan)
    } catch (error) {
        responderError(res, error)
    }
}

const updatePlan = async (req, res) => {
    try {
        const plan = await buscarPlan(req.params.id, req.usuario)
        if (!plan) return res.status(404).json({ msg: 'Plan no encontrado' })
        plan.set(tomarCampos(req.body, CAMPOS_PLAN))
        res.json(await plan.save())
    } catch (error) {
        responderError(res, error)
    }
}

const deletePlan = async (req, res) => {
    try {
        const plan = await buscarPlan(req.params.id, req.usuario)
        if (!plan) return res.status(404).json({ msg: 'Plan no encontrado' })
        await plan.deleteOne()
        res.json({ msg: 'Plan eliminado' })
    } catch (error) {
        responderError(res, error)
    }
}

// Las rutas de tareas devuelven el plan completo actualizado: el frontend reemplaza el plan
// entero en su estado y el progreso (tareas hechas / total) queda siempre consistente.
const addTarea = async (req, res) => {
    try {
        const plan = await buscarPlan(req.params.id, req.usuario)
        if (!plan) return res.status(404).json({ msg: 'Plan no encontrado' })
        plan.tareas.push(tomarCampos(req.body, CAMPOS_TAREA))
        res.status(201).json(await plan.save())
    } catch (error) {
        responderError(res, error)
    }
}

const updateTarea = async (req, res) => {
    try {
        const plan = await buscarPlan(req.params.id, req.usuario)
        const tarea = plan?.tareas.id(req.params.tareaId)
        if (!tarea) return res.status(404).json({ msg: 'Tarea no encontrada' })
        tarea.set(tomarCampos(req.body, CAMPOS_TAREA))
        res.json(await plan.save())
    } catch (error) {
        responderError(res, error)
    }
}

const deleteTarea = async (req, res) => {
    try {
        const plan = await buscarPlan(req.params.id, req.usuario)
        const tarea = plan?.tareas.id(req.params.tareaId)
        if (!tarea) return res.status(404).json({ msg: 'Tarea no encontrada' })
        tarea.deleteOne()
        res.json(await plan.save())
    } catch (error) {
        responderError(res, error)
    }
}

export {
    getPlanes,
    createPlan,
    updatePlan,
    deletePlan,
    addTarea,
    updateTarea,
    deleteTarea,
};
