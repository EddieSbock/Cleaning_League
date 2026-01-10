from rest_framework import viewsets, status, generics, permissions
from rest_framework.response import Response
from django.utils import timezone
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
    
    @action(detail=False, methods=['post'])
    def leave(self, request):
        try:
        
            profile = request.user.profile
            
            
            if not profile.house:
                return Response({'error': 'Non fai parte di nessuna casa!'}, status=status.HTTP_400_BAD_REQUEST)

            
            if profile.house.admin == request.user:
                house_to_delete = profile.house
                profile.house = None
                profile.save()
                house_to_delete.delete()
                return Response({'message': f'Essendo l\'admin, hai sciolto la casa {house_name}.'}, status=status.HTTP_200_OK)
        
            house_name = profile.house.name
            profile.house = None
            profile.save()

            return Response({'message': f'Hai abbandonato {house_name} con successo.'}, status=status.HTTP_200_OK)

        except Profile.DoesNotExist:
            return Response({'error': 'Profilo utente non trovato.'}, status=status.HTTP_404_NOT_FOUND)

class ProfileViewSet(viewsets.ModelViewSet):
    
    def get_queryset(self):

        return Profile.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

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
        if current_takers >= task.max_users:
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

    def get_queryset(self):
        user = self.request.user
        
        if self.action in ['rate', 'session_recap']:
            
            if hasattr(user, 'profile') and user.profile.house:
                return Assignment.objects.filter(task__session__house=user.profile.house)
            return Assignment.objects.none()

        return Assignment.objects.filter(
            assigned_to__user=user,
            completed_at__isnull=True 
        )
    serializer_class = AssignmentSerializer


    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        assignment = self.get_object()
        
        assignment.completed_at = timezone.now()
    
        if assignment.status == 'COMPLETED':
            return Response({'error': 'Task già completata!'}, status=400)
            
        if assignment.assigned_to.user != request.user:
            return Response({'error': 'Non è la tua task!'}, status=403)
        
        assignment.status = 'COMPLETED'
        assignment.save() 
        
        return Response({
            'status': 'Task completata!',
            'earned_xp': assignment.earned_xp,
            'completed_at': assignment.completed_at
        })
        
    @action(detail=False, methods=['get'])
    def session_recap(self, request):
        user = request.user
        if not hasattr(user, 'profile') or not user.profile.house:
            return Response([])
        
        house = user.profile.house
        last_session = GameSession.objects.filter(house=house).order_by('id').last()
        
        if not last_session:
            return Response([])
        
        completed_assignments = Assignment.objects.filter(
            task__session=last_session,
            status='COMPLETED'
        ).order_by('-completed_at')
        
        from .serializers import AssignmentVotingSerializer 
        
        serializer = AssignmentVotingSerializer(completed_assignments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def rate(self, request, pk=None):
        assignment = self.get_object()
        
        try:
            assignment = Assignment.objects.get(pk=pk)
        except Assignment.DoesNotExist:
             return Response({'error': 'Assignment non trovato'}, status=404)

        voter = request.user.profile
        
        if assignment.assigned_to == voter:
            return Response({'error': 'Non puoi votarti da solo!'}, status=400)

        stars = request.data.get('stars')
        comment = request.data.get('comment', '')

        if not stars:
             return Response({'error': 'Devi dare un voto in stelle'}, status=400)

        try:
            Rating.objects.create(
                voter=voter,
                assignment=assignment,
                stars=stars,
                comment=comment
            )
            return Response({'status': 'Voto registrato!'})
        except Exception as e:
            return Response({'error': 'Hai già votato questa task.'}, status=400)
        
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