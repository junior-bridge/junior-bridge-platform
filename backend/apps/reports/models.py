from django.db import models
from apps.postulations.models import Postulation

class Report(models.Model):
    id_postulation = models.ForeignKey(Postulation, on_delete=models.CASCADE, related_name='reports')
    title = models.CharField(max_length=200)
    description = models.TextField()
    risk_level = models.CharField(max_length=20, default='LOW')
    steps_to_reproduce = models.JSONField(default=list, blank=True, null=True)
    capture_evidence = models.URLField(blank=True, null=True)
    state = models.CharField(max_length=20, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.risk_level}"