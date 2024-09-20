import InputBox from "../components/input.component";
import googleIcon from "../imgs/google.png"; // Icono de Google que se usará en el botón de iniciar sesión con Google
import { Link } from "react-router-dom";
import AnimationWrapper from "../common/page-animation"; // Componente para animar la página

// UserAuthForm, "type" que indica si es para iniciar sesión o registrarse
const UserAuthForm = ({ type }) => {
  return (
    // Componente de animación
    <AnimationWrapper keyValue={type}>
      <section className="h-cover flex items-center justify-center">
        <form className="w-[80%] max-w-[400px]">
          <h1 className="text-4xl font-gelasio capitalize text-center mb-24">
            {type == "sign-in" ? "Bienvenido" : "Registrate"}
          </h1>

          {/* Si el tipo no es "sign-in", mostramos el campo de nombre completo */}
          {type != "sign-in" ? (
            <InputBox
              name="fullname"
              type="text"
              placeholder="Ingresa tu nombre"
              icon="fi-rr-user" // Icono de usuario
            />
          ) : (
            ""
          )}

          {/* Campo de correo electrónico que siempre se muestra */}
          <InputBox
            name="email"
            type="email"
            placeholder="Ingresa tu correo"
            icon="fi-rr-envelope" // Icono de sobre para correo
          />

          {/* Campo de contraseña que siempre se muestra */}
          <InputBox
            name="password"
            type="password"
            placeholder="Ingresa tu contraseña"
            icon="fi-rr-key" // Icono de llave para contraseña
          />

          {/* Botón de enviar que cambia su texto según el tipo (iniciar sesión o registrarse) */}
          {type == "sign-in" ? (
            <button className="btn-dark center mt-14" type="submit">
              {type.replace("sign-in", "Iniciar sesion")}{" "}
              {/* Reemplaza el texto "sign-in" por "Iniciar sesión" */}
            </button>
          ) : (
            <button className="btn-dark center mt-14" type="submit">
              {type.replace("sign-up", "Registrarme")}{" "}
              {/* Reemplaza el texto "sign-up" por "Registrarme" */}
            </button>
          )}

          {/* División línea horizontal y el texto "O" en el medio */}
          <div className="relative w-full flex items-center gap-2 my-10 opacity-50 uppercase text-black font-bold">
            <hr className="w-1/2 border-black" />
            <p>O</p>
            <hr className="w-1/2 border-black" />
          </div>

          {/* Botón para iniciar sesión con Google, que incluye el icono de Google */}
          <button className="btn-dark flex items-center justify-center gap-4 w-[90%] center">
            <img src={googleIcon} className="w-5" /> {/* Icono de Google */}
            Continuar con Google
          </button>

          {/* Mensaje condicional que cambia dependiendo de si es "sign-in" o "sign-up" */}
          {type == "sign-in" ? (
            // Si es "sign-in", mostramos el enlace para registrarse
            <p className="mt-6 text-dark-grey text-xl text-center">
              ¿Aun no tienes una cuenta?
              <Link to="/signup" className="underline text-black text-xl ml-1">
                Crea una cuenta aqui
              </Link>
            </p>
          ) : (
            // Si es "sign-up", mostramos el enlace para iniciar sesión
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
