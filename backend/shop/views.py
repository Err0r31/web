from rest_framework import viewsets, generics, status, views
from rest_framework.filters import SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404, render
from django.db.models import Count, Sum, Avg
from .models import Banner, Product, User, Order, Category, Review
from .serializers import (
    BannerSerializer, ProductSerializer, OrderSerializer,
    RegisterSerializer, ReviewSerializer
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]


class LogoutView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class BannerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Banner.objects.filter(is_active=True)
    serializer_class = BannerSerializer
    pagination_class = None


class RandomRecommendedProductsView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        recommended_products = Product.objects.filter(is_recommended=True).exclude(is_active=False).order_by('?')[:6]
        serializer = ProductSerializer(recommended_products, many=True, context={'request': request})
        return Response(serializer.data)

class UserOrdersViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.request.user.orders.filter(status='delivered').select_related('user')


class CategoryProductsViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    pagination_class = PageNumberPagination

    def get_queryset(self):
        category_slug = self.kwargs['category_slug']
        category = get_object_or_404(Category, slug=category_slug)
        return Product.active_objects.filter(categories=category).select_related('brand')


class ProductListViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.active_objects.all()
    serializer_class = ProductSerializer
    filter_backends = [SearchFilter]
    search_fields = ['name']
    pagination_class = PageNumberPagination

    def get_queryset(self):
        queryset = super().get_queryset()
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(name__contains=search_query) 
        return queryset

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance = Product.active_objects.prefetch_related('categories', 'reviews').get(pk=instance.pk)
        serializer = self.get_serializer(instance)
        data = serializer.data
        data['avg_rating'] = instance.reviews.aggregate(Avg('rating'))['rating__avg'] or 0
        data['review_count'] = instance.reviews.count()
        data['category_count'] = instance.categories.annotate(product_count=Count('products')).count()
        return Response(data)


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return Review.objects.filter(user=self.request.user)
        return super().get_queryset()

    def perform_create(self, serializer):
        product_id = self.kwargs.get('product_pk')
        product = get_object_or_404(Product, pk=product_id)
        serializer.save(user=self.request.user, product=product)


class ProductStatsView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        data = {
            'active_products': Product.objects.filter(is_active=True).count(),
            'has_recommended': Product.objects.filter(is_recommended=True).exists(),
            'product_names': list(Product.objects.values_list('name', flat=True)),
            'product_summary': list(Product.objects.values('id', 'name', 'price')),
            'total_order_value': Order.objects.aggregate(total=Sum('total_price'))['total'] or 0,
        }
        Product.objects.filter(is_active=False).update(discount_percentage=0)
        Banner.objects.filter(is_active=False).delete()
        return Response(data)


class APIOverviewView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        api_urls = [
            {
                "path": "api/banners/",
                "method": "GET",
                "description": "Получить список активных баннеров",
                "requires_auth": False,
            },
            {
                "path": "api/random-recommended/",
                "method": "GET",
                "description": "Получить до 6 случайных рекомендованных продуктов",
                "requires_auth": False,
            },
            {
                "path": "api/register/",
                "method": "POST",
                "description": "Зарегистрировать нового пользователя",
                "requires_auth": False,
            },
            {
                "path": "api/login/",
                "method": "POST",
                "description": "Войти и получить токены (access и refresh)",
                "requires_auth": False,
            },
            {
                "path": "api/token/refresh/",
                "method": "POST",
                "description": "Обновить access токен с помощью refresh токена",
                "requires_auth": False,
            },
            {
                "path": "api/logout/",
                "method": "POST",
                "description": "Выйти из системы (добавить refresh-токен в чёрный список)",
                "requires_auth": True,
            },
            {
                "path": "api/products/",
                "method": "GET",
                "description": "Получить список продуктов с поиском по имени (параметр ?search=<query>)",
                "requires_auth": False,
            },
            {
                "path": "api/products/<int:pk>/",
                "method": "GET",
                "description": "Получить информацию о конкретном товаре",
                "requires_auth": False,
            },
            {
                "path": "api/user/orders/",
                "method": "GET",
                "description": "Получить список доставленных заказов текущего пользователя",
                "requires_auth": True,
            },
            {
                "path": "api/categories/<slug:category_slug>/products/",
                "method": "GET",
                "description": "Получить список товаров для категории с пагинацией (10 товаров на страницу)",
                "requires_auth": False,
            },
            {
                "path": "api/products/<int:product_pk>/reviews/",
                "method": "POST",
                "description": "Создать отзыв для продукта",
                "requires_auth": True,
            },
            {
                "path": "api/reviews/<int:pk>/",
                "method": "PUT/PATCH",
                "description": "Редактировать отзыв",
                "requires_auth": True,
            },
            {
                "path": "api/reviews/<int:pk>/",
                "method": "DELETE",
                "description": "Удалить отзыв",
                "requires_auth": True,
            },
            {
                "path": "api/product-stats/",
                "method": "GET",
                "description": "Получить статистику по продуктам и заказам",
                "requires_auth": False,
            },
        ]

        if request.accepted_renderer.format == 'html':
            return render(request, 'api_overview.html', {'endpoints': api_urls})
        return Response({
            "message": "Добро пожаловать в API! Вот список доступных путей:",
            "endpoints": api_urls
        })