from pymongo import MongoClient
from django.conf import settings


client = MongoClient(settings.MONGODB_URI)

db=client[settings.MONGODB_DATABASE]

reports_collection = db['reports']

"""
Example document structure:
{
    "_id":"...",
    "id_postulation": "...",
    "title": "...",
    "description": "...",
    "steps_to_reproduce": "...",
    "risk_level": "...",
    "capture_evidence": "...",
    "created_at": "...",
    "updated_at": "...",
    "state": "...",
}

"""