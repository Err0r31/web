import Header from "../../components/Header/Header";
import Banner from "../../components/Banner/Banner";
import RecommendedList from "../../components/RecommendedList/RecommendedList";
import Footer from "../../components/Footer/Footer";
import ReviewList from "../../components/ReviewsList/ReviewsList";

export default function MainPage() {
    return (
        <>
            <Header />
            <main id="main-content" className="content" role="main">
                <Banner />
                <RecommendedList />
                <ReviewList />
            </main>
            <Footer />
        </>
    );
}