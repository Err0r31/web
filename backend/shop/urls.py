from django.urls import path
from .views import BannerListView, RandomRecommendedProductsView, OutfitListView

urlpatterns = [
    path('api/banners/', BannerListView.as_view(), name='banner-list'),
    path('api/random-recommended-products/', RandomRecommendedProductsView.as_view(), name='recommended_products'),
    path('api/outfits', OutfitListView.as_view(), name="outfit-list"),
]