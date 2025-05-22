from rest_framework import generics, views
from .models import Banner, Product, Outfit
from .serializers import BannerSerializer, ProductSerializer, OutfitSerializer
from rest_framework.response import Response
import random

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