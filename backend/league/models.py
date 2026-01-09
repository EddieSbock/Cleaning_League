from django.db import models
from django.contrib.auth.models import User
import django.utils.timezone as timezone
from django.db.models.signals import post_save
from django.dispatch import receiver
import random
import string
from django.core.validators import MinValueValidator, MaxValueValidator
import math

def generate_invite_code(length=8):
    characters = string.ascii_letters + string.digits    
    return ''.join(random.choice(characters) for _ in range(length))

class House(models.Model):
    name = models.CharField(max_length=40, verbose_name="Nome Casa")
    invite_code = models.CharField(max_length=8, unique=True, default=generate_invite_code, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Amministratore della casa
    admin = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='managed_houses')

    def __str__(self):
        if self.admin:
            return f"{self.name} (Admin: {self.admin.username})"
        return f"{self.name} (Admin: Nessuno)"


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    house = models.ForeignKey(House, on_delete=models.SET_NULL, null=True, blank=True, related_name='members')
    
    nickname = models.CharField(max_length=30, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    
    total_xp = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    
    def update_level(self):

        new_level = int(math.sqrt(self.total_xp / 100)) + 1
        if new_level > self.level:
            self.level = new_level
            self.save()
            
    def __str__(self):
        return self.nickname if self.nickname else self.user.username
    
class GameSession(models.Model):
    house = models.ForeignKey(House, on_delete=models.CASCADE, related_name='sessions')
    name = models.CharField(max_length=50, default="Sessione di Pulizie")
    
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    
    max_speed_bonus = models.IntegerField(default=50, help_text="Bonus massimo all'inizio della sessione")
    
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')})"

    @property
    def duration_hours(self):
        diff = self.end_time - self.start_time #calcola quanto dura la sessione in ore
        return diff.total_seconds() / 3600


class Task(models.Model):
    session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='tasks')
    
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    xp_reward = models.IntegerField(default=50)
    
    is_completed = models.BooleanField(default=False)
    
    available_from = models.DateTimeField(null=True, blank=True, help_text="Inizio finestra temporale")

    deadline = models.DateTimeField(null=True, blank=True, help_text="Scadenza task")
   
    # Numero massimo utenti per task
    max_users = models.IntegerField(default=1, help_text="Quante persone possono prendere questa task")
    
    def __str__(self):
        status = "✓" if self.is_completed else "✗"
        return f"{status} {self.title} (Scade: {self.deadline})"


# Obiettivi secondari
class SubTask(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='subtasks')
    description = models.CharField(max_length=200, help_text="Es. Pulire il lavandino")
    
    is_completed = models.BooleanField(default=False)
    
    def __str__(self):
        status = "✓" if self.is_completed else "✗"
        return f"{status} {self.description}"


# Compito assegnato
class Assignment(models.Model):
    STATUS_CHOICES = [
        ('TODO', 'Da Fare'),
        ('IN_PROGRESS', 'In Corso'),
        ('COMPLETED', 'Completata'),
    ]

    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    assigned_to = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='assignments')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='TODO')
    
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    
    completed_at = models.DateTimeField(null=True, blank=True)
    
    earned_xp = models.IntegerField(default=0, help_text="Punti finali calcolati")

    def calculate_bonus(self):

        if not self.completed_at:
            self.completed_at = timezone.now()
            
        session = self.task.session
        now = self.completed_at
        
        score = self.task.xp_reward
        
        if now <= session.end_time:
            total_duration = (session.end_time - session.start_time).total_seconds()
            total_duration = max(1, total_duration)
        
            time_elapsed = (now - session.start_time).total_seconds()
            time_elapsed = max(0, time_elapsed)
            
        
            fraction_left = 1 - (time_elapsed / total_duration)
            fraction_left = max(0, fraction_left)
            
            bonus = int(session.max_speed_bonus * fraction_left)
            score = score + bonus
        
        self.earned_xp = score
        return score
    
    def save(self, *args, **kwargs):
        
        if self.pk:
            try:
                old_assignment = Assignment.objects.get(pk=self.pk)
                old_status = old_assignment.status
            except Assignment.DoesNotExist:
                old_status = 'TODO' 
            
            
            if self.status == 'COMPLETED' and old_status != 'COMPLETED':
                
                self.calculate_bonus()
                
             
                profile = self.assigned_to
               
                profile.total_xp += self.earned_xp
                
                new_level = int(math.sqrt(profile.total_xp / 100)) + 1
                if new_level > profile.level:
                    profile.level = new_level
                profile.save() 
                
                print(f"Punti assegnati a {profile.nickname}: {self.earned_xp} XP. Livello aggiornato a {profile.level}")

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.task.title} -> {self.assigned_to.nickname} ({self.status})"
    
class Rating(models.Model):
    
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='ratings')
    voter = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='votes_given')
    
    stars = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True, help_text="Opzionale: commento sulla pulizia")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:

        unique_together = ('assignment', 'voter') #un utente può votare una singola volta per assignment

    def __str__(self):
        return f"{self.voter.nickname} ha dato {self.stars} stelle a {self.assignment.task.title}"