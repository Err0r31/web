from django.urls import path
from .views import BannerListView, RandomRecommendedProductsView, OutfitListView, RegisterView, LogoutView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('api/banners/', BannerListView.as_view(), name='banner-list'),
    path('api/random-recommended-products/', RandomRecommendedProductsView.as_view(), name='recommended_products'),
    path('api/outfits', OutfitListView.as_view(), name="outfit-list"),

    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/logout/', LogoutView.as_view(), name='logout'),
]