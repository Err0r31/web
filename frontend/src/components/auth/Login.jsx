import React, { useContext } from "react";
import * as yup from "yup";
import { useToast } from "../shared/Toast/ToastProvider";
import { AuthContext } from "../../context/AuthContext";
import { authLogin } from "../../utils/auth";
import AuthForm from "./AuthForm";
import { FiUser } from "react-icons/fi";
import styles from "./auth.module.scss";

const schema = yup.object().shape({
  username: yup
    .string()
    .required("Введите имя пользователя")
    .min(3, "Минимум 3 символа"),
  password: yup.string().required("Введите пароль"),
});

export default function Login({ onLoginSuccess, switchFunc }) {
  const { showToast } = useToast();
  const { handleLogin } = useContext(AuthContext);

  const fields = [
    {
      name: "username",
      type: "text",
      placeholder: "Имя пользователя",
      icon: <FiUser className={styles.authForm__inputIcon} />,
    },
    {
      name: "password",
      type: "password",
      placeholder: "Пароль",
      icon: null,
    },
  ];

  const onSubmit = async (data) => {
    try {
      await authLogin(data.username, data.password);
      showToast("Вход выполнен успешно!", "success");
      handleLogin();
      onLoginSuccess();
    } catch (err) {
      showToast(err.message || "Ошибка при входе", "error");
      throw err;
    }
  };

  return (
    <AuthForm
      schema={schema}
      onSubmit={onSubmit}
      fields={fields}
      title="Вход"
      buttonText="Войти"
      switchFunc={switchFunc}
      switchText="Регистрация"
    />
  );
}
