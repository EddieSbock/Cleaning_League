from django.contrib import admin
from .models import House, Profile, Task, Assignment, SubTask

admin.site.register(House)
admin.site.register(Profile)
admin.site.register(Task)
admin.site.register(Assignment)
admin.site.register(SubTask)