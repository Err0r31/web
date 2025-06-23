from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, LoginView, LogoutView, RandomRecommendedProductsView, ProductStatsView,
    BannerViewSet, UserOrdersViewSet, CategoryProductsViewSet,
    ProductListViewSet, ReviewViewSet, CartViewSet, FavoriteViewSet,
    ProductVariationViewSet, RandomReviewsView, ProductViewSet, CategoryListView,
    AdminOrderViewSet, UserManagementViewSet, UserProfileView, CreateOrderView, test_sentry, EDExamListView
)

router = DefaultRouter()
router.register(r'banners', BannerViewSet, basename='banner')
router.register(r'products', ProductListViewSet, basename='product')
router.register(r'categories/(?P<category_slug>[^/.]+)/products', CategoryProductsViewSet, basename='category-products')
router.register(r'products/(?P<product_pk>\d+)/reviews', ReviewViewSet, basename='product-reviews')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'favorites', FavoriteViewSet, basename='favorite')
router.register(r'variations', ProductVariationViewSet, basename='variation')
router.register(r'admin/products', ProductViewSet, basename='admin-product')
router.register(r'admin/orders', AdminOrderViewSet, basename='admin-orders')
router.register(r'admin/users', UserManagementViewSet, basename='admin-users')

urlpatterns = [
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/logout/', LogoutView.as_view(), name='logout'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/random-recommended/', RandomRecommendedProductsView.as_view(), name='random-recommended-products'),
    path('api/random-reviews/', RandomReviewsView.as_view(), name="random-reviews"),
    path('api/product-stats/', ProductStatsView.as_view(), name='product-stats'),
    path('api/cart/clear/', CartViewSet.as_view({'post': 'clear'}), name='cart-clear'),
    path('api/cart/merge/', CartViewSet.as_view({'post': 'merge_cart'}), name='cart-merge'),
    path('api/categories/', CategoryListView.as_view(), name='category-list'),
    path('api/profile/', UserProfileView.as_view(), name='user-profile'),
    path('api/create-order/', CreateOrderView.as_view(), name='create-order'),
    path('api/user/orders/', UserOrdersViewSet.as_view(), name='user-orders'),
    path('api/test-sentry/', test_sentry),
    path('api/edexam/', EDExamListView.as_view(), name='edexam_list'),
    path('api/', include(router.urls)),
]