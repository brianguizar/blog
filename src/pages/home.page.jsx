import axios from "axios";
import AnimationWrapper from "../common/page-animation";
import InPageNavigation from "../components/inpage-navigation.component";
import { useEffect, useState } from "react";
import Loader from "../components/loader.component"
import BlogPostCard from "../components/blog-post.component";

const HomePage = () =>{

    let [blogs, setBlog ] = useState(null);

    const fetchLatestBlogs = () => {
        axios.get(import.meta.env.VITE_SERVER_DOMAIN + "/latest-blogs")
        .then(({ data }) => {
            setBlog(data.blogs);
        })
        .catch(err => {
            console.log(err);
        })
    }

    useEffect(() => {
        fetchLatestBlogs();
    }, [])

    return (
        <AnimationWrapper>
            <section className="h-cover flex justify-center gap-10">
                {/* Ultimos blogs */}
                <div className="w-full">
                    <InPageNavigation routes = {["Home", "Tendencias"]} defaultHidden={["Tendencias"]}>

                        <>
                            {
                                blogs == null ? <Loader />:
                                blogs.map((blog, i) => {
                                    return <AnimationWrapper transition={{duration: 1, delay: i*.1 }} key={i}> 
                                        <BlogPostCard  content={blog} author={blog.author.personal_info}/>
                                    </AnimationWrapper>
                                })
                            }
                        </>

                        <h1>Blogs en Tendencia</h1>
                    </InPageNavigation>
                </div>
                
                {/* Blogs en tendencia */}
                <div>
                </div>
            </section>
        </AnimationWrapper>
    )
}

export default HomePage;
