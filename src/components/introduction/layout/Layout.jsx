import NavBar from "./NavBar"
import Footer from "./Footer"
import { useEffect } from "react";

export default function Layout({children}){
    useEffect(() => {
        document.title = "How To Mint Zama";
    }, []);
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