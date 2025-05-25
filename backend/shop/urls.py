from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, LoginView, LogoutView, RandomRecommendedProductsView, ProductStatsView,
    APIOverviewView, BannerViewSet, UserOrdersViewSet, CategoryProductsViewSet,
    ProductListViewSet, ReviewViewSet
)

router = DefaultRouter()
router.register(r'banners', BannerViewSet, basename='banner')
router.register(r'products', ProductListViewSet, basename='product')
router.register(r'user/orders', UserOrdersViewSet, basename='order')
router.register(r'categories/(?P<category_slug>[^/.]+)/products', CategoryProductsViewSet, basename='category-products')
router.register(r'products/(?P<product_pk>\d+)/reviews', ReviewViewSet, basename='product-reviews')
router.register(r'reviews', ReviewViewSet, basename='review')

urlpatterns = [
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/logout/', LogoutView.as_view(), name='logout'),
    path('api/random-recommended/', RandomRecommendedProductsView.as_view(), name='random-recommended-products'),
    path('api/product-stats/', ProductStatsView.as_view(), name='product-stats'),
    # path('api/', APIOverviewView.as_view(), name='api-overview'),
    path('api/', include(router.urls)),
]