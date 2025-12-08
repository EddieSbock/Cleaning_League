from django.db import models
from django.contrib.auth.models import User
import uuid

class House(models.Model):
    name = models.CharField(max_length=40, verbose_name="Nome Casa")
    invite_code = models.CharField(max_length=10, unique=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Amministratore della casa
    admin = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='managed_houses')

    def __str__(self):
        return f"{self.name} (Admin: {self.admin.username})"


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    house = models.ForeignKey(House, on_delete=models.SET_NULL, null=True, blank=True, related_name='members')
    
    nickname = models.CharField(max_length=30, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    
    total_xp = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    
    def __str__(self):
        return self.nickname if self.nickname else self.user.username


class Task(models.Model):
    house = models.ForeignKey(House, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    xp_reward = models.IntegerField(default=50)
    xp_penalty = models.IntegerField(default=20)
    
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
        ('COMPLETED', 'Completata (Attesa Conferma)'),
        ('VERIFIED', 'Verificata (Punti Assegnati)'),
        ('FAILED', 'Fallita (Malus)'),
    ]

    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    assigned_to = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='assignments')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='TODO')
    
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    verified_by = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, blank=True, related_name='verifications')

    def __str__(self):
        return f"{self.task.title} -> {self.assigned_to.nickname}"