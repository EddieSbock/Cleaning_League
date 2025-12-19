from rest_framework import viewsets, status, generics, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from .models import House, Profile, Task, GameSession, Assignment, Rating
from .serializers import HouseSerializer, ProfileSerializer, TaskSerializer, GameSessionSerializer,AssignmentSerializer, RatingSerializer, RegisterSerializer

class HouseViewSet(viewsets.ModelViewSet):
    queryset = House.objects.all()
    serializer_class = HouseSerializer
    
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
        return Response({
            'message': f'Benvenuto in {house.name}!',
            'house_id': house.id
        }, status=status.HTTP_200_OK)

class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer

class TaskViewSet(viewsets.ModelViewSet):
    permission_class=[permissions.IsAuthenticated] #classe di sicurezza fornita da Django.
    #si assicura che l'utente sia loggato prima di valutare.
    serializer_class = TaskSerializer
    
    def queryset (self):
        queryset = Task.objects.all() 
        user_profile = self.request.user.profile 

        status_param = self.request.query_params.get('status') 
        needs_rating = self.request.query_params.get('needs_rating') 

        # controlla se ci sono delle task da votare
        if status_param == 'completed' and needs_rating == 'true':
            
            # filtra solo task completate
            queryset = queryset.filter(is_completed=True)

            # esclude la propria task 
            # usare lo stesso relatd_name dei models
            queryset = queryset.exclude(assignments__assigned_to=user_profile)

            # eslude le task già votate
            # cerca gli ID delle task che hanno un voto dato dal proprio profilo
            voted_task_ids = Rating.objects.filter(voter=user_profile).values_list('task_id', flat=True)
            queryset = queryset.exclude(id__in=voted_task_ids)

        return queryset
    
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
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer