import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainPage from "./pages/MainPage/MainPage";
import { ToastProvider } from "./components/shared/Toast/ToastProvider";
import { AuthProvider } from "./context/AuthContext";
import { GenderProvider } from "./context/GenderContext";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import AuthPage from "./pages/AuthPage/AuthPage";
import NotFound from "./components/NotFound/NotFound";
import ProductPage from "./pages/ProductPage/ProductPage";
import CartPage from "./pages/CartPage/CartPage";
import ProductEdit from "./components/ProductEdit/ProductEdit";
import AdminOrderPage from "./pages/Admin/AdminOrderPage/AdminOrderPage";
import AdminUserPage from "./pages/Admin/AdminUserPage/AdminUserPage";
import CategoryPage from "./pages/CategoryPage/CategoryPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import CheckoutPage from "./pages/CheckoutPage/CheckoutPage";
import Exam from "./pages/Exam/Exam";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <GenderProvider>
          <Router>
            <Routes>
              <Route path="/" element={<MainPage />} />
              <Route path="/register" element={<AuthPage />} />
              <Route path="/products/:id" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/product/edit/:id?" element={<ProductEdit />} />
              <Route
                path="/category/:categorySlug"
                element={<CategoryPage />}
              />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/admin/orders" element={<AdminOrderPage />} />
              <Route path="/admin/users" element={<AdminUserPage />} />

              <Route path="/exam" element={<Exam />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </GenderProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
