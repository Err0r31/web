import React, { useState, useEffect } from "react";
import styles from "./Exam.module.scss";

export default function Exam() {
  const [exams, setExams] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/edexam/")
      .then((res) => res.json())
      .then((data) => setExams(data))
      .catch((err) => console.error("Ошибка загрузки экзаменов", err));
  }, []);

  return (
    <div className={styles.exam}>
      <div className="container">
        <div className={styles.exam__content}>
          <h1 className={styles.exam__header}>
            Демченко Егор Максимович, группа 231-322
          </h1>
          <ul className={styles.exam__list}>
            {exams.length === 0 ? (
              <p>Нет опубликованных экзаменов</p>
            ) : (
              exams.map((exam, index) => (
                <li key={index} className={styles.exam__item}>
                  <h2 className={styles.exam__title}>Название: {exam.title}</h2>
                  <p className={styles.exam__field}>
                    Дата создания:{" "}
                    {new Date(exam.created_at).toLocaleString("ru-RU")}
                  </p>
                  <p className={styles.exam__field}>
                    Дата проведения:{" "}
                    {new Date(exam.exam_date).toLocaleDateString("ru-RU")}
                  </p>
                  {exam.image && (
                    <div className={styles.exam__imageContainer}>
                      <img
                        src={`http://127.0.0.1:8000${exam.image}`}
                        alt={`Задание для ${exam.title}`}
                        className={styles.exam__image}
                      />
                    </div>
                  )}
                  <p className={styles.exam__field}>
                    Пользователи:{" "}
                    {exam.users.map((u) => u.username).join(", ") || "Нет"}
                  </p>
                  <p className={styles.exam__field}>
                    Опубликовано: {exam.is_public ? "Да" : "Нет"}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
