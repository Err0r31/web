from rest_framework import generics, views, permissions, status
from .models import Banner, Product, Outfit, User
from .serializers import BannerSerializer, ProductSerializer, OutfitSerializer, RegisterSerializer
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)


class LogoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

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
        recommended_products = Product.objects.filter(is_recommended=True).order_by('?')[:6]
        serializer = ProductSerializer(recommended_products, many=True, context={'request': request})
        return Response(serializer.data)
    

class OutfitListView(generics.ListAPIView):
    serializer_class = OutfitSerializer
    queryset = Outfit.objects.order_by('-created_at')[:4]