from django.urls import path
from .views import (
    RegisterView, LogoutView, BannerListView, RandomRecommendedProductsView,
    UserOrdersView, CategoryProductsView, ProductDetailView, ReviewCreateView,
    ReviewUpdateView, ReviewDeleteView, APIOverviewView, ProductStatsView, LoginView
)

urlpatterns = [
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/logout/', LogoutView.as_view(), name='logout'),
    path('api/banners/', BannerListView.as_view(), name='banner-list'),
    path('api/random-recommended-products/', RandomRecommendedProductsView.as_view(), name='random-recommended-products'),
    path('api/user/orders/', UserOrdersView.as_view(), name='user-orders'),
    path('api/categories/<slug:category_slug>/products/', CategoryProductsView.as_view(), name='category-products'),
    path('api/products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('api/products/<int:pk>/reviews/create/', ReviewCreateView.as_view(), name='review-create'),
    path('api/reviews/<int:pk>/update/', ReviewUpdateView.as_view(), name='review-update'),
    path('api/reviews/<int:pk>/delete/', ReviewDeleteView.as_view(), name='review-delete'),
    path('api/', APIOverviewView.as_view(), name='api-overview'),
    path('api/product-stats/', ProductStatsView.as_view(), name='product-stats'),
]