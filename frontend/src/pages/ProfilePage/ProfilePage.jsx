import React from "react";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import ProfileInfo from "../../components/Profile/ProfileInfo/ProfileInfo";
import OrderList from "../../components/Profile/OrderList/OrderList";
import styles from "./ProfilePage.module.scss";

export default function ProfilePage() {
  return (
    <>
      <Header />
      <main className="content" id="main-content">
        <div className="container">
          <div className={styles.profile}>
            <ProfileInfo />
            <OrderList />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}