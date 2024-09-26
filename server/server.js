import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config'
import bcrypt from 'bcrypt';
import {nanoid} from 'nanoid';
import jwt from 'jsonwebtoken';


import User from './Schema/User.js';


const server = express();
let PORT = 3000;

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password


server.use(express.json());


mongoose.connect(process.env.DB_LOCATION, { autoIndex: true })
    .then(() => {
        console.log("Conexión a la base de datos exitosa");
    })
    .catch((err) => {
        console.error("Error de conexión a la base de datos:", err.message);
    });

const formatDatatoSend = (user) => {

    const access_token = jwt.sign({id: user._id},process.env.SECRET_ACCESS_KEY)

    return{

        access_token,
        profile_img : user.personal_info.profile_img,
        username : user.personal_info.username,
        fullname : user.personal_info.fullname

    }
}
const generateUsername = async (email) => {

    let username = email.split("@")[0]; 

    let isUsernameNotUnique = await User.exists({ "personal_info.username": username}).then((result)=> result)

    isUsernameNotUnique ? username += nanoid().substring(0,5) : "";

    return username

}

server.post("/signup",(req, res) => { 

    let {fullname,email, password} = req.body;


    //validando el data del frontend

    if(fullname.length < 3){

        return res.status(403).json({"error": "El nombre debe de contener 3 letras como minimo"})
    }

    if(!email || email.length === 0){

        return res.status(403).json({"error":"Ingresa el Email"})
    }

    if(!emailRegex.test(email)){

        return res.status(403).json({"error":"Email invalido"})
    }

    if (!passwordRegex.test(password)){

        return res.status(403).json({"error": "La contraseña debe tener entre 6 y 20 caracteres, incluyendo al menos un número, una mayúscula y una minúscula."})
    }

    bcrypt.hash(password,10, async (err, hashed_password) =>{

        let username =  await generateUsername(email);

        let user =  new User({

            personal_info: {fullname,email,password : hashed_password, username}
        })

        user.save().then((u) => {

            return res.status(200).json (formatDatatoSend(u))
        })

        .catch(err => {

            if(err.code == 11000){

                return res.status(500).json({"error": "El email ya esta registrado"})


            }

            return res.status(500).json({"error": err.message})
        })

        console.log(hashed_password)

    })


})

server.post("/signin",(req,res) =>{

    let {email,password} = req.body;

    User.findOne({ "personal_info.email": email })
    .then((user)=>{

        if(!user){

            return res.status(403).json({"error":"No se encontro el email"})
        }

        bcrypt.compare(password,user.personal_info.password, (err,result) =>{

            if(err){

                return res.status(403).json({"error": "Ocurrio un error mientras se iniciaba sesion, intentalo de nuevo"})
            }

            if(!result){

                return res.status(403).json({"error": "Contraseña incorrecta"})


            }else{

                return res.status(200).json(formatDatatoSend(user))


            }

        })

      
    })

    .catch (err => {

        console.log(err.message);
        return res.status(500).json({"error":err.message})
    })


})


server.listen(PORT,() => {

    console.log('listening on port ->' + PORT);
})
