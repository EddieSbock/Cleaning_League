from rest_framework import serializers
from .models import House, Profile, Task, SubTask, Assignment
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class SubTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubTask
        fields = ['id', 'description']

class TaskSerializer(serializers.ModelSerializer):
    
    subtasks = SubTaskSerializer(many=True, read_only=True) # Include le subtask nel serializer principale

    class Meta:
        model = Task
        fields = '__all__'

class HouseSerializer(serializers.ModelSerializer):
    admin_details = UserSerializer(source='admin', read_only=True)# per i dettagli dell'admin
    
    class Meta:
        model = House
        fields = '__all__'

class ProfileSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = Profile
        fields = '__all__'