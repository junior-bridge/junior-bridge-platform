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
    


class ProjectAudit(models.Model):
    """Result of a Google PageSpeed Insights audit of a project's demo URL."""

    class Strategy(models.TextChoices):
        MOBILE = "MOBILE", "Mobile"
        DESKTOP = "DESKTOP", "Desktop"

    class Status(models.TextChoices):
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='audits')
    requested_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='project_audits',
    )
    strategy = models.CharField(max_length=10, choices=Strategy.choices, default=Strategy.MOBILE)
    status = models.CharField(max_length=10, choices=Status.choices)
    # Lighthouse category scores normalized to 0-100; null when not reported.
    performance = models.PositiveSmallIntegerField(null=True, blank=True)
    accessibility = models.PositiveSmallIntegerField(null=True, blank=True)
    best_practices = models.PositiveSmallIntegerField(null=True, blank=True)
    seo = models.PositiveSmallIntegerField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at', '-id']

    def __str__(self):
        return f"{self.project} - {self.strategy} ({self.status})"
