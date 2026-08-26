from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404

# Imports corregidos:
from .models import Report
from apps.postulations.models import Postulation  # ✅ Importa Postulation desde su app
from .serializers import ReportSerializer

# GET /api/reports/  |  GET/PUT/DELETE /api/reports/<id>/
class ReportListAPIView(generics.ListAPIView):
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Usamos id_postulation en lugar de postulation
        return Report.objects.filter(
            id_postulation__id_tester=user
        ) | Report.objects.filter(
            id_postulation__id_project__client=user
        )

class ReportDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'

# POST /api/postulations/<postulation_id>/reports/
# GET /api/postulations/<postulation_id>/reports/
class PostulationReportListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        postulation_id = self.kwargs['postulation_id']
        return Report.objects.filter(id_postulation=postulation_id)

    def perform_create(self, serializer):
        postulation_id = self.kwargs['postulation_id']
        postulation = get_object_or_404(Postulation, pk=postulation_id)
        serializer.save(id_postulation=postulation)
