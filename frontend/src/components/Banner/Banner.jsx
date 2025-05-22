import React, { useState, useEffect, useRef } from "react";
import Slider from "react-slick";
import { Link } from "react-router-dom";
import { BsArrowLeft, BsArrowRight } from "react-icons/bs";

import styles from "./Banner.module.scss";

export default function Banner() {
  const [banners, setBanners] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [error, setError] = useState(null);
  const sliderRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/banners/")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Ошибка при загрузке баннеров");
        }
        return response.json();
      })
      .then((data) => {
        setBanners(data);
      })
      .catch((error) => {
        console.error("Ошибка:", error);
        setError("Не удалось загрузить баннеры");
      });
  }, []);

  const settings = {
    dots: false,
    infinite: true,
    lazyLoad: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 10000,
    fade: true,
    pauseOnHover: true,
    arrows: false,
    beforeChange: (oldIndex, newIndex) => setCurrentSlide(newIndex),
  };

  if (error) {
    return <div className={styles.banner__error}>{error}</div>;
  }

  if (banners.length === 0) {
    return <div className={styles.banner__loading}>Загрузка...</div>;
  }

  return (
    <div className={styles.banner}>
      <div className="container">
        <Slider {...settings} ref={sliderRef}>
          {banners.map((banner) => (
            <div key={banner.id} className={styles.banner__item}>
              {banner.image ? (
                <img
                  src={banner.image}
                  alt={banner.title}
                  className={styles.banner__img}
                />
              ) : (
                <div className={styles.banner__placeholder}>
                  Изображения нет
                </div>
              )}
              <div className={styles.banner__content}>
                <div className={styles.banner__contentLeft}>
                  <h2 className={styles.banner__title}>{banner.title}</h2>
                  <p className={styles.banner__description}>
                    {banner.description}
                  </p>
                  <Link to={banner.link} className={styles.banner__link}>
                    Перейти
                  </Link>
                </div>
                <div className={styles.banner__arrows}>
                  <button
                    type="button"
                    className={styles.banner__customArrow}
                    onClick={() => sliderRef.current.slickPrev()}
                  >
                    <BsArrowLeft />
                  </button>
                  <span className={styles.banner__slideCounter}>
                    {currentSlide + 1} / {banners.length}
                  </span>
                  <button
                    type="button"
                    className={styles.banner__customArrow}
                    onClick={() => sliderRef.current.slickNext()}
                  >
                    <BsArrowRight />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
}
