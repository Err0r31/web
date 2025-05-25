import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../shared/Toast/ToastProvider";

export default function NotFound() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    useEffect(() => {
        showToast('Страница не найдена, перенаправляем на главную', 'warning');
        const timer = setTimeout(() => {
            navigate('/');
        }, 3000);
        return () => clearTimeout(timer);
    }, [navigate, showToast]);

    return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
            <h1>404 - Страница не найдена</h1>
            <p>Вы будете перенаправлены на главную страницу через 3 секунды...</p>
        </div>
    );
}