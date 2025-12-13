from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HouseViewSet, ProfileViewSet, TaskViewSet, GameSessionViewSet, AssignmentViewSet, RatingViewSet

router = DefaultRouter() #per crare automaticamente gli url delle altre pagine
router.register(r'houses', HouseViewSet)
router.register(r'profiles', ProfileViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'sessions', GameSessionViewSet)
router.register(r'assignments', AssignmentViewSet)
router.register(r'ratings', RatingViewSet)

urlpatterns = [
    path('', include(router.urls)),
]