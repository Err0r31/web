import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage/MainPage';
import { ToastProvider } from './components/shared/Toast/ToastProvider';
import { AuthProvider } from "./context/AuthContext";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import AuthPage from './pages/AuthPage/AuthPage';

function App() {
  return (
    <AuthProvider>
    <ToastProvider>
    <Router>
      <Routes>
        <Route path='/' element={<MainPage/>} />
        <Route path='/register' element={<AuthPage />} />
      </Routes>
    </Router>
    </ToastProvider>
    </AuthProvider>
  )
}

export default App
