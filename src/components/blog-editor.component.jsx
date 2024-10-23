import { Link } from "react-router-dom";
import logo from "../imgs/logo.png";
import AnimationWrapper from "../common/page-animation";
import defaultBanner from "../imgs/blog banner.png";
import { uploadImage } from "../common/aws";
import { useContext, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { EditorContext } from "../pages/editor.pages";
import EditorJS from "@editorjs/editorjs";
import { tools } from "./tools.component";

const BlogEditor = () => {

  //let blogBannerRef = useRef();

  let {
    blog,
    blog: { title, banner, content, tags, des },
    setBlog,
    textEditor,
    setTextEditor,
    setEditorState
  } = useContext(EditorContext);

  useEffect(() => {
    setTextEditor(
      new EditorJS({
        holderId: "textEditor",
        data: content,
        tools: tools,
        placeholder: "Es hora de escribir una increible historia",
      })
    );
  }, []);

  const handleBannerUpload = (e) => {
    let img = e.target.files[0];

    if(img){

      let loadingToast = toast.loading("Subiendo...")

      uploadImage(img).then((url) => {
        if(url){

          toast.dismiss(loadingToast);
          toast.success("Subida :)")

          setBlog({ ...blog, banner: url})
        }
      })
      .catch(err => {
        toast.dismiss(loadingToast);
        return toast.error(err)
      })
    }
  }

  const handleTitleKeyDown = (e) => {
    if ((e.keyCode == 13)) {
      e.preventDefault();
    }
  };

  const handleTitleChange = (e) => {
    let input = e.target;

    input.style.height = 'auto';
    input.style.height = input.scrollHeight + "px";

    setBlog({ ...blog, title: input.value });
  };

  //Publicar el blog
  const handlePublishEvent = () => {
    if(!banner.length){
      return toast.error("Tu blog debe de contener un banner")
    }

    if(!title.length){
      return toast.error("Tu blog debe de tener un titulo")
    } 

    if(textEditor.isReady){
      textEditor.save().then(data => {
        if(data.blocks.length){
          setBlog({ ...blog, content: data });
          setEditorState("publish")
        } else{
          return toast.error("El contenido del blog no puede estar vacio")
        }
      })
      .catch((err) => {
        console.log(err);
      })
    }

  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="flex-none w-10">
          <img src={logo} />
        </Link>
        <p className="max-md:hidden text-black line-clamp-1 w-full">
          {title.length ? title : "Nuevo blog"}
        </p>

        <div className="flex gap-4 ml-auto">
          <button className="btn-dark py-2" onClick={handlePublishEvent}>
            Publicar
          </button>
          <button className="btn-light py-2">Guardar Borrador</button>
        </div>
      </nav>

      <Toaster />

      <AnimationWrapper>
        <section>
          <div className="mx-auto max-w-[900px] w-full">
            <div className="relative aspect-video hover:opacity-80 bg-white border-4 border-x-dark-grey">
              <label htmlFor="uploadBanner">
                <img
                  //ref={blogBannerRef}
                  src={banner ? banner : defaultBanner}
                  className="z-20"
                />

                <input
                  id="uploadBanner"
                  type="file"
                  accept=".png, .jpg, .jpeg"
                  hidden
                  onChange={handleBannerUpload}
                />
              </label>
            </div>

            <textarea 
              defaultValue={title}
              placeholder="Titulo del Blog"
              className="text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40"
              onKeyDown={handleTitleKeyDown}
              onChange={handleTitleChange}
            ></textarea>

            <hr className="w-full opacity-10 my-5" />

            <div id="textEditor" className="font-gelasio"></div>

          </div>
        </section>
      </AnimationWrapper>
    </>
  );
};

export default BlogEditor;
