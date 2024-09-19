import { Route, Routes } from "react-router-dom";
import Navbar from "./components/navbar.component";

const App = () => {

    return(


        // Define las rutas de la aplicación
   <Routes>
      <Route path="/" element={<Navbar/>}>
         <Route path="signin" element={<h1>Iniciar Sesión</h1>}/>
         <Route path="signup" element={<h1>Regístrarse</h1>}/>
      </Route>
   </Routes>

    )
}

export default App;