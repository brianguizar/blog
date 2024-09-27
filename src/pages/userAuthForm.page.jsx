import { useContext, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import InputBox from "../components/input.component";
import googleIcon from "../imgs/google.png";
import AnimationWrapper from "../common/page-animation";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";
import { storeInSession } from "../common/session";
import { UserContext } from "../App";

const UserAuthForm = ({ type }) => {
  const authForm = useRef();

  let {
    userAuth: { access_token },
    setUserAuth,
  } = useContext(UserContext);

  // Función para manejar la autenticación del usuario a través del servidor
  const userAuthThroughServer = (serverRoute, formData) => {
    // Llamada a axios para hacer una solicitud POST al servidor
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + serverRoute, formData) // Envío de la URL del servidor concatenada con la ruta específica
      .then(({ data }) => {
        // Si la solicitud es exitosa, se ejecuta el bloque 'then'
        // Almacena los datos de autenticación del usuario en la sesión del navegador
        storeInSession("user", JSON.stringify(data)); // Convierte los datos recibidos a un string JSON y los guarda en la sesión
        // Actualiza el estado global de autenticación del usuario
        setUserAuth(data); // Actualiza el estado de 'userAuth' con los datos recibidos del servidor
      })
      .catch(({ response }) => {
        // Si hay un error en la solicitud, se ejecuta el bloque 'catch'
        // Muestra un mensaje de error al usuario utilizando la librería 'toast'
        toast.error(response.data.error); // Extrae el mensaje de error de la respuesta del servidor y lo muestra en pantalla
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let serverRoute = type == "sign-in" ? "/signin" : "/signup";

    let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex para el correo
    let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex para la contraseña

    let form = new FormData(formElement);
    let formData = {};

    for (let [key, value] of form.entries()) {
      formData[key] = value;
    }

    let { fullname, email, password } = formData;
    // Validación de los datos
    if (fullname) {
      if (fullname.length < 3) {
        return toast.error("Tu nombre debe ser más largo que 3 letras");
      }
    }

    if (!email.length) {
      return toast.error("Ingresa un correo");
    }
    if (!emailRegex.test(email)) {
      return toast.error("Email inválido");
    }
    if (!passwordRegex.test(password)) {
      return toast.error(
        "La contraseña debe tener de 6 a 20 caracteres, con 1 número, 1 minúscula y 1 mayúscula"
      );
    }

    userAuthThroughServer(serverRoute, formData);
  };
  return access_token ? (
    <Navigate to="/" /> //Si hay una sesion activa se redirecciona a la raiz del proyecto
  ) : (
    //En caso de que no haya una sesion activa, se muestra el formulario
    <AnimationWrapper keyValue={type}>
      <section className="h-cover flex items-center justify-center">
        <Toaster />
        <form id="formElement" className="w-[80%] max-w-[400px]">
          {/*Validacion del tipo de formulario*/}
          <h1 className="text-4xl font-gelasio capitalize text-center mb-8">
            {type == "sign-in" ? "Iniciar Sesion" : "Registrate"}
          </h1>

          {
            //Se añade una validacion para cque en caso de que sea Registro se añada el input del nombre
            type != "sign-in" ? (
              <InputBox
                name="fullname"
                type="text"
                placeholder="Ingresa tu nombre"
                // Solo se toma la parte de los asteriscos <i class="fi **********"></i>
                icon="fi-rr-user"
              />
            ) : (
              ""
            )
          }

          <InputBox
            name="email"
            type="email"
            placeholder="Ingresa tu correo"
            icon="fi-rr-envelope"
          />

          <InputBox
            name="password"
            type="password"
            placeholder="Ingresa tu contraseña"
            icon="fi-rr-key"
          />

          {
            //Seria mas facil en ingles pero bueno
            type == "sign-in" ? (
              <button
                className="btn-dark center mt-14"
                type="submit"
                onClick={handleSubmit}
              >
                {type.replace("sign-in", "Iniciar sesion")}
              </button>
            ) : (
              <button
                className="btn-dark center mt-14"
                type="submit"
                onClick={handleSubmit}
              >
                {type.replace("sign-up", "Registrarme")}
              </button>
            )
          }

          {/*Validacion en Ingles
                        <button 
                            className="btn-dark center mt-14"
                        >
                            { type.replace("-", " ") }
                        </button>
                    */}

          <div className="relative w-full flex items-center gap-2 my-10 opacity-0 uppercase text-black font-bold">
            <hr className="w-1/2 border-black" />
            <p>or</p>
            <hr className="w-1/2 border-black" />
          </div>

          <button className="btn-dark flex items-center justify-center gap-4 w-[90%] center">
            <img src={googleIcon} className="w-5" />
            Continuar con Google
          </button>

          {type == "sign-in" ? (
            <p className="mt-6 text-dark-grey text-xl text-center">
              ¿Aun no tienes una cuenta?
              <Link to="/signup" className="underline text-black text-xl ml-1">
                Crea una cuenta aqui
              </Link>
            </p>
          ) : (
            <p className="mt-6 text-dark-grey text-xl text-center">
              ¿Ya tienes una cuenta?
              <Link to="/signin" className="underline text-black text-xl ml-1">
                Inicia sesion aqui
              </Link>
            </p>
          )}
        </form>
      </section>
    </AnimationWrapper>
  );
};

export default UserAuthForm;
