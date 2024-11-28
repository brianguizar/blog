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
import Notification from "./Schema/Notification.js";
import Comment from "./Schema/Comment.js";

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
  region: "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const generateUploadURL = async () => {
  const date = new Date();
  const imageName = ` ${nanoid()}-${date.getTime()}.jpeg`;

  return await s3.getSignedUrlPromise("putObject", {
    Bucket: "blog-denedig", //nombre del aws
    Key: imageName,
    Expires: 1000,
    ContentType: "image/jpeg",
  });
};

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res.status(401).json({ error: "No access token" });
  }

  jwt.verify(token, process.env.SECRET_ACCESS_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "El token de acceso es invalido" });
    }

    req.user = user.id;
    next();
  });
};

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

server.get("/get-upload-url", (req, res) => {
  generateUploadURL()
    .then((url) => res.status(200).json({ uploadURL: url }))
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});

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
    return res.status(403).json({
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
            return res.status(403).json({
              error: "Ha occurrido un error, por favor intente de nuevo",
            });
          }
          if (!result) {
            return res.status(403).json({ error: "Contraseña Incorrecta" });
          } else {
            return res.status(200).json(formatDatatoSend(user));
          }
        });
      } else {
        return res
          .status(403)
          .json({
            error:
              "Esta cuenta fue creada con Google, Intenta iniciar sesion con google",
          });
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
          return res.status(403).json({
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
      return res.status(500).json({
        error:
          "Se ha producido un error al autenticar con Google, intenta con otra",
      });
    });
});

server.post("/change-password", verifyJWT, (req, res) => {

  let { currentPassword, newPassword } = req.body;

  if(!passwordRegex.test(currentPassword) || !passwordRegex.test(newPassword)){
    return res.status(403).json({ error: "La contraseña debe tener de 6 a 20 caracteres, con 1 número, 1 minúscula y 1 mayúscula"})
  }

  User.findOne({ _id: req.user })
  .then((user) => {

    if(user.google_auth){
      return res.status(403).json({ error: "No puedes cambiar tu contraseña si tu cuenta esta logeada con Google"})
    }

    bcrypt.compare(currentPassword, user.personal_info.password, (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Algo salio mal, intenta de nuevo mas tarde"})
      }

      if(!result){
        return res.status(403).json({ error: "Tu contraseña actual esta incorrecta"})
      }

      bcrypt.hash(newPassword, 10, (err, hashed_password) => {

        User.findOneAndUpdate({ _id: req.user }, { "personal_info_password": hashed_password })
        .then((u) => {
          return res.status(200).json({ status: 'Contraseña Actualizada'})
        })
        .catch(err => {
          return res.status(500).json({ error: 'Algo salio mal, intenta de nuevo mas tarde'})
        })

      })
    })

  })
  .catch(err => {
    console.log(err);
    res.status(500).json({ error: "Usuario no encontrado"})
  })

})

server.post('/latest-blogs', (req, res) => {

  let { page } = req.body;

  let maxLimit = 5;

  Blog.find({ draft: false })
    .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({ "publishedAt": -1 })
    .select("blog_id title des banner activity tags publishedAt -_id")
    .skip((page - 1) * maxLimit)
    .limit(maxLimit)
    .then(blogs => {
      return res.status(200).json({ blogs })
    })
    .catch(err => {
      return res.status(500).json({ error: err.message })
    })
})

server.post("/all-latest-blogs-count", (req, res) => {

  Blog.countDocuments({ draft: false })
    .then(count => {
      return res.status(200).json({ totalDocs: count })
    })
    .catch(err => {

      console.log(err.message);
      return res.status(500).json({ error: err.message })


    })

})

server.get("/trending-blogs", (req, res) => {
  Blog.find({ draft: false })
    .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({ "activity.total_read": -1, "activity.total_likes": -1, "publishedAt": -1 })
    .select("blog_id title publishedAt -_id")
    .limit(5)
    .then(blogs => {
      return res.status(200).json({ blogs })
    })
    .catch(err => {
      return res.status(500).json({ error: err.message })
    })
})

server.post("/search-blogs", (req, res) => {

  let { tag, query, author, page, limit, eliminate_blog } = req.body;

  let findQuery;

  if (tag) {

    findQuery = { tags: tag, draft: false, blog_id: { $ne: eliminate_blog } };

  } else if (query) {

    findQuery = { draft: false, title: new RegExp(query, 'i') }

  } else if (author) {

    findQuery = { author, draft: false }

  }

  let maxLimit = limit ? limit : 2;

  Blog.find(findQuery)
    .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({ "publishedAt": -1 })
    .select("blog_id title des banner activity tags publishedAt -_id")
    .skip((page - 1) * maxLimit)
    .limit(maxLimit)
    .then(blogs => {
      return res.status(200).json({ blogs })
    })
    .catch(err => {
      return res.status(500).json({ error: err.message })
    })
})

