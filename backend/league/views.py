from rest_framework import viewsets
from .models import House, Profile, Task
from .serializers import HouseSerializer, ProfileSerializer, TaskSerializer

class HouseViewSet(viewsets.ModelViewSet):
    queryset = House.objects.all()
    serializer_class = HouseSerializer

class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer