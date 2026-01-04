from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import HouseViewSet, ProfileViewSet, TaskViewSet, GameSessionViewSet, AssignmentViewSet, RatingViewSet, RegisterView

router = DefaultRouter() #per crare automaticamente gli url delle altre pagine
router.register(r'houses', HouseViewSet, basename='house')
router.register(r'profiles', ProfileViewSet, basename='profile')
router.register(r'tasks', TaskViewSet)
router.register(r'sessions', GameSessionViewSet)
router.register(r'assignments', AssignmentViewSet, basename='assignment')
router.register(r'ratings', RatingViewSet)


urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
