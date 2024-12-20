import { Toaster, toast } from "react-hot-toast";
import AnimationWrapper from "../common/page-animation";
import { useContext } from "react";
import { EditorContext } from "../pages/editor.pages";
import Tag from "./tags.component";
import axios from "axios";
import { UserContext } from "../App";
import { useNavigate, useParams } from "react-router-dom";

const PublishForm = () => {

  let characterLimit = 200;
  let tagLimit = 5;

  let { blog_id } = useParams();

  let { blog, blog: { banner, title, tags, des, content }, setEditorState, setBlog } = useContext(EditorContext);

  let { userAuth: { access_token } } = useContext(UserContext);

  let navigate = useNavigate();

  const handleCloseEvent = () => {
    setEditorState("editor")
  }

  const handleBlogTitleChange = (e) => {
    let input = e.target

    setBlog({ ...blog, title: input.value })
  }

  const handleBlogDesChange = (e) => {
    let input = e.target;

    setBlog({ ...blog, des: input.value })
  }

  const handleTitleKeyDown = (e) => {
    if ((e.keyCode == 13)) {
      e.preventDefault();
    }
  };

  const handleKeyDown = (e) => {
    if (e.keyCode == 13 || e.keyCode == 188) {
      e.preventDefault();

      let tag = e.target.value;

      if (tags.length < tagLimit) {
        if (!tags.includes(tag) && tag.length) {
          setBlog({ ...blog, tags: [...tags, tag] })
        }
      } else {
        toast.error(`Solo puedes añadir maximo ${tagLimit} Categorias`)
      }
      e.target.value = "";

    }
  }

  const publishBlog = (e) => {

    if (e.target.className.includes("disable")) {
      return;
    }

    if (!title.length) {
      return toast.error("Escribe el titulo del blog antes de publicarlo")
    }

    if (!des.length || des.length > characterLimit) {
      return toast.error(`Escribe la descripcion sobre tu blog ${characterLimit} caracteres para publicar`)
    }

    if (!tags.length) {
      return toast.error("Inserte almenos 1 tag para que podamos posicionar tu blog")
    }

    let loadingToast = toast.loading("Publicando...");

    e.target.classList.add('disable');

    let blogObj = {
      title, banner, des, content, tags, draft: false
    }

    axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/create-blog",
      {...blogObj, id: blog_id } , {
      headers: {
        'Authorization': `Bearer ${access_token} `
      }
    })
      .then(() => {
        e.target.classList.remove('disable');

        toast.dismiss(loadingToast);
        toast.success("Publicado :)");

        setTimeout(() => {
          navigate("/dashboard/blogs")
        }, 500);

      })

      .catch(({ response }) => {
        e.target.classList.remove('disable');
        toast.dismiss(loadingToast);

        return toast.error(response.data.error)
      })
  }

  return (
    <AnimationWrapper>
      <section className="w-screen min-h-screen grid items-center lg:grid-cols-2 py-16 lg:gap-4">
        <Toaster />

        <button
          className="w-12 h-12 absolute right-[5vw] z-10 top-[5%] lg:top-[10%]"
          onClick={handleCloseEvent}
        >
          <i className="fi fi-br-cross"></i>
        </button>

        <div className="max-w-[550px] center">

          <p className="text-dark-grey mb-1">
            Vista Previa
          </p>

          <div className="w-full aspect-video rounded-lg overflow-hidden bg-grey mt-4">
            <img src={banner} />
          </div>

          <h1 className="text-4xl font-medium mt-2 leading-tight line-clamp-2"> {title} </h1>

          <p className="font-gelasio line-clamp-2 text-xl leading-7 mt-4"> {des} </p>

        </div>

        <div className="border-grey lg:border-1 lg:pl-8">
          <p className="text-dark-grey mb-2 mt-9">Titulo del blog</p>
          <input type="text" placeholder="Blog Title" defaultValue={title} className="input-box pl-4" onChange={handleBlogTitleChange} />

          <p className="text-dark-grey mb-2 mt-9">Descripcion Corta</p>

          <textarea
            maxLength={characterLimit}
            defaultValue={des}
            className="h-40 resize-none leading-7 input-box pl-4"
            onChange={handleBlogDesChange}
            onKeyDown={handleTitleKeyDown}
          >
          </textarea>

          <p className="mt-1 text-dark-grey text-sm text-right">
            Te quedan {characterLimit - des.length} caracteres
          </p>

          <p className="text-dark-grey mb-2 mt-9">Categorias - Facilita la busqueda y posiciona tu publicacion</p>

          <div className="relative input-box pl-2 py-2 pb-4">
            <input type="text" placeholder="Categorias" className="sticky input-box bg-white top-0 left-0 pl-4 mb-3 focus:bg-white"
              onKeyDown={handleKeyDown}
            />
            {
              tags.map((tag, i) => {
                return <Tag tag={tag} tagIndex={i} key={i} />
              })
            }

          </div>
          <p className="mt-1 mb-4 text-dark-grey text-right">Te quedan {tagLimit - tags.length} categorias </p>
          <button className="btn-dark px-8"
            onClick={publishBlog}> Publicar</button>
        </div>



      </section>
    </AnimationWrapper>
  )
};

export default PublishForm;

