import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import { PuffLoader } from "react-spinners";
import { getProduct } from "../../utils/api";
import { useToast } from "../../components/shared/Toast/ToastProvider";
import { AuthContext } from "../../context/AuthContext";
import styles from "./ProductPage.module.scss";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import Reviews from "../../components/Reviews/Reviews";

import Slider from "react-slick";

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedVariation, setSelectedVariation] = useState(null);
  const sliderRef = useRef(null);
  const { showToast } = useToast();
  const { isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getProduct(id);
        setProduct(data);

        if (data.variations?.length > 0) {
          const firstVariation = data.variations[0];
          setSelectedColor(firstVariation.color);
          setSelectedSize(firstVariation.size);
          setSelectedVariation(firstVariation);
        }
      } catch (err) {
        setError(err.message || "Ошибка загрузки товара");
        showToast("Ошибка загрузки товара", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [id, showToast]);

  useEffect(() => {
    if (product?.variations) {
      const variation = product.variations.find(
        (v) => v.color === selectedColor && v.size === selectedSize
      );
      setSelectedVariation(variation || null);
    }
  }, [selectedColor, selectedSize, product]);

  const availableColors = [
    ...new Set(product?.variations?.map((v) => v.color) || []),
  ];
  const availableSizes = [
    ...new Set(
      product?.variations
        ?.filter((v) => v.color === selectedColor)
        .map((v) => v.size) || []
    ),
  ];

  const colorImages =
    product?.color_images?.filter((img) => img.color === selectedColor) || [];

  const sliderSettings = {
    dots: true,
    infinite: true,
    lazyLoad: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 10000,
    fade: true,
    pauseOnHover: true,
  };

  if (loading) {
    return (
      <div className="container">
        <div className={styles.loading}>
          <PuffLoader color="#3E549D" size={60} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container">
        <div className={styles.error}>Товар не найден!</div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="content">
        <div className="container">
          <div className={styles.product}>
            <div className={styles.product__slider}>
              {colorImages.length > 0 ? (
                <Slider {...sliderSettings} ref={sliderRef}>
                  {colorImages.map((img) => (
                    <div className={styles.product__sliderItem} key={img.id}>
                      <img
                        src={img.image}
                        alt={`${product.name} ${img.color}`}
                        className={styles.product__image}
                        loading="lazy"
                      />
                    </div>
                  ))}
                </Slider>
              ) : product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className={styles.product__image}
                  loading="lazy"
                />
              ) : (
                <div className={styles.product__placeholder}>
                  Изображение отсутствует
                </div>
              )}
            </div>
            <div className={styles.product__leftSide}>
              <div className={styles.product__details}>
                <div className={styles.product__textWrapper}>
                  <p className={styles.product__rating}>
                    Рейтинг: {product.avg_rating?.toFixed(1) || 0}
                  </p>
                  <h1 className={styles.product__title}>{product.name}</h1>
                  <p className={styles.product__brand}>{product.brand}</p>
                </div>
                <p className={styles.product__price}>{product.total_price} ₽</p>
              </div>
              <div className={styles.variations}>
                <div className={styles.variations__group}>
                  <p className={styles.variations__title}>Цвет:</p>
                  <div className={styles.variations__selector}>
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        className={`${styles.variations__colorButton} ${
                          selectedColor === color
                            ? styles.variations__colorButtonActive
                            : ""
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
                <div className={styles.variations__group}>
                  <p className={styles.variations__title}>Размер:</p>
                  <div className={styles.variations__selector}>
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`${styles.variations__sizeButton} ${
                          selectedSize === size
                            ? styles.variations__sizeButtonActive
                            : ""
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button
                className={styles.product__button}
                disabled={!selectedVariation || selectedVariation.stock === 0}
              >
                Добавить в корзину
              </button>
            </div>
            <div className={styles.product__descriptionWrapper}>
              <h2 className={styles.product__subtitle}>Подробнее о товаре</h2>
              <p className={styles.product__description}>
                {product.description || "Описание отсутствует"}
              </p>
            </div>
            <Reviews productId={id} reviews={product.reviews} setProduct={setProduct} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
