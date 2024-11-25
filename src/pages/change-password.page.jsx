import { useRef } from "react";
import AnimationWrapper from "../common/page-animation";
import InputBox from "../components/input.component";
import toast, { Toaster } from "react-hot-toast";
import { useContext } from "react";
import { UserContext } from "../App";

const ChangePassword = () => {

    let { userAuth: { access_token } } = useContext(UserContext);

    let ChangePasswordForm = useRef();

    let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

    const handleSubmit = (e) => {
        e.preventDefault();
        
        let form = new FormData(ChangePasswordForm.current);
        let formData = { };

        for(let [key, value] of form.entries()){
            formData[key] = value
        }

        let { currentPassword, newPassword } = formData;

        if(!currentPassword.length || !newPassword.length){
            return toast.error("Llena todos los campos")
        }

        if(!passwordRegex.test(currentPassword) || !passwordRegex.test(newPassword)){
            return toast.error("La contraseña debe tener de 6 a 20 caracteres, con 1 número, 1 minúscula y 1 mayúscula")
        }

        e.target.setAttribute("disabled", true);

        let loadingToast = toast.loading("Actualizando...");

        axios.POST(import.meta.env.VITE_SERVER_DOMAIN + "/change-password", formData, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            } 
        } )
        .then(() => {
            toast.dismiss(loadingToast);
            e.target.removeAttribute("disabled");
            return toast.success("Contraseña Actualizada")
        })
        .catch(({ response }) => {
            toast.dismiss(loadingToast);
            e.target.removeAttribute("disabled");
            return toast.error(response.data.error)
        })


    }

    return (
        <AnimationWrapper>
            <Toaster />
            <form ref={ChangePasswordForm}>

                <h1 className="max-md:hidden">Cambiar Contraseña</h1>

                <div className="py-10 w-full md:max-w-[400px]">
                    <InputBox name="currentPassword" type="password" className="profile-edit-input" placeholder="Contraseña Actual" icon="fi-rr-unlock" />
                    <InputBox name="newPassword" type="password" className="profile-edit-input" placeholder="Nueva Contraseña" icon="fi-rr-unlock" />

                    <button onClick={handleSubmit} className="btn-dark px-10" type="submit">Actualizar Contraseña</button>
                </div>

            </form>
        </AnimationWrapper>
    )
}

export default ChangePassword;