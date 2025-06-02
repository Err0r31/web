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
      role="region"
      aria-label={title}
    >
      <form
        className={styles.authForm}
        onSubmit={handleSubmit(handleFormSubmit)}
        noValidate
      >
        <div className={styles.authForm__titleWrapper}>
          <h2 className={styles.authForm__title}>{title}</h2>
          <button
            className={styles.authForm__button}
            onClick={switchFunc}
            type="button"
            aria-label={`Переключить на ${switchText}`}
          >
            {switchText}
          </button>
        </div>
        <div className={styles.authForm__inputs}>
          {fields.map((field) => (
            <div 
              key={field.name} 
              className={styles.authForm__inputWrapper}
              role="group"
              aria-labelledby={`${field.name}-label`}
            >
              <label 
                id={`${field.name}-label`} 
                htmlFor={field.name}
                className="sr-only"
              >
                {field.placeholder}
              </label>
              {field.icon && (
                <span className={styles.authForm__iconWrapper} aria-hidden="true">
                  {field.icon}
                </span>
              )}
              <input
                id={field.name}
                type={field.type === "password" && showPassword ? "text" : field.type}
                placeholder={field.placeholder}
                className={`${styles.authForm__input} ${
                  errors[field.name] ? styles["authForm__input--error"] : ""
                }`}
                {...register(field.name)}
                autoComplete={field.type === "password" ? "current-password" : "off"}
                aria-invalid={errors[field.name] ? "true" : "false"}
                aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
              />
              {field.type === "password" && (
                <button
                  type="button"
                  className={styles.authForm__toggleIcon}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPassword ? (
                    <FiEyeOff aria-hidden="true" />
                  ) : (
                    <FiEye aria-hidden="true" />
                  )}
                </button>
              )}
              {errors[field.name] && (
                <p 
                  id={`${field.name}-error`}
                  className={styles.authForm__error}
                  role="alert"
                >
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
          aria-busy={isLoading}
          aria-label={isLoading ? "Загрузка..." : buttonText}
        >
          {isLoading ? (
            <>
              <PuffLoader color="#fff" size={24} />
              <span className="sr-only">Загрузка...</span>
            </>
          ) : (
            buttonText
          )}
        </button>
      </form>
    </motion.div>
  );
}
