# backend/core/views.py

import logging
import os

from django.conf import settings
from django.db.models import Q
from django.http import FileResponse, JsonResponse
from rest_framework import viewsets
from rest_framework.decorators import action

from core.models import Message

from .serializers import MessageSerializer

logger = logging.getLogger(__name__)


class MessageViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing messages
    """

    queryset = Message.objects.select_related("user", "group").all()
    serializer_class = MessageSerializer

    lookup_url_kwarg = "message_id"

    def get_queryset(self):
        queryset = super().get_queryset()

        group_param = self.request.query_params.get("group")
        if group_param:
            queryset = queryset.filter(
                Q(group__title=group_param) | Q(group__name=group_param)
            )

        user_param = self.request.query_params.get("user")
        if user_param:
            queryset = queryset.filter(
                Q(user__full_name=user_param)
                | Q(user__first_name=user_param)
                | Q(user__username=user_param)
            )

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(text__icontains=search)

        date_from = self.request.query_params.get("date_from")
        if date_from:
            queryset = queryset.filter(telegram_created_at__gte=date_from)

        date_to = self.request.query_params.get("date_to")
        if date_to:
            queryset = queryset.filter(telegram_created_at__lte=date_to)

        sentiment = self.request.query_params.get("sentiment")
        if sentiment:
            queryset = queryset.filter(sentiment=sentiment)

        return queryset.order_by("-telegram_created_at")

    @action(detail=True, methods=["get"], url_path="file")
    def file(self, request, message_id=None):
        """
        Download file
        URL: /api/messages/<message_id>/file/
        """
        logger.info(f"File request for message_id={message_id}")

        try:
            message = self.get_object()
            logger.info(
                f"Found message: {message.message_id}, media_type={message.media_type}"
            )

            if not message.media_file_path:
                logger.warning(f"No media_file_path for message {message_id}")
                return JsonResponse({"error": "Media yo'q"}, status=404)

            if not os.path.isabs(message.media_file_path):
                file_path = os.path.join(settings.MEDIA_ROOT, message.media_file_path)
            else:
                file_path = message.media_file_path

            logger.info(f"File path: {file_path}")

            if not os.path.exists(file_path):
                logger.error(f"File not found: {file_path}")
                return JsonResponse({"error": "Fayl topilmadi"}, status=404)

            content_types = {
                "photo": "image/jpeg",
                "video": "video/mp4",
                "voice": "audio/ogg",
                "audio": "audio/mpeg",
                "document": "application/octet-stream",
                "sticker": "image/webp",
            }

            return FileResponse(
                open(file_path, "rb"),
                content_type=content_types.get(
                    message.media_type, "application/octet-stream"
                ),
                as_attachment=True,
                filename=message.media_file_name or os.path.basename(file_path),
            )

        except Message.DoesNotExist:
            logger.error(f"Message {message_id} not found")
            return JsonResponse({"error": "Xabar topilmadi"}, status=404)
        except Message.MultipleObjectsReturned:
            logger.error(f"Multiple messages with message_id={message_id}")
            return JsonResponse({"error": "Duplicate xabar"}, status=500)
        except Exception as e:
            logger.exception(f"Error: {str(e)}")
            return JsonResponse({"error": str(e)}, status=500)

    @action(detail=True, methods=["get"], url_path="media-url")
    def media_url(self, request, message_id=None):
        """
        Get media URL
        URL: /api/messages/<message_id>/media-url/
        """
        try:
            message = self.get_object()

            if not message.media_file_path:
                return JsonResponse({"error": "Media yo'q"}, status=404)

            if not os.path.isabs(message.media_file_path):
                file_path = os.path.join(settings.MEDIA_ROOT, message.media_file_path)
            else:
                file_path = message.media_file_path

            if not os.path.exists(file_path):
                return JsonResponse({"error": "Fayl topilmadi"}, status=404)

            if message.media_file_path.startswith(settings.MEDIA_ROOT):
                relative_path = os.path.relpath(
                    message.media_file_path, settings.MEDIA_ROOT
                )
            else:
                relative_path = message.media_file_path

            media_url = f"{settings.MEDIA_URL}{relative_path}"
            host = request.get_host()
            scheme = "https" if request.is_secure() else "http"
            full_url = f"{scheme}://{host}{media_url}"

            return JsonResponse(
                {
                    "url": full_url,
                    "media_type": message.media_type,
                    "file_name": message.media_file_name,
                    "file_size": message.media_file_size,
                }
            )

        except Message.DoesNotExist:
            return JsonResponse({"error": "Xabar topilmadi"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