server.post("/search-blogs-count", (req, res) => {

  let { tag, query, author } = req.body;

  let findQuery;

  if (tag) {

    findQuery = { tags: tag, draft: false };

  } else if (query) {

    findQuery = { draft: false, title: new RegExp(query, 'i') }

  } else if (author) {

    findQuery = { author, draft: false }

  }


  Blog.countDocuments(findQuery)
    .then(count => {

      return res.status(200).json({ totalDocs: count })
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json({ error: err.message })
    })
})

server.post("/search-users", (req, res) => {

  let { query } = req.body

  User.find({ "personal_info.username": new RegExp(query, 'i') })
    .limit(50)
    .select("personal_info.fullname personal_info.username personal_info.profile_img -_id")
    .then(users => {

      return res.status(200).json({ users })
    })
    .catch(err => {

      return res.status(500).json({ error: err.message })
    })
})

server.post("/get-profile", (req, res) => {

  let { username } = req.body;

  User.findOne({ "personal_info.username": username })
    .select("-personal_info.password -google_auth -updateAt -blogs")
    .then(user => {

      return res.status(200).json(user)
    })
    .catch(err => {
      console.log(err);
      return res.status(500).json({ error: err.message })
    })
})

server.post("/update-profile-img", verifyJWT , (req, res) => {

  let {url} = req.body;

  User.findOneAndUpdate({_id: req.user}, {"personl_info.profile_img": url})
  .then(() => {

    return res.status(200).json({profile_img: url})
  })
  .catch(err =>{
    return res.status(500).json({error : err.message})
  })
})

server.post("/update-profile",verifyJWT, (req, res) => {

  let {username, bio, social_links } = req.body;
  let bioLimit = 150;

  if(username.length < 3){

    return res.status(403).json({error : "El nombre de usuario debe tener al menos 3 caracteres de longitud"})
  }
  if(bio.length > bioLimit){

    return res.status(403).json ({error : `La biografia no debe sobrepasar los ${bioLimit} caracteres`})
  }

  let socialLinksArr = Object.keys(social_links); 

  try{

    for(let i = 0; i < socialLinksArr.length; i++){

      if(social_links[socialLinksArr[i]].length){

        let hostname = new URL(social_links[socialLinksArr[i]]).hostname;

        if(!hostname.includes(`${socialLinksArr[i]}.com`) && socialLinksArr[i] != 'website'){

          return res.status(403).json({error : `${socialLinksArr[i]} Link invalido`})
        }
      }
    }


  }catch(err){

    return res.status(500).json({error : "Tienes que agregar el link completo de tu red social" })
  }

  let updateObj = {

    "personal_info.username": username,
    "personal_info.bio": bio,
    social_links
  }

  User.findOneAndUpdate({_id : req.user}, updateObj,{
    runValidators : true

  })
  .then(() => {
    return res.status(200).json({username})
  })
  .catch(err =>{
    if(err.code = 11000){
      return res.status(409).json({error : "El nombre de usuario ya esta en uso"})
    }
    return res.status(500).json({error :err.message })
  })


})


server.post("/create-blog", verifyJWT, (req, res) => {
  let authorId = req.user;

  let { title, des, banner, tags, content, draft, id } = req.body;

  if (!title.length) {
    return res
      .status(403)
      .json({ error: "Tienes que ingresar un titulo para publicar el blog" });
  }

  if (!draft) {
    if (!des.length || des.length > 200) {
      return res
        .status(403)
        .json({
          error:
            "El blog tiene que tener una descripcion de maximo 200 caracteres",
        });
    }

    if (!banner.length) {
      return res
        .status(403)
        .json({
          error: "El blog debe de contener un banner para poder publicarlo",
        });
    }

    if (!content.blocks.length) {
      return res
        .status(403)
        .json({ error: "Debe haber algún contenido de blog para publicarlo." });
    }

    if (!tags.length || tags.length > 5) {
      return res
        .status(403)
        .json({
          error: "Pon los tags en orden para publicar el blog, maximo 5",
        });
    }
  }

  tags = tags.map((tags) => tags.toLowerCase());

  let blog_id =
    id ||
    title
      .replace(/[^a-zA-Z0-9]/g, " ")
      .replace(/\s+/g, "-")
      .trim() + nanoid();

  if (id) {

    Blog.findOneAndUpdate({ blog_id }, { title, des, banner, content, tags, draft: draft ? draft : false })
      .then(() => {
        return res.status(200).json({ id: blog_id })
      })
      .catch(err => {
        return res.status(500).json({ error: err.message })
      })

  } else {
    let blog = new Blog({
      title,
      des,
      banner,
      content,
      tags,
      author: authorId,
      blog_id,
      draft: Boolean(draft),
    });

    blog
      .save()
      .then((blog) => {
        let incrementVal = draft ? 0 : 1;

        User.findOneAndUpdate(
          { _id: authorId },
          {
            $inc: { "account_info.total_posts": incrementVal },
            $push: { blogs: blog._id },
          }
        )

          .then((user) => {
            return res.status(200).json({ id: blog.blog_id });
          })

          .catch((err) => {
            return res
              .status(500)
              .json({ error: "Fallo al actualizar el numero de posts" });
          });
      })

      .catch((err) => {
        return res.status(500).json({ error: err.message });
      });

  }

});

