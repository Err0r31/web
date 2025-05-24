from rest_framework import generics, views, permissions, status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.http import HttpResponseRedirect
from django.shortcuts import render, get_object_or_404, redirect
from django.db.models import Count, Sum, Avg
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from rest_framework.pagination import PageNumberPagination
from .models import Category, Product, Banner, User, Order, ProductVariation, Review
from .serializers import (
    BannerSerializer, ProductSerializer, RegisterSerializer,
    OrderSerializer, ReviewSerializer
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class BannerListView(generics.ListAPIView):
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer

    def get_queryset(self):
        return Banner.objects.filter(is_active=True)


class RandomRecommendedProductsView(views.APIView):
    def get(self, request):
        recommended_products = Product.objects.filter(is_recommended=True).exclude(is_active=False).order_by('?')[:6]
        serializer = ProductSerializer(recommended_products, many=True, context={'request': request})
        return Response(serializer.data)

class UserOrdersView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.orders.filter(status='delivered').select_related('user')


class CategoryProductsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, category_slug, *args, **kwargs):
        category = get_object_or_404(Category, slug=category_slug)
        paginator = PageNumberPagination()
        paginator.page_size = 10
        products = Product.active_objects.filter(categories=category).select_related('brand')
        result_page = paginator.paginate_queryset(products, request)
        serializer = ProductSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)


class ProductDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk, *args, **kwargs):
        product = get_object_or_404(Product.active_objects.prefetch_related('categories', 'reviews'), pk=pk)
        serializer = ProductSerializer(product)
        data = serializer.data
        data['avg_rating'] = product.reviews.aggregate(Avg('rating'))['rating__avg'] or 0
        data['review_count'] = product.reviews.count()
        data['category_count'] = product.categories.annotate(product_count=Count('products')).count()
        return Response(data)


class ReviewCreateView(generics.CreateAPIView):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        product_id = self.kwargs['pk']
        product = get_object_or_404(Product, pk=product_id)
        serializer.save(user=self.request.user, product=product)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        product_id = self.kwargs['pk']
        return redirect('product-detail', pk=product_id)


class ReviewUpdateView(generics.UpdateAPIView):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user)


class ReviewDeleteView(generics.DestroyAPIView):
    queryset = Review.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user)


class ProductStatsView(APIView):
    permission_classes = [permissions.AllowAny]

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


class APIOverviewView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        api_urls = [
            {
                "path": "api/banners/",
                "method": "GET",
                "description": "Получить список активных баннеров",
                "requires_auth": False,
            },
            {
                "path": "api/random-recommended-products/",
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
                "description": "Обновить access-токен с помощью refresh-токена",
                "requires_auth": False,
            },
            {
                "path": "api/logout/",
                "method": "POST",
                "description": "Выйти из системы (добавить refresh-токен в чёрный список)",
                "requires_auth": True,
            },
            {
                "path": "api/products/<int:pk>/detail/",
                "method": "GET",
                "description": "Получить полную информацию о товаре (все поля и связанные данные)",
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
                "path": "api/products/<int:pk>/reviews/create/",
                "method": "POST",
                "description": "Добавить отзыв к продукту",
                "requires_auth": True,
            },
            {
                "path": "api/reviews/<int:pk>/update/",
                "method": "PUT/PATCH",
                "description": "Редактировать отзыв",
                "requires_auth": True,
            },
            {
                "path": "api/reviews/<int:pk>/delete/",
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