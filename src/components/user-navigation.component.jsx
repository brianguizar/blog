import { Link } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import { useContext } from "react";
import { removeFromSession } from "../common/session";
import { UserContext } from "../App"; // Asegúrate de importar UserContext

const UserNavigationPanel = () => {
    const { userAuth: { username }, setUserAuth } = useContext(UserContext);

    const signOutUser = () => {
        removeFromSession("user");
        setUserAuth({ access_token: null });
    };

    return (
        <AnimationWrapper className="absolute right-0 z-50" transition={{ duration: 0.2 }}>
            <div className="bg-white absolute right-0 border border-grey w-60 duration-200">
                <Link to="/editor" className="flex gap-2 link md:hidden pl-8 py-4">
                    <i className="fi fi-rs-file-edit"></i>
                    <p>Redactar</p>
                </Link>
                <Link to={`/user/${username}`} className="link pl-8 py-4">
                    Perfil
                </Link>
                <Link to="/dashboard/blogs" className="link pl-8 py-4">
                    Dashboard
                </Link>
                <Link to="/dashboard/edit-profile" className="link pl-8 py-4">
                    Configuración
                </Link>
                <span className="absolute border-t border-grey w-[100%]"></span>
                <button className="text-left p-4 hover:bg-grey w-full pl-8 py-4" onClick={signOutUser}>
                    <h1 className="font-bold text-xl mg-1">Cerrar Sesión</h1>
                    <p className="text-dark-grey">@{username}</p>
                </button>
            </div>
        </AnimationWrapper>
    );
};

export default UserNavigationPanel;
