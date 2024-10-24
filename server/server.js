import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import cors from "cors";
import admin from "firebase-admin";
import serviceAccountKey from "./blog-website-31e31-firebase-adminsdk-gqspy-1affbbba3b.json" assert { type: "json" };
import { getAuth } from "firebase-admin/auth";
import aws from "aws-sdk";

import User from "./Schema/User.js";
import Blog from "./Schema/Blog.js";

const server = express();
//pruebas
let PORT = 3000;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
});

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex para el correo
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex para la contraseña

// Middleware para procesar JSON
server.use(express.json());
server.use(cors());

// Conecta a la base de datos MongoDB utilizando la URL almacenada en las variables de entorno
mongoose.connect(process.env.DB_LOCATION, {
  autoIndex: true,
});

//
const s3 = new aws.S3({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY ,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

const generateUploadURL = async () => {

  const date = new Date();
  const imageName =  ` ${nanoid()}-${date.getTime()}.jpeg`;

  return await s3.getSignedUrlPromise('putObject',{

    Bucket : 'blog-denedig',//nombre del aws
    Key: imageName,
    Expires: 1000,
    ContentType: "image/jpeg"

  })
}

const verifyJWT = (req,res,next) =>{

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(" ")[1];

  if(token = null){

    return res.status(401).json({error: "No access token"})

  }

  jwt.verify(token,process.env.SECRET_ACCESS_KEY,(err,user) => {

    if(err){

      return res.status(403).json({error: "El token de acceso es invalido"})
    }

      req.user  = user.id
      next()
  })


}


// Función para formatear los datos del usuario para enviarlos en la respuesta
const formatDatatoSend = (user) => {
  const access_token = jwt.sign(
    { id: user._id },
    process.env.SECRET_ACCESS_KEY
  );

  return {
    access_token,
    profile_img: user.personal_info.profile_img,
    username: user.personal_info.username,
    fullname: user.personal_info.fullname,
  };
};

// Función para generar un nombre de usuario único basado en el email
const generateUsername = async (email) => {
  let username = email.split("@")[0];
  let isUsernameNotUnique = await User.exists({
    "personal_info.username": username,
  }).then((result) => result);
  isUsernameNotUnique ? (username += nanoid().substring(0, 5)) : "";
  return username;
};

server.get('/get-upload-url',(req,res)=> {

  generateUploadURL().then(url => res.status(200).json({uploadURL : url}))
  .catch(err =>{

    console.log(err.message);
    return res.status(500).json({error : err.message})
  })
})



// Endpoint para registrar un nuevo usuario
server.post("/signup", async (req, res) => {
  let { fullname, email, password } = req.body;

  // Validación de los datos
  if (fullname.length < 3) {
    return res
      .status(403)
      .json({ error: "Tu nombre debe ser más largo que 3 letras" });
  }
  if (!email.length) {
    return res.status(403).json({ error: "Ingresa un correo" });
  }
  if (!emailRegex.test(email)) {
    return res.status(403).json({ error: "Email inválido" });
  }
  if (!passwordRegex.test(password)) {
    return res
      .status(403)
      .json({
        error:
          "La contraseña debe tener de 6 a 20 caracteres, con 1 número, 1 minúscula y 1 mayúscula",
      });
  }

  // Verifica si el correo electrónico ya está registrado
  let existingUser = await User.findOne({ "personal_info.email": email });
  if (existingUser) {
    return res
      .status(403)
      .json({ error: "El correo ya está registrado, intenta iniciar sesión" });
  }

  // Hashear la contraseña
  bcrypt.hash(password, 10, async (err, hashed_password) => {
    if (err) {
      return res.status(500).json({ error: "Error al procesar la contraseña" });
    }

    let username = await generateUsername(email);

    let user = new User({
      personal_info: { fullname, email, password: hashed_password, username },
    });

    // Guardar el usuario en la base de datos
    user
      .save()
      .then((u) => {
        return res.status(200).json(formatDatatoSend(u));
      })
      .catch((err) => {
        return res.status(500).json({ error: err.message });
      });
  });
});

// Endpoint para iniciar sesión de un usuario
server.post("/signin", (req, res) => {
  let { email, password } = req.body; // Extrae los datos del cuerpo de la solicitud

  User.findOne({ "personal_info.email": email })
    .then((user) => {
      // Verifica si el usuario existe
      if (!user) {
        return res.status(403).json({ error: "Email no encontrado" });
      }

      if (!user.google_auth) {
        bcrypt.compare(password, user.personal_info.password, (err, result) => {
          if (err) {
            return res
              .status(403)
              .json({
                error: "Ha occurrido un error, por favor intente de nuevo",
              });
          }
          if (!result) {
            return res.status(403).json({ error: "Contraseña Incorrecta" });
          } else {
            return res.status(200).json(formatDatatoSend(user));
          }
        });
      }
      else {
        return res.status(403).json({"error": "Esta cuenta fue creada con Google, Intenta iniciar sesion con google"})
      }

      // Compara la contraseña proporcionada con la contraseña almacenada en la base de datos
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});

server.post("/google-auth", async (req, res) => {
  let { access_token } = req.body;
  getAuth()
    .verifyIdToken(access_token)
    .then(async (decodedUser) => {
      let { email, name, picture } = decodedUser;
      picture = picture.replace("s96-c", "s384-c");
      let user = await User.findOne({ "personal_info.email": email })
        .select(
          "personal_info.fullname personal_info.username personal_info.profile_img google_auth"
        )
        .then((u) => {
          return u || null;
        })
        .catch((err) => {
          return res.status(500).json({ error: err.message });
        });
      if (user) {
        //login
        if (!user.google_auth) {
          return res
            .status(403)
            .json({
              error:
                "Este correo no ha iniciado con Google. Porfavor ingresa tu correo y contraseña para Iniciar Sesion",
            });
        }
      } else {
        let username = await generateUsername(email);
        user = new User({
          personal_info: { fullname: name, email, username },
          google_auth: true,
        });
        await user
          .save()
          .then((u) => {
            user = u;
          })
          .catch((err) => {
            return res.status(500).json({ error: err.message });
          });
      }

      return res.status(200).json(formatDatatoSend(user));
    })
    .catch((err) => {
      return res
        .status(500)
        .json({
          error:
            "Se ha producido un error al autenticar con Google, intenta con otra",
        });
    });
});

server.post('/create-blog',verifyJWT ,(req, res) => {

  let authorId = req.suer;

  let {title, des, banner, tags, content, draft } = req.body;

  
  if(!title.length){

    return res.status(403).json({error : "Tienes que ingresar un titulo para publicar el blog"});

  }

  if(!draft){

    if(!des.length || des.length >200){

      return res.status(403).json({error : "El blog tiene que tener una descripcion de almenos 200 caracteres"});
    }
  
    if(!banner.length){
  
      return res.status(403).json({error: "El blog debe de contener un banner para poder publicarlo"});
    }
  
    if(content.blocks.length){
  
      return res.status(403).json({error : "Debe haber algún contenido de blog para publicarlo."});
    }
  
    if(!tags.length || tags.length > 10 ){
  
      return res.status(403).json({error : "Pon los tags en orden para publicar el blog, maximo 10"});
    }


  }


 

  tags = tags.map(tags => tags.toLowerCase());

  let blog_id = title.replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g,"-").trim() + nanoid ();

  let blog = new Blog ({

    title,des, banner, content, tags, author: authorId, blog_id , draft : Boolean(draft)



  })

  blog.save().then(blog =>{

    let incrementVal = draft ? 0 : 1;

    User.findOneAndUpdate({_id : authorId}, {$inc : {"account_info.total_posts" : incrementVal }, 
    $push : {"blogs" : blog._id} })

    .then(user => {

      return res.status(200).json({id : blog.blog_id})
    })

    .catch(err => {

      return res.status(500).json({error : err.message})
    })


  })



})

server.listen(PORT, () => {
  console.log("listening on port : " + PORT);
});
