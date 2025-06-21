import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PuffLoader } from "react-spinners";
import { getCategories, getFilteredProduct } from "../../utils/api";
import { useToast } from "../../components/shared/Toast/ToastProvider";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import ProductCard from "../../components/ProductCard/ProductCard.jsx";
import Filters from "../../components/Filters/Filters.jsx";
import CategoryList from "../../components/CategoryList/CategoryList.jsx";
import styles from "./CategoryPage.module.scss";
import { useGender } from "../../context/GenderContext.jsx";

export default function CategoryPage() {
  const { categorySlug } = useParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    price_min: "",
    price_max: "",
    brand: "",
    size: [],
    color: [],
    has_discount: false,
    rating_min: "",
  });
  const [tempFilters, setTempFilters] = useState({ ...filters });
  const [availableSizes, setAvailableSizes] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [availableBrands, setAvailableBrands] = useState([]);
  const { showToast } = useToast();
  const { gender } = useGender();
  const navigate = useNavigate();

  useEffect(() => {
    if (categories.length > 0 && categorySlug) {
      const exists = categories.some((cat) => cat.slug === categorySlug);
      if (!exists) {
        navigate(`/category/${categories[0].slug}`);
      }
    }
  }, [gender, categories, categorySlug, navigate])

  useEffect(() => {
    const fetchCategoriesAndFilters = async () => {
      try {
        setLoading(true);
        const categoriesData = await getCategories(gender);
        setCategories(categoriesData);

        const productsData = await getFilteredProduct(`category=${categorySlug}&gender=${gender}`);
        if (productsData) {
          const sizes = [
            ...new Set(
              productsData
                .filter((p) => p.variations)
                .flatMap((p) => p.variations.map((v) => v.size))
            ),
          ];
          const colors = [
            ...new Set(
              productsData
                .filter((p) => p.variations)
                .flatMap((p) => p.variations.map((v) => v.color))
            ),
          ];
          const brands = [...new Set(productsData.map((p) => p.brand))];
          setAvailableSizes(sizes);
          setAvailableColors(colors);
          setAvailableBrands(brands);
        }
      } catch (err) {
        console.error("Error fetching categories or products:", err);
        setError("Ошибка загрузки данных");
        showToast("Ошибка загрузки данных", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchCategoriesAndFilters();
  }, [categorySlug, showToast, gender]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append("category", categorySlug);
      queryParams.append("page", page);
      if (filters.price_min) queryParams.append("price_min", filters.price_min);
      if (filters.price_max) queryParams.append("price_max", filters.price_max);
      if (filters.brand) queryParams.append("brand", filters.brand);
      if (filters.size.length) queryParams.append("size", filters.size.join(","));
      if (filters.color.length) queryParams.append("color", filters.color.join(","));
      if (filters.has_discount) queryParams.append("has_discount", "true");
      if (filters.rating_min) queryParams.append("rating_min", filters.rating_min);

      const data = await getFilteredProduct(queryParams.toString());
      console.log("Query params:", queryParams.toString());
      console.log("Received data:", data);
      setProducts(data || []);
      setTotalPages(Math.ceil(data.length / 10));
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err.message || "Ошибка загрузки товаров");
      showToast("Ошибка загрузки товаров", "error");
    } finally {
      setLoading(false);
    }
  }, [categorySlug, page, filters, showToast]);

  useEffect(() => {
    if (categorySlug) {
      fetchProducts();
    }
  }, [categorySlug, page, filters, fetchProducts]);

  const handleTempFilterChange = (name, value) => {
    setTempFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApplyFilters = () => {
    setFilters({ ...tempFilters });
    setPage(1);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      price_min: "",
      price_max: "",
      brand: "",
      size: [],
      color: [],
      has_discount: false,
      rating_min: "",
    };
    setTempFilters(clearedFilters);
    setFilters(clearedFilters);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const currentCategory = categories.find((cat) => cat.slug === categorySlug);

  function findTopCategory(cat) {
    if (!cat) return null;
    let current = cat;
    while (current.parent) {
      current = categories.find((c) => c.id === current.parent);
    }
    return current;
  }
  const topCategory = findTopCategory(currentCategory);

  const filteredCategories = topCategory
    ? categories.filter((cat) => cat.parent === topCategory.id)
    : [];

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading} role="status" aria-live="loading">
          <PuffLoader color="#3E549D" size={60} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error} role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className={styles.content} id="main-content">
        <div className="container">
          <div className={styles.category}>
            <h1 className={styles.category__title}>
              {currentCategory ? currentCategory.name : "Категория"}
            </h1>
            <CategoryList
              categories={filteredCategories}
              currentCategorySlug={categorySlug}
            />
            <div className={styles.category__wrapper}>
              <Filters
                tempFilters={tempFilters}
                handleTempFilterChange={handleTempFilterChange}
                handleApplyFilters={handleApplyFilters}
                handleClearFilters={handleClearFilters}
                availableSizes={availableSizes}
                availableColors={availableColors}
                availableBrands={availableBrands}
              />
              <div className={styles.category__products}>
                {products.length > 0 ? (
                  <>
                    <div className={styles.products__grid}>
                      {products.map((product) => (
                        <ProductCard
                          key={product.id}
                          image={product.image || "/images/default-product.jpg"}
                          name={product.name}
                          category={
                            product.last_category_name || "Без категории"
                          }
                          price={product.price}
                          totalPrice={product.total_price}
                          discount={product.discount_percentage}
                          id={product.id}
                        />
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <div className={styles.pagination}>
                        <button
                          className={styles.pagination__button}
                          onClick={() => handlePageChange(page - 1)}
                          disabled={page === 1}
                          aria-label="Предыдущая страница"
                        >
                          Назад
                        </button>
                        <span className={styles.pagination__info}>
                          Страница {page} из {totalPages}
                        </span>
                        <button
                          className={styles.pagination__button}
                          onClick={() => handlePageChange(page + 1)}
                          disabled={page === totalPages}
                          aria-label="Следующая страница"
                        >
                          Вперед
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className={styles.category__empty}>
                    В этой категории пока нет товаров
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}