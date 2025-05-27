from django.forms import ValidationError
from rest_framework import viewsets, generics, status, views
from rest_framework.filters import SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import IntegrityError
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
        try:
            product_id = self.kwargs.get('product_pk')
            product = get_object_or_404(Product, pk=product_id)
            serializer.save(user=self.request.user, product=product)
        except IntegrityError as e:
            raise ValidationError({
                'non_field_errors': 'Вы уже оставили отзыв на этот продукт.'
            }) 


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
