import { v2 as cloudinary } from 'cloudinary'
import { cloudinaryConfig } from "../config/env.js";

// express-fileupload entrega un objeto si llega un solo archivo con ese nombre y un array si
// llegan varios; se normaliza a array para tratar ambos casos igual.
export const comoLista = archivos => !archivos ? [] : Array.isArray(archivos) ? archivos : [archivos]

let configurado = false
const configurarCloudinary = () => {
    if (configurado) return
    cloudinary.config({ ...cloudinaryConfig(), secure: true });
    configurado = true
}

// Sólo se guardan los datos que usa la web. La respuesta completa de Cloudinary trae ~20 campos
// (etiquetas, firma, versión…) que inflarían cada documento y la respuesta de /proyectos.
export const subir = async archivo => {
    configurarCloudinary()
    const { secure_url, public_id, resource_type, width, height } =
        await cloudinary.uploader.upload(archivo.tempFilePath, { folder: 'images' })
    return { secure_url, public_id, resource_type, width, height }
}

// Borrar de Cloudinary nunca debe hacer fallar la petición: si una imagen ya no existe o la API
// falla, el proyecto se guarda igual y sólo queda un archivo huérfano que se registra en el log.
export const borrar = async imagen => {
    if (!imagen?.public_id) return
    configurarCloudinary()
    try {
        await cloudinary.uploader.destroy(imagen.public_id, { resource_type: imagen.resource_type ?? 'image' })
    } catch (error) {
        console.log('No se pudo borrar de Cloudinary', imagen.public_id, error.message)
    }
}
