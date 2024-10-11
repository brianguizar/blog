import { Link } from "react-router-dom";
import logo from "../imgs/logo.png";
import AnimationWrapper from "../common/page-animation";
import defaultBanner from "../imgs/blog banner.png";
import { useContext } from "react";
import { EditorContext } from "../pages/editor.pages";

const BlogEditor = () => {

  let { blog, blog: { title, banner, content, tags, des  }, setBlog } = useContext(EditorContext)

  const handleBannerUpload = (e) => {
    let img = e.target.files(0);
    console.log(img)  
  };

  const handleTitleKeyDown = (e) => {
    if(e.keyCode == 13){
      //enter prohibido
      e.preventDefault();
    }
  }

  const handleTitleChange = (e) => {
    let input = e.target;
    input.style.height = 'auto';
    input.style.height = input.scrollHeight + "px"

    setBlog({ ...blog, title: input.value })
  }

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="flex-none w-10">
          <img src={logo} />
        </Link>
        <p className="max-md:hidden text-black line-clamp-1 w-full">
          { title.length ? title : "New blog" }
        </p>

        <div className="flex gap-4 ml-auto">
          <button className="btn-dark py-2">Publicar</button>
          <button className="btn-light py-2">Guardar Borrador</button>
        </div>
      </nav>

      <AnimationWrapper>
        <section>
          <div className="mx-auto max-w-[900px] w-full">
            <div className="relative aspect-video hover:opacity-80 bg-white border-4 border-x-dark-grey">
              <label htmlFor="uploadBanner">
                <img src={defaultBanner} className="z-20" />
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
              placeholder="Titulo del Blog"
              className="text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40"
              onKeyDown={handleTitleKeyDown}
              onChange={handleTitleChange}
            ></textarea>
          </div>
        </section>
      </AnimationWrapper>
    </>
  );
};

export default BlogEditor;
