from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404

from .models import Report
from apps.postulations.models import Postulation
from .serializers import ReportSerializer

class ReportListAPIView(generics.ListAPIView):
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
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
class PostulationReportListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        postulation_id = self.kwargs['postulation_id']
        return Report.objects.filter(id_postulation_id=postulation_id)

    def perform_create(self, serializer):
        postulation_id = self.kwargs['postulation_id']
        postulation = get_object_or_404(Postulation, pk=postulation_id)
        serializer.save(id_postulation=postulation)