server.post("/get-blog", (req, res) => {

  let { blog_id, draft, mode } = req.body;

  let incrementVal = mode != 'edit' ? 1 : 0;

  // Se busca el blog y se incrementa 1 en leido "total_reads"
  Blog.findOneAndUpdate({ blog_id }, { $inc: { "activity.total_reads": incrementVal } })
    .populate("author", "personal_info.fullname personal_info.username personal_info.profile_img")
    .select("title des content banner activity publishedAt blog_id tags")
    .then(blog => {

      // Se actualiza los blogs leidos al autor del blog
      User.findOneAndUpdate({ "personal_info.username": blog.author.personal_info.username }, {
        $inc: { "account_info.total_reads": incrementVal }
      })
        .catch(err => {
          return res.status(500).json({ error: err.message })
        })

      if (blog.draft && !draft) {
        return res.status(500).json({ error: 'No puedes acceder al borrador del blog' })
      }

      return res.status(200).json({ blog })
    })
    .catch(err => {
      return res.status(500).json({ error: err.message })
    })

})

server.post("/like-blog", verifyJWT, (req, res) => {

  let user_id = req.user;

  let { _id, islikedByUser } = req.body;

  let incrementVal = !islikedByUser ? 1 : -1;

  Blog.findOneAndUpdate({ _id }, { $inc: { "activity.total_likes": incrementVal } })
    .then(blog => {

      if (!islikedByUser) {
        let like = new Notification({
          type: "like",
          blog: _id,
          notification_for: blog.author,
          user: user_id
        })

        like.save().then(notification => {
          return res.status(200).json({ liked_by_user: true })
        })

      } else{
        Notification.findOneAndDelete({ user: user_id, blog: _id, type: "like" })
        .then(data => {
          return res.status(200).json({ liked_by_user: false })
        })
        .catch(err => {
          return res.status(500).json({ error: err.message })
        })
        }
      }
    )
})

server.post("/isliked-by-user", verifyJWT, (req, res) => {
  
  let user_id = req.user;
  let { _id } = req.body;

  Notification.exists({ user: user_id, type: "like", blog: _id })
  .then(result => {
    return res.status(200).json({ result })
  })
  .catch(err => {
    return res.status(500).json({ error: err.message })
  })
})

server.post("/add-comment", verifyJWT, (req, res) => {

  let user_id = req.user;
  let { _id, comment, blog_author, replying_to, notification_id} = req.body;

  if(!comment.length){
    return res.status(403).json({ error: 'Debes escribir algo antes de comentar'});
  }

  let commentObj = {
    blog_id: _id, blog_author, comment, commented_by: user_id,
  }

  if(replying_to){
    commentObj.parent = replying_to;
    commentObj.isReply = true;
  }

  new Comment(commentObj).save().then(async commentFile => {

    let { comment, commentedAt, children } = commentFile;

    Blog.findOneAndUpdate({ _id }, {$push: { "comments": commentFile._id }, $inc : { "activity.total_comments": 1,  "activity.total_parent_comments": replying_to ? 0 : 1} })
    .then(blog => {
      console.log("Nuevo comentario creado")
    });

    let notificationObj ={
      type: replying_to ? "reply" : "comment",
      blog: _id,
      notification_for: blog_author, 
      user: user_id,
      comment: commentFile._id
    }

    if(replying_to){

      notificationObj.replied_on_comment = replying_to;

      await Comment.findOneAndUpdate({ _id: replying_to }, { $push: { children: commentFile._id } })
      .then(replyingToCommentDoc => { notificationObj.notification_for = replyingToCommentDoc.commented_by})

      if(notification_id){

        Notification.findOneAndUpdate({_id : notification_id}, {reply : commentFile._id})
        .then(notification => console.log('notification updated'))


      }
      
    }

    new Notification(notificationObj).save().then(notification => console.log("nueva notificacion agregada"));

    return res.status(200).json({
      comment, commentedAt, _id: commentFile._id, user_id, children
    })
  })
})

