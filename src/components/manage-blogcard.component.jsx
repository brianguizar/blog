import { Link } from "react-router-dom";
import { getDay } from "../common/date";
import { useState } from "react";
import { useContext } from "react";
import { UserContext } from "../App";
import axios from "axios";

const BlogsStats = ({ stats }) => {
    return (
        <div className="flex gap-2 max-lg:mb-6 max-lg:pb-6 border-grey max-lg:border-b">

            {Object.keys(stats).map((key, i) => {
                return !key.includes("parent") ? (
                    <div 
                        key={i} 
                        className={`flex flex-col items-center w-full h-full justify-center p-4 px-6 ${i !== 0 ? "border-grey border-l" : ""}`}>
                        <h1 className="text-xl lg:text-2xl mb-2">{stats[key]?.toLocaleString()}</h1> {/* Usar 'key' para acceder al valor */}
                        <p className="max-lg:text-dark-grey capitalize">{key.split("_")[i]}</p> {/* Usar 'key' para procesar el texto */}
                    </div>
                ) : null;
            })}
        </div>
    );
};



export const ManagePublishedBlogsCard = ({blog}) => {

    let {banner, blog_id, title, publishedAt, activity} = blog;

    let [showStat, setShowStat] = useState(false);

    let {userAuth :{access_token} } = useContext(UserContext);

    console.log(showStat);

    return (
        
       <>
       <div className="flex gap-10 border-b mb-6 max-md:px -4
       border-grey pb-6 items-center">

        <img src={banner} className="max-md:hidden lg:hidden
        xl:block w-28 h-28 flex-none bg-grey object-cover"></img>

        <div className="flex flex-col justify-between py-2 w-full min-w-[300px]">
            <div>
                <Link to={`/blog/${blog_id}`} 
                className="blog-title mb-4 hover:underline">{title}</Link>

                <p className="line-clamp-1">Publicado en {getDay(publishedAt)}</p>
            </div>

            <div className="flex gap-6 mt-3">

                <Link to={`/editor/${blog_id}`} className=
                "pr-4 py-2 underline">Editar</Link>

                <button className="lg:hidden pr-4 py-2 underline "
                onClick={() => setShowStat(preVal => !preVal)}>Stats</button>

                <button className="pr-4 py-2 underline text-red"
                onClick={(e) => deletedBlog(blog,access_token, e.target )}>Borrar</button>


            </div>

        </div>
        
        <div className="max-lg:hidden">

            <BlogsStats stats={activity}/>

        </div>

       </div>

       {

        showStat ? <div className="lg:hidden"><BlogsStats stats={activity}/>
            </div> : ""
       }
       </>
    )
}

export const ManageDraftBlogsPost  = ({blog}) =>{

    let {title, des, blog_id, index} = blog;

    let {userAuth :{access_token} } = useContext(UserContext);

    index++;

    return (

        <div className="flex gap-5 lg:gap-10 pb-6 border-b mb-6 border-grey">

            <h1 className="blog-index text-center pl-4 md:pl-6 flex-none">{index < 10 ? "0" + index : index}</h1>

            <div>

                <h1 className="blog-title mb-3">{title}</h1>

                <p className="line-clamp-2 font-gelasio">{des.length ? des : "Sin descripcion"}</p>

                <div className="flex gap-6 mt-3">
                    <Link to={`/editor/${blog_id}`}
                    className="pr- 4 py-2 underline">Editar</Link>

                <button className="pr-4 py-2 underline text-red"
                onClick={(e) => deletedBlog(blog,access_token, e.target )}>Borrar</button>

                </div>

            </div>

        </div>
    )


}

const deletedBlog = (blog, access_token, target) =>{

    let { index , blog_id, setStateFunc } = blog;

    target.setAttribute("disabled", true);

    axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/delete-blog", { blog_id }, {
        headers: {
            'Authorization': `Bearer ${access_token}`
        }
    })
    .then(({data}) =>{

        target.removeAttribute("disabled");


        setStateFunc(preVal => {

            let {deletedDocCount, totalDocs, results} = preVal;

            results.splice(index,1);

            if(!deletedDocCount){
                deletedDocCount = 0;


            }

            if(results.length && totalDocs - 1 > 0){

                return null;
            }
            return {...preVal, totalDocs : totalDocs - 1 , deletedDocCount : deletedDocCount + 1}
        })
    })
    .catch(err => {

        console.log(err);


    })
    



}

