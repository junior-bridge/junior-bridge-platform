from django.db import models

# Create your models here.

class Proyect(models.Model):
    STATE = [
        ("PENDING", "Pending"),
        ("OPEN", "Open"),
        ("IN_PROGRESS", "In Progress"),
        ("IN_REVIEW", "In Review"),
        ("COMPLETED", "Completed"),
        ("REJECTED", "Rejected"),
    ]

    MODALITY = [
        ("REMOTE", "Remote"),
        ("ON_SITE", "On Site"),
        ("HYBRID", "Hybrid"),
    ]

    title = models.CharField(max_length=100)
    description = models.TextField()
    repository = models.URLField()
    demo_url = models.URLField()
    technologies = models.TextField()
    modality = models.CharField(max_length=20, choices=MODALITY)
    # Provisorio: confirmar con el equipo el ciclo de estados del proyecto.
    state = models.CharField(max_length=20, choices=STATE, default="PENDING")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    finalized_at = models.DateTimeField(null=True, blank=True)
    client = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='proyects_created')

    def __str__(self):
        return self.title
    
class Postulation(models.Model):
    States = [
        ("PENDING", "Pending"),
        ("ACCEPTED", "Accepted"),
        ("REJECTED", "Rejected"),
    ]
    proyect = models.ForeignKey(Proyect, on_delete=models.CASCADE, related_name='postulations')
    tester = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='postulations')
    state=models.CharField(max_length=20, choices=States, default="PENDING")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    finalized_at = models.DateTimeField(null=True, blank=True)
    def __str__(self):
        return f"{self.tester.name} - {self.proyect.title}"

class Work(models.Model):
    STATES = [
        ("PENDING", "Pending"),
        ("IN_PROGRESS", "In Progress"),
        ("COMPLETED", "Completed"),]
    postulation = models.ForeignKey(Postulation, on_delete=models.CASCADE, related_name='works')
    state = models.CharField(max_length=20, choices=STATES, default="PENDING")
    calification = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    finalized_at = models.DateTimeField(null=True, blank=True)
    def __str__(self):
        return f"Work #{self.id}"
