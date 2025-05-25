import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Login from "../../components/auth/Login";
import Register from "../../components/auth/Register";
import styles from "./AuthPage.module.scss";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const switchForm = () => {
    setIsLogin(!isLogin);
  };

  const handleLoginSuccess = () => {
    navigate("/");
  };

  return (
    <>
      <Header />
      <main className={`content ${styles.authPage}`}>
        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Login
                onLoginSuccess={handleLoginSuccess}
                switchFunc={switchForm}
              />
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Register switchFunc={switchForm} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </>
  );
}
