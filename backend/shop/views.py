from django.db import transaction, IntegrityError
from django.forms import ValidationError
from django.contrib.sessions.models import Session
from django.shortcuts import get_object_or_404
from django.db.models import Count, Sum, Avg
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import viewsets, generics, status, views
from rest_framework.decorators import action, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend
from .filters import ProductFilter
from .models import (
    Banner, Product, User, Order, Category, Review, Cart, CartItem, Favorite, ProductVariation
)
from .serializers import (
    BannerSerializer, ProductSerializer, OrderSerializer, RegisterSerializer,
    ReviewSerializer, CartSerializer, CartItemSerializer, FavoriteSerializer,
    ProductVariationSerializer, CategorySerializer, UserSerializer
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


class UserOrdersViewSet(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user=request.user).order_by('-order_date')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

class CategoryProductsViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    pagination_class = PageNumberPagination

    def get_queryset(self):
        category_slug = self.kwargs['category_slug']
        category = get_object_or_404(Category, slug=category_slug)
        return Product.active_objects.filter(categories=category)


class ProductListViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.active_objects.all()
    serializer_class = ProductSerializer
    filter_backends = [SearchFilter, DjangoFilterBackend]
    search_fields = ['name']
    filterset_class = ProductFilter
    pagination_class = PageNumberPagination

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance = Product.active_objects.prefetch_related('categories', 'reviews', 'variations', 'color_images').annotate(
            sold_quantity=Sum('variations__sold_quantity'),
            favorite_count=Count('favorited_by')
        ).get(pk=instance.pk)
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
            return Review.objects.filter(user=self.request.user).select_related('product', 'user')
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


class CartViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def get_cart(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return cart

    def list(self, request):
        cart = self.get_cart(request)
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def clear(self, request):
        cart = self.get_cart(request)
        cart.items.all().delete()
        return Response({'status': 'Корзина очищена'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def merge_cart(self, request):
        cart = self.get_cart(request)
        local_cart_items = request.data.get('items', [])
        
        for local_item in local_cart_items:
            variation_id = local_item.get('variation_id')
            quantity = local_item.get('quantity', 1)
            
            if not variation_id or not quantity:
                continue
                
            try:
                variation = ProductVariation.objects.get(id=variation_id)
                if not variation.is_available(quantity):
                    continue
                
                existing_item = cart.items.filter(variation=variation).first()
                if existing_item:
                    new_quantity = min(
                        existing_item.quantity + quantity,
                        variation.stock 
                    )
                    existing_item.quantity = new_quantity
                    existing_item.save()
                else:
                    CartItem.objects.create(
                        cart=cart,
                        variation=variation,
                        quantity=min(quantity, variation.stock)
                    )
            except ProductVariation.DoesNotExist:
                continue  
                
        serializer = CartSerializer(cart)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @method_decorator(csrf_exempt)
    def create(self, request):
        cart = self.get_cart(request)
        serializer = CartItemSerializer(data=request.data, context={'cart': cart})
        if serializer.is_valid():
            serializer.save(cart=cart)
            cart_serializer = CartSerializer(cart)
            return Response(cart_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None):
        try:
            cart = self.get_cart(request)
            item = cart.items.get(id=pk)
            serializer = CartItemSerializer(item, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                cart_serializer = CartSerializer(cart)
                return Response(cart_serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except CartItem.DoesNotExist:
            return Response(
                {'error': 'Элемент корзины не найден'},
                status=status.HTTP_404_NOT_FOUND
            )
        
    def destroy(self, request, pk=None):
        try:
            cart = self.get_cart(request)
            item = cart.items.get(id=pk)
            item.delete()
            cart_serializer = CartSerializer(cart)
            return Response(cart_serializer.data)
        except CartItem.DoesNotExist:
            return Response(
                {'error': 'Элемент корзины не найден'},
                status=status.HTTP_404_NOT_FOUND
            )


class FavoriteViewSet(viewsets.ModelViewSet):
    queryset = Favorite.objects.all()
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).select_related('product')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ProductVariationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ProductVariation.objects.all()
    serializer_class = ProductVariationSerializer
    permission_classes = [AllowAny]


class RandomReviewsView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        random_reviews = Review.objects.select_related('product', 'user').order_by('?')[:4]
        total_reviews = Review.objects.aggregate(total=Count('id'))['total']
        serializers = ReviewSerializer(random_reviews, many=True, context={'request': request})
        return Response({
            'reviews': serializers.data,
            'total_reviews': total_reviews
        })
    

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminUser]

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()


class CategoryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        categories = Category.objects.all().order_by('name')
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)
    
class AdminOrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().select_related('user').prefetch_related('items')
    serializer_class = OrderSerializer
    permission_classes = [IsAdminUser]

    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response({'error': 'Недопустимый статус.'}, status=status.HTTP_400_BAD_REQUEST)
        order.status = new_status
        order.save()
        return Response({'success': 'Статус обновлен.'}, status=status.HTTP_200_OK)

    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        try:
            order.cancel_order()
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'success': 'Заказ отменен.'}, status=status.HTTP_200_OK)
    

class UserManagementViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

    @action(detail=True, methods=['patch'])
    def toggle_block(self, request, pk=None):
        user = self.get_object()
        user.is_active = request.data.get('is_active', not user.is_active)
        user.save()
        return Response({'status': 'User status updated'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['patch'])
    def toggle_admin(self, request, pk=None):
        user = self.get_object()
        user.is_staff = request.data.get('is_staff', not user.is_staff)
        user.save()
        return Response({'status': 'User role updated'}, status=status.HTTP_200_OK)
    

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class CreateOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        cart = Cart.objects.get(user=request.user)
        if not cart.items.exists():
            return Response({'error': 'Корзина пуста'}, status=status.HTTP_400_BAD_REQUEST)

        items_data = [
            {'variation': item.variation, 'quantity': item.quantity}
            for item in cart.items.all()
        ]
        order_data = {
            'items': items_data,
            'payment_method': request.data.get('payment_method', 'card'),
        }
        serializer = OrderSerializer(data=order_data, context={'request': request})
        if serializer.is_valid():
            with transaction.atomic():
                order = serializer.save()
                cart.items.all().delete()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)