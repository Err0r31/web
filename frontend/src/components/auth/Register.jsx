import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { register as registerUser } from "../../utils/auth.js";
import { FiUser, FiEye, FiEyeOff } from "react-icons/fi";
import { TfiEmail } from "react-icons/tfi";
import { useToast } from "../shared/Toast/ToastProvider.jsx";
import styles from "./auth.module.scss";

const schema = yup.object().shape({
  username: yup
    .string()
    .required("Имя пользователя обязательно")
    .min(3, "Минимум 3 символа"),
  email: yup
    .string()
    .required("Email обязателен")
    .email("Неверный формат email"),
  password: yup
    .string()
    .required("Пароль обязателен")
    .min(8, "Минимум 8 символов")
    .matches(/[a-zA-Z]/, "Пароль должен содержать букву")
    .matches(/\d/, "Пароль должен содержать цифру"),
});

export default function Register({ switchFunc }) {
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await registerUser(data.username, data.email, data.password);
      showToast("Регистрация успешна!", "success");
      switchFunc();
    } catch (err) {
      showToast(err.message || "Ошибка регистрации", "error");
    }
  };

  return (
    <div className="container">
      <form className={styles.authForm} onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.authForm__titleWrapper}>
          <h1 className={styles.authForm__title}>Регистрация</h1>
          <button className={styles.authForm__button} onClick={switchFunc}>
            Вход
          </button>
        </div>

        <div className={styles.authForm__inputs}>
          <div className={styles.authForm__inputWrapper}>
            <FiUser className={styles.authForm__inputIcon} />
            <input
              type="text"
              placeholder="Имя пользователя"
              autoComplete="off"
              className={`${styles.authForm__input} ${
                errors.username ? styles["authForm__input--error"] : ""
              }`}
              {...register("username")}
            />
            {errors.username && (
              <p className={styles.authForm__error}>
                {errors.username.message}
              </p>
            )}
          </div>

          <div className={styles.authForm__inputWrapper}>
            <TfiEmail className={styles.authForm__inputIcon} />
            <input
              type="email"
              placeholder="Email"
              autoComplete="off"
              className={`${styles.authForm__input} ${
                errors.email ? styles["authForm__input--error"] : ""
              }`}
              {...register("email")}
            />
            {errors.email && (
              <p className={styles.authForm__error}>{errors.email.message}</p>
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
              autoComplete="off"
              className={`${styles.authForm__input} ${
                errors.password ? styles["authForm__input--error"] : ""
              }`}
              {...register("password")}
            />
            {errors.password && (
              <p className={styles.authForm__error}>
                {errors.password.message}
              </p>
            )}
          </div>
        </div>
        <button type="submit" className={styles.authForm__submit}>
          Зарегистрироваться
        </button>
      </form>
    </div>
  );
}
