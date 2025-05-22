import Header from "../../components/Header/Header";
import Banner from "../../components/Banner/Banner";
import RecommendedList from "../../components/RecommendedList/RecommendedList";
import Footer from "../../components/Footer/Footer";
import OutfitList from "../../components/OutfitList/OutfitList";

// import styles from "./MainPage.module.scss";

export default function MainPage() {
    return (
        <>
            <Header />
            <main>
                <Banner />
                <RecommendedList />
                <OutfitList />
            </main>
            <Footer />
        </>
    );
}