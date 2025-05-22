import React, { useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { login } from "../../utils/auth.js";
import { FiUser, FiEye, FiEyeOff } from "react-icons/fi";
import { useToast } from "../shared/Toast/ToastProvider.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import styles from "./auth.module.scss";

const schema = yup.object().shape({
  username: yup
    .string()
    .required("Введите имя пользователя")
    .test(
      "is-username-or-email",
      "Некорректный формат",
      (value) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ||
        /^[a-zA-Z0-9_.-]+$/.test(value)
    ),
  password: yup.string().required("Введите пароль"),
});

export default function Login({ onLoginSuccess, switchFunc }) {
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const { handleLogin } = useContext(AuthContext);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await login(data.username, data.password);
      showToast("Вход выполнен успешно!", "success");
      handleLogin();
      onLoginSuccess();
    } catch (err) {
      showToast(err.message || "Ошибка при выполнении входа", "error");
    }
  };

  return (
    <div className="container">
      <form className={styles.authForm} onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.authForm__titleWrapper}>
          <h1 className={styles.authForm__title}>Вход</h1>
          <button className={styles.authForm__button} onClick={switchFunc}>
            Регистрация
          </button>
        </div>
        <div className={styles.authForm__inputs}>
          <div className={styles.authForm__inputWrapper}>
            <FiUser className={styles.authForm__inputIcon} />
            <input
              type="text"
              placeholder="Имя пользователя"
              className={`${styles.authForm__input} ${
                errors.username ? styles["authForm__input--error"] : ""
              }`}
              {...register("username")}
              autoComplete="off"
            />
            {errors.username && (
              <p className={styles.authForm__error}>
                {errors.username.message}
              </p>
            )}
          </div>
          <div className={styles.authForm__inputWrapper}>
            {showPassword ? (
              <FiEyeOff
                className={styles.authForm__toggleIcon}
                onClick={() => setShowPassword(false)}
              />
            ) : (
              <FiEye
                className={styles.authForm__toggleIcon}
                onClick={() => setShowPassword(true)}
              />
            )}
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Пароль"
              className={`${styles.authForm__input} ${
                errors.password ? styles["authForm__input--error"] : ""
              }`}
              {...register("password")}
              autoComplete="off"
            ></input>
            {errors.password && (
              <p className={styles.authForm__error}>
                {errors.password.message}
              </p>
            )}
          </div>
        </div>
        <button type="submit" className={styles.authForm__submit}>
          Войти
        </button>
      </form>
    </div>
  );
}
