from rest_framework import serializers
from .models import House, Profile, Task, SubTask, GameSession, Assignment, Rating
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']
        
class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['nickname', 'level', 'total_xp']
        
class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'password', 'email',)
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # Crea l'utente salvando la password criptata
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email', ''),
        )
        Profile.objects.create(
            user=user, 
            nickname=user.username, 
            level=1, 
            total_xp=0
        )
        return user

class SubTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubTask
        fields = ['id', 'description']

class TaskSerializer(serializers.ModelSerializer):
    
    subtasks = SubTaskSerializer(many=True, read_only=True) # Include le subtask nel serializer principale
    
    taken_seats = serializers.IntegerField(source='assignments.count', read_only=True)
    is_taken_by_me = serializers.SerializerMethodField()
    session_start = serializers.DateTimeField(source='session.start_time', read_only=True)
    session_end = serializers.DateTimeField(source='session.end_time', read_only=True)
    

    class Meta:
        model = Task
        fields = '__all__'
        
    def get_is_taken_by_me(self, obj):
    
        request = self.context.get('request')
        if request and hasattr(request.user, 'profile'):
        
            return obj.assignment_set.filter(assigned_to=request.user.profile).exists()
        return False

class TaskCreateSerializer(serializers.ModelSerializer):
    subtasks = SubTaskSerializer(many=True, required=False)

    class Meta:
        model = Task
        fields = ['session','title','description','xp_reward','max_users','deadline', 'subtasks']

    def create(self, validated_data):
        
        subtasks_data = validated_data.pop('subtasks', [])
        
        task = Task.objects.create(**validated_data)
        
        for sub_data in subtasks_data:
            SubTask.objects.create(task=task, **sub_data)
            
        return task
        
class GameSessionSerializer(serializers.ModelSerializer):

    tasks = TaskSerializer(many=True, read_only=True)
    
    duration_hours = serializers.ReadOnlyField()

    class Meta:
        model = GameSession
        fields = '__all__'

class HouseSerializer(serializers.ModelSerializer):
    admin_details = UserSerializer(source='admin', read_only=True)# per i dettagli dell'admin
    members = MemberSerializer(many=True, read_only=True)
    
    active_sessions = serializers.SerializerMethodField()
    
    class Meta:
        model = House
        fields = '__all__'
        
    def get_active_sessions(self, obj):
    
        sessions = obj.sessions.filter(is_active=True)
        return GameSessionSerializer(sessions, many=True).data

class ProfileSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = Profile
        fields = '__all__'
        
        read_only_fields = ['total_xp', 'level', 'user'] #per non far modificare agli utenti
        
class RatingSerializer(serializers.ModelSerializer):

    voter_details = serializers.ReadOnlyField(source='voter.nickname')
    
    stars = serializers.IntegerField(min_value=1, max_value=5)
    
    class Meta:
        model = Rating
        fields = '__all__'
    
        read_only_fields = ['voter']
        
class AssignmentSerializer(serializers.ModelSerializer):
    task_title = serializers.ReadOnlyField(source='task.title')
    assignee_name = serializers.ReadOnlyField(source='assigned_to.nickname')
    
    ratings = RatingSerializer(many=True, read_only=True)

    class Meta:
        model = Assignment
        fields = '__all__'
        read_only_fields = ['earned_xp', 'completed_at', 'status'] 