import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { FiUser, FiEye, FiEyeOff } from "react-icons/fi";
import { TfiEmail } from "react-icons/tfi";
import { PuffLoader } from "react-spinners";
import { motion } from 'framer-motion'
import styles from "./auth.module.scss";

export default function AuthForm({
  schema,
  onSubmit,
  fields,
  title,
  buttonText,
  switchFunc,
  switchText,
}) {
  const [showPassword, setShowPassword] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const handleFormSubmit = async (data) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <form
        className={styles.authForm}
        onSubmit={handleSubmit(handleFormSubmit)}
      >
        <div className={styles.authForm__titleWrapper}>
          <h1 className={styles.authForm__title}>{title}</h1>
          <button
            className={styles.authForm__button}
            onClick={switchFunc}
            type="button"
          >
            {switchText}
          </button>
        </div>
        <div className={styles.authForm__inputs}>
          {fields.map((field) => (
            <div key={field.name} className={styles.authForm__inputWrapper}>
              {field.icon}
              <input
                type={
                  field.type === "password" && showPassword
                    ? "text"
                    : field.type
                }
                placeholder={field.placeholder}
                className={`${styles.authForm__input} ${
                  errors[field.name] ? styles["authForm__input--error"] : ""
                }`}
                {...register(field.name)}
                autoComplete="off"
              />
              {field.type === "password" &&
                (showPassword ? (
                  <FiEyeOff
                    className={styles.authForm__toggleIcon}
                    onClick={() => setShowPassword(false)}
                  />
                ) : (
                  <FiEye
                    className={styles.authForm__toggleIcon}
                    onClick={() => setShowPassword(true)}
                  />
                ))}
              {errors[field.name] && (
                <p className={styles.authForm__error}>
                  {errors[field.name].message}
                </p>
              )}
            </div>
          ))}
        </div>
        <button
          type="submit"
          className={styles.authForm__submit}
          disabled={isLoading}
        >
          {isLoading ? <PuffLoader color="#fff" size={24} /> : buttonText}
        </button>
      </form>
    </motion.div>
  );
}