server.post("/get-blog-comments", (req, res) => {

  let { blog_id, skip } = req.body;

  let maxLimit = 5;

  Comment.find({ blog_id, isReply: false })
  .populate("commented_by", "personal_info.username personal_info.fullname personal_info.profile_img")
  .skip(skip)
  .limit(maxLimit)
  .sort({
    'commentedAt': -1
  })
  .then(comment => {
    return res.status(200).json(comment);
  })
  .catch(err => {
    console.log(err.message);
    return res.status(500).json({ error: err.message })
  })

})

server.post("/get-replies", (req, res) => {
  let { _id, skip } = req.body;

  let maxLimit = 5;

  Comment.findOne({ _id })
  .populate({
    path: "children",
    options: {
      limit: maxLimit,
      skip: skip,
      sort: { 'commentedAt': -1}
    },
    populate: {
      path: 'commented_by',
      select: "personal_info.profile_img personal_info.fullname personal_info.username"
    },
    select: "-blog_id -updatedAt"
  })
  .select("children")
  .then(doc => {
    return res.status(200).json({ replies: doc.children })
  })
  .catch(err => {
    return res.status(500).json({ error: err.message})
  })

})

const deleteComments = ( _id ) => {
  Comment.findOneAndDelete({ _id })
  .then(comment => {
    if(comment.parent){
      Comment.findOneAndUpdate({ _id: comment.parent}, { $pull: { children: _id } })
      .then(data => console.log('commentario eliminado del padre'))
      .catch(err => console.log(err));
    }

    Notification.findOneAndDelete({ comment: _id})
    .then(notification => console.log('notificacion del comentario eliminada'))

    Notification.findOneAndUpdate( { reply: _id},{$unset : {reply: 1}})
    .then(notification => console.log('notificacion de la respuesta eliminada'))

    Blog.findOneAndUpdate({ _id: comment.blog_id }, { $pull: { comments: _id }, $inc: { "activity.total_comments": -1 }, "activity.total_parent_comment": comment.parent ? 0 : -1})
    .then(blog => {
      if(comment.children.length){
        comment.children.map(replies => {
          deleteComments(replies)
        })
      }
    })

  })
  .catch(err => {
    console.log(err.message);
  })

}

server.post("/delete-comment", verifyJWT ,(req, res) => {

  let user_id = req.user;

  let { _id } = req.body;

  Comment.findOne({ _id })
  .then(comment => {

    if(user_id == comment.commented_by || user_id == comment.blog_author){

      deleteComments(_id)

      return res.status(200).json({ status: 'done'})

    }
    else{
      return res.status(403).json({ error: "No puedes eliminar el comntario"})
    }

  })

})

server.get("/new-notification", verifyJWT, (req, res) =>{

  let user_id= req.user;

  Notification.exists({notification_for: user_id, seen: false, user: {$ne: user_id}})
  .then(result =>{

    if(result){
      return res.status(200).json({new_notification_avaliable: true})
    }else{
      return res.status(200).json({new_notification_avaliable: false})
    }
  })
  .catch(err => {

    console.log(err.message);
    return res.status(500).json({error : err.message})
  })
})

server.post("/notifications", verifyJWT, (req, res) => {

  let user_id = req.user;

  let {page, filter, deletedDocCount} = req.body;

  let maxLimit = 10;

  let findQuery = {notification_for: user_id,user:{$ne: user_id} };

  let skipDocs = (page - 1) * maxLimit;


  if ( filter != 'all'){
    findQuery.type = filter;

  }

  if(deletedDocCount){
    skipDocs -= deletedDocCount;
  }

  Notification.find(findQuery)
  .skip(skipDocs)
  .limit(maxLimit)
  .populate("blog", "title blog_id")
  .populate("user", "personal_info.fullname personal_info.username personal_info.profile_img")
  .populate("comment", "comment")
  .populate("replied_on_comment", "comment")
  .populate("reply", "comment")
  .sort({createdAt: -1})
  .select("createAt type seen reply")
  .then(notifications => {

    Notification.updateMany(findQuery, {seen : true})
    .skip(skipDocs)
    .limit(maxLimit)
    .then(() => console.log('notification seen') )

    return res.status(200).json({notifications});
  })
  .catch(err => {

    console.log(err.message);
    return res.status(500).json({error: err.message});
  })


})

server.post("/all-notifications-count", verifyJWT, (req, res)=>{

  let user_id = req.user;

  let {filter} = req.body;

  let findQuery = {notification_for : user_id, user : {$ne:user_id}}

  if(filter != 'all'){
    findQuery.type = filter;
  }

  Notification.countDocuments(findQuery)

  .then(count => {

    return res.status(200).json({totalDocs:count})
  })
  .catch(err => {

    return res.status(500).json({error: err.message});
  })
})

server.listen(PORT, () => {
  console.log("listening on port : " + PORT);
});
