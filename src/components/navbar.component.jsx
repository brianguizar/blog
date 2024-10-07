import { Link, Outlet } from "react-router-dom"; 
import logo from "../imgs/logo.png"; 
import { useContext, useState } from "react"; 
import { UserContext } from '../App';
import UserNavigationPanel from "./user-navigation.component";

const Navbar = () => {
    const [searchBoxVisibility, setSearchBoxVisibility] = useState(false);
    const [userNavPanel, setUserNavPanel] = useState(false);

    const { userAuth, userAuth: { access_token, profile_img } } = useContext(UserContext);

    const handleUserNavPanel = () => {
        setUserNavPanel(currentVal => !currentVal);
    };

    const handleBlur = () => {
        setTimeout(() => {
            setUserNavPanel(false);
        }, 200);
    };

    return (
        <>
            <nav className="navbar">
                <Link to="/" className="flex-none w-10">
                    <img src={logo} className="w-full" alt="Logo" />
                </Link>

                <div className={`absolute bg-white w-full left-0 top-full mt-0.5 border-b border-grey py-4 px-[5vw] md:border-0 md:block md:relative md:inset-0 md:p-0 md:w-auto ${searchBoxVisibility ? "show" : "hide"}`}>
                    <input
                        type="text"
                        placeholder="Buscar"
                        className="w-full md:w-auto bg-grey p-4 pl-6 pr-[12%] md:pr-6 rounded-full placeholder:text-dark-grey md:pl-12"
                    />
                    <i className="fi fi-br-search absolute right-[10%] md:pointer-events-none md:left-5 top-1/2 -translate-y-1/2 text-x1 text-dark-grey"></i>
                </div>

                <div className="flex items-center gap-3 md:gab-6 ml-auto">
                    <button className="md:hidden bg-grey w-12 h-12 rounded-full flex items-center justify-center" onClick={() => setSearchBoxVisibility(currentVal => !currentVal)}>
                        <i className="fi fi-br-search text-x1"></i>
                    </button>

                    <Link to="/editor" className="hidden md:flex gap-2 link">
                        <i className="fi fi-rs-file-edit"></i>
                        <p>Redactar</p>
                    </Link>

                    {access_token ? (
                        <>
                            <Link to="/dashboard/notification">
                                <button className="w-12 h-12 rounded-full bg-grey relative hover:bg-black/10">
                                    <i className="fi fi-rr-bell text-2x1 block mt-1"></i>
                                </button>
                            </Link>

                            <div className="relative" onClick={handleUserNavPanel} onBlur={handleBlur}>
                                <button className="w-12 h-12 mt-1">
                                    <img src={profile_img} alt="Profile" className="w-full h-full object-cover rounded-full" />
                                </button>
                                {userNavPanel && <UserNavigationPanel />}
                            </div>
                        </>
                    ) : (
                        <>
                            <Link className="btn-dark py-2" to="/signin">Iniciar Sesión</Link>
                            <Link className="btn-light py-2 hidden md:block" to="/signup">Regístrarse</Link>
                        </>
                    )}
                </div>
            </nav>
            <Outlet />
        </>
    );
};

export default Navbar;
