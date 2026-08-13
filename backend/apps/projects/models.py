from django.db import models

# Create your models here.

class Project(models.Model):
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
    state = models.CharField(max_length=20, choices=STATE, default="PENDING")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    finalized_at = models.DateTimeField(null=True, blank=True)
    client = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='projects_created')

    def __str__(self):
        return self.title
    
