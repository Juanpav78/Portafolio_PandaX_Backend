import mongoose from "mongoose";
import bcrypt from "bcrypt";
const usuarioSchema = mongoose.Schema({
    nombre:{
        type:String,
        required:true,
        trim:true
    },
    password:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        trim:true,
        unique: true,
    },
    token:{
        type:String,
    },
    confirmado:{
        type: Boolean,
        default: false,
    },

},{
    timestamps:true,
}
);

// Mongoose 9 ya no pasa next() a los middleware async; basta con retornar
usuarioSchema.pre('save', async function(){
    if(!this.isModified("password")){
        return;
    }
    const salt = await bcrypt.genSalt(10); 
    this.password = await bcrypt.hash(this.password, salt);
});

usuarioSchema.methods.comprobarPassword = async function (passwordForm){
    return await bcrypt.compare(passwordForm, this.password);
}

const Usuario = mongoose.model("Usuario", usuarioSchema);
export default Usuario;