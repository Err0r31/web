import React, { useState } from "react";
import Register from "../../components/auth/Register";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import Login from "../../components/auth/Login";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const [isRegistration, serIsRegistration] = useState(true);
  const navigate = useNavigate();

  function handleSwitch() {
    serIsRegistration(!isRegistration);
  }

  function loginSuccess() {
    navigate("/");
  }

  return (
    <>
      <Header />
      <main className="content">
        {isRegistration ? (
          <Register switchFunc={handleSwitch} />
        ) : (
          <Login switchFunc={handleSwitch} onLoginSuccess={loginSuccess} />
        )}
      </main>
      <Footer />
    </>
  );
}
