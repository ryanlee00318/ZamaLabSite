import NavBar from "./NavBar"
import Footer from "./Footer"
export default function Layout({children}){
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