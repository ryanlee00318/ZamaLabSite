import NavBar from "./NavBar"
import Footer from "./Footer"
import { useEffect } from "react";

export default function Layout({ children, title = "Tron Energy Market" }){
    useEffect(() => {
        document.title = title;
    }, [title]);
    return (
        <div>
            <NavBar />
            <div className="min-h-[calc(100vh-212px)]">
                {children}
            </div>
            <Footer />
        </div>
    )
}
