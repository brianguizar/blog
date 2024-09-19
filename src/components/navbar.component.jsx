import { Link, Outlet } from "react-router-dom"; // Importa componentes de navegación de react-router-dom
import logo from "../imgs/logo.png"// Importa el logo de la carpeta de imágenes
import { useState } from "react"; // Importa el hook useState para manejar estados dentro del componente

const Navbar = () => {

    const [ searchBoxVisibility, setsearchBoxVisibility] = useState(false)   // Define un estado para manejar la visibilidad del cuadro de búsqueda


    return(

        <>
            <nav className="navbar"> 


                <Link to="/" className="flex-none w-10">   {/* Enlace al inicio de la página con el logo */}
                
                    <img src={logo} className="w-full" />

                </Link>

                    <div className={"absolute bg-white w-full left-0 top-full mt-0.5 border-b border-grey py-4 px-[5vw] md:border-0 md:block md:relative md:inset-0 md:p-0 md:w-auto md:show "
                    + (
                    searchBoxVisibility ? "show" : "hide")}>  {/* Cuadro de búsqueda, que se muestra u oculta según el estado */}

                            <input 

                            type="text" 
                            placeholder="Buscar"
                            className="w-full md:w-auto bg-grey p-4 pl-6 pr-[12%]
                            md:pr-6 rounded-full placeholder:text-dark-grey md:pl-12"
                            />  {/* Input para buscar */}

                            <i className="fi fi-br-search absolute right-[10%] 
                            md:pointer-events-none md:left-5 top-1/2 -translate-y-1/2
                            text-x1 text-dark-grey"></i>  {/* Icono de búsqueda al lado del cuadro de búsqueda */}
                            


                    </div>

                    <div className="flex items-center gap-3  md:gab-6 ml-auto"> {/* Contenedor de elementos de la derecha */}

                        <button className="md:hidden bg-grey w-12 h-12 
                        rounded-full flex items-center justify-center"

                            onClick={() => setsearchBoxVisibility(currentVal => !currentVal) }>

                                <i className="fi fi-br-search text-x1"></i>

                        </button>  {/* Botón de búsqueda visible solo en pantallas móviles */}

                        <Link to="/editor" className="hidden md:flex gap-2 link">

                                <i className="fi fi-rs-file-edit"></i>

                                     <p>Redactar</p>

                        </Link>

                        <Link className="btn-dark py-2" to="/signin">

                            Iniciar Sesión

                        </Link>   {/* Enlace para iniciar sesión */}

                        <Link className="btn-ligth py-2  hidden md:block"  to="/signup">

                            Regístrarse

                        </Link>   {/* Enlace para Regístrarse */}


                    </div>

            </nav>

                <Outlet />         {/* Outlet para renderizar rutas anidadas */}
        
        </>

    )
}

export default Navbar; 
