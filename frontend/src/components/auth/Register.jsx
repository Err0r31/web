import React from "react";
import * as yup from "yup";
import { FiUser } from "react-icons/fi";
import { TfiEmail } from "react-icons/tfi";
import { useToast } from "../shared/Toast/ToastProvider";
import { authRegister } from "../../utils/auth";
import AuthForm from "./AuthForm";
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

  const fields = [
    {
      name: "username",
      type: "text",
      placeholder: "Имя пользователя",
      icon: <FiUser className={styles.authForm__inputIcon} />,
    },
    {
      name: "email",
      type: "email",
      placeholder: "Email",
      icon: <TfiEmail className={styles.authForm__inputIcon} />,
    },
    { name: "password", type: "password", placeholder: "Пароль", icon: null },
  ];

  const onSubmit = async (data) => {
    try {
      await authRegister(
        data.username,
        data.email,
        data.password,
        data.address,
        data.phone_number
      );
      showToast("Регистрация успешна!", "success");
      switchFunc();
    } catch (err) {
      showToast(err.message || "Ошибка регистрации", "error");
      throw err;
    }
  };

  return (
    <AuthForm
      schema={schema}
      onSubmit={onSubmit}
      fields={fields}
      title="Регистрация"
      buttonText="Зарегистрироваться"
      switchFunc={switchFunc}
      switchText="Вход"
    />
  );
}
