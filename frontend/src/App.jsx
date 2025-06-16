import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainPage from "./pages/MainPage/MainPage";
import { ToastProvider } from "./components/shared/Toast/ToastProvider";
import { AuthProvider } from "./context/AuthContext";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import AuthPage from "./pages/AuthPage/AuthPage";
import NotFound from "./components/NotFound/NotFound";
import ProductPage from "./pages/ProductPage/ProductPage";
import CartPage from "./pages/CartPage/CartPage";
import ProductEdit from "./components/ProductEdit/ProductEdit";
import AdminOrderPage from "./pages/Admin/AdminOrderPage/AdminOrderPage";
import AdminUserPage from "./pages/Admin/AdminUserPage/AdminUserPage";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/products/:id" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/product/edit/:id?" element={<ProductEdit />} />
            <Route path="/admin/orders" element={<AdminOrderPage />} />
            <Route path="/admin/users" element={<AdminUserPage />}  />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
