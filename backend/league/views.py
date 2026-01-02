from rest_framework import viewsets, status, generics, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth.models import User
from django.db.models import Q
from .models import House, Profile, Task, GameSession, Assignment, Rating
from .serializers import HouseSerializer, ProfileSerializer, TaskSerializer, GameSessionSerializer,AssignmentSerializer, RatingSerializer, RegisterSerializer, TaskCreateSerializer

class HouseViewSet(viewsets.ModelViewSet):
    serializer_class = HouseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        
        user = self.request.user
        if user.is_anonymous:
            return House.objects.none()
        
        return House.objects.filter(Q(members__user=user) | Q(admin=user)).distinct()

    def perform_create(self, serializer):
        try:
            print(f"Tentativo creazione casa per utente: {self.request.user}")
            
            
            house = serializer.save(admin=self.request.user)
            print(f"Casa creata: {house.name} (ID: {house.id})")

           
            profile, created = Profile.objects.get_or_create(
                user=self.request.user,
                defaults={
                    'nickname': self.request.user.username,
                    'level': 1,
                    'total_xp': 0
                }
            )
            
            if created:
                print(" Profilo creato al volo!")
            else:
                print("Profilo esistente trovato.")

            profile.house = house
            profile.save()
            print("Profilo collegato alla casa con successo.")

        except Exception as e:
        
            print(f"ERRORE CRITICO CREAZIONE CASA: {e}")
            
            raise e
    
    @action(detail=False, methods=['post'])
    def join(self, request):
        code = request.data.get('code') #prende il codice dal frontend
        
        if not code:
            return Response({'error': 'Codice mancante'}, status=status.HTTP_400_BAD_REQUEST)

        #cerca la casa con quel codice 
        try:
            house = House.objects.get(invite_code=code)
        except House.DoesNotExist:
            return Response({'error': 'Codice non valido o casa inesistente'}, status=status.HTTP_404_NOT_FOUND)

        #recupera il profilo dell'utente che sta facendo la richiesta
        try:
            profile = request.user.profile 
        except Profile.DoesNotExist:
            #crea un profilo sul momento se non ce l'ha 
            profile = Profile.objects.create(user=request.user)

        #assegna la casa al profilo
        profile.house = house
        profile.save()
        serializer = self.get_serializer(house)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ProfileViewSet(viewsets.ModelViewSet):
    
    def get_queryset(self):

        return Profile.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TaskCreateSerializer
        return TaskSerializer
    
    @action(detail=True, methods=['post'])
    def grab(self, request, pk=None):
        task = self.get_object()
        user_profile = request.user.profile # user che fa la richiesta
        
        # controlla se la sessione é attiva
        if not task.session.is_active:
             return Response({'error': 'La sessione è chiusa o scaduta!'}, status=400)

        # constolla se l'user ha gi preso la task
        already_assigned = Assignment.objects.filter(task=task, assigned_to=user_profile).exists()
        if already_assigned:
            return Response({'error': 'Hai già preso questa task!'}, status=400)
            
        # controlla se ci sono posti disponibili
        current_takers = Assignment.objects.filter(task=task).count()
        if current_takers >= task.max_assignees:
            return Response({'error': 'Posti esauriti per questa task!'}, status=400)

        Assignment.objects.create(
            task=task,
            assigned_to=user_profile,
            status='TODO'
        )
        
        return Response({'status': 'Task assegnata con successo!'})
    
class GameSessionViewSet(viewsets.ModelViewSet):
    queryset = GameSession.objects.all()
    serializer_class = GameSessionSerializer
    
class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer

    #API con: POST /api/assignments/{ID}/complete/
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        assignment = self.get_object()
        
    
        if assignment.status == 'COMPLETED':
            return Response({'error': 'Task già completata!'}, status=400)
            
        if assignment.assigned_to.user != request.user:
            return Response({'error': 'Non è la tua task!'}, status=403)

        points = assignment.calculate_score_now()
        return Response({
            'status': 'Task completata!',
            'earned_xp': points,
            'completed_at': assignment.completed_at
        })

class RatingViewSet(viewsets.ModelViewSet):
    queryset = Rating.objects.all()
    serializer_class = RatingSerializer

    def perform_create(self, serializer):
        #funziona solo se sei loggato 
        # Se per il test da errore commentare le righe sottostanti
        if hasattr(self.request.user, 'profile'):
            serializer.save(voter=self.request.user.profile)
        else:
            serializer.save()
            
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer