# telegram_bot/views.py
# ✅ FIXED IMPORTS

import json
import logging
import os
from datetime import datetime

import requests
from django.conf import settings
from django.db.models import Count
from django.http import FileResponse, HttpResponse, JsonResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

# ✅ CORRECT IMPORT - from analytics, not telegram_bot
from analytics.gemini_ai import analyze_sentiment_batch
from core.models import Message, MessageHistory, TelegramGroup, TelegramUser
from telegram_bot.serializers import MessageSerializer

logger = logging.getLogger(__name__)


@api_view(["POST"])
def telegram_webhook(request):
    """Telegram bot'dan kelgan xabarlarni qabul qilish"""
    try:
        data = request.data
        event_type = data.get("event_type", "new_message")
        is_edited = data.get("is_edited", False)

        logger.info(
            f"📥 Webhook: event_type={event_type}, is_edited={is_edited}, message_id={data.get('message_id')}"
        )

        # User yaratish yoki yangilash
        user, created = TelegramUser.objects.update_or_create(
            telegram_id=data.get("sender_id"),
            defaults={
                "username": data.get("sender_username"),
                "first_name": data.get("sender_first_name"),
                "last_name": data.get("sender_last_name"),
                "is_bot": data.get("is_bot", False),
            },
        )

        # Group yaratish yoki yangilash
        group, created = TelegramGroup.objects.update_or_create(
            telegram_id=data.get("group_id"),
            defaults={
                "title": data.get("group_name"),
            },
        )

        # Reply to message topish
        reply_to = None
        if data.get("reply_to_message_id"):
            try:
                reply_to = Message.objects.get(
                    message_id=data.get("reply_to_message_id"), group=group
                )
            except Message.DoesNotExist:
                logger.warning(
                    f"Reply to message topilmadi: {data.get('reply_to_message_id')}"
                )

        # Telegram timestamps
        telegram_created_at = datetime.fromisoformat(data.get("telegram_created_at"))
        telegram_edited_at = None
        if data.get("telegram_edited_at"):
            telegram_edited_at = datetime.fromisoformat(data.get("telegram_edited_at"))

        # Agar edit bo'lsa, eski textni saqlaymiz
        old_text = None
        if event_type == "edited_message" or is_edited:
            try:
                existing_message = Message.objects.get(
                    message_id=data.get("message_id"), group=group
                )
                old_text = existing_message.text
            except Message.DoesNotExist:
                pass

        # Message yaratish yoki yangilash
        message, created = Message.objects.update_or_create(
            message_id=data.get("message_id"),
            group=group,
            defaults={
                "user": user,
                "text": data.get("message_text"),
                "media_type": data.get("media_type", "text"),
                "media_file_id": data.get("media_file_id"),
                "media_file_unique_id": data.get("media_file_unique_id"),
                "media_file_size": data.get("media_file_size"),
                "media_mime_type": data.get("media_mime_type"),
                "media_file_path": data.get("media_file_path"),
                "media_file_name": data.get("media_file_name"),
                "reply_to_message_id": data.get("reply_to_message_id"),
                "reply_to": reply_to,
                "forward_from_user_id": data.get("forward_from_user_id"),
                "forward_from_chat_id": data.get("forward_from_chat_id"),
                "raw_json": json.loads(data.get("raw_json", "{}")),
                "is_edited": is_edited or (event_type == "edited_message"),
                "telegram_created_at": telegram_created_at,
                "telegram_edited_at": telegram_edited_at,
            },
        )

        # Edit history yaratish
        if (event_type == "edited_message" or is_edited) and old_text is not None:
            MessageHistory.objects.create(
                message=message,
                old_text=old_text,
                new_text=data.get("message_text"),
                edit_metadata={
                    "edited_at": (
                        telegram_edited_at.isoformat() if telegram_edited_at else None
                    ),
                    "event_type": event_type,
                },
            )
            logger.info(f"📝 Edit history saqlandi: {message.message_id}")

        if created:
            logger.info(f"✅ Yangi message saqlandi: {message.message_id}")
        else:
            if event_type == "edited_message" or is_edited:
                logger.info(
                    f"✏️ Message tahrirlandi: {message.message_id}, is_edited={message.is_edited}"
                )
            else:
                logger.info(f"♻️ Message yangilandi: {message.message_id}")

        return Response(
            {
                "status": "success",
                "message_id": message.message_id,
                "created": created,
                "event_type": event_type,
                "is_edited": message.is_edited,
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        logger.error(f"❌ Webhook xato: {str(e)}", exc_info=True)
        return Response(
            {"status": "error", "message": str(e)}, status=status.HTTP_400_BAD_REQUEST
        )


# telegram_bot/views.py da


@api_view(["GET"])
def get_message_history(request, message_id):
    """Xabar tahrir tarixini olish"""
    try:
        # ✅ Handle duplicates - get latest
        message = Message.objects.filter(message_id=message_id).order_by("-id").first()

        if not message:
            return Response(
                {"status": "error", "message": "Message not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        history = MessageHistory.objects.filter(message=message).order_by("-edited_at")

        data = [
            {
                "id": h.id,
                "old_text": h.old_text,
                "new_text": h.new_text,
                "edited_at": h.edited_at.isoformat(),
                "edit_metadata": h.edit_metadata,
            }
            for h in history
        ]

        return Response(
            {
                "status": "success",
                "message_id": message_id,
                "history": data,
                "count": len(data),
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        logger.error(f"❌ Error getting message history: {e}")
        return Response(
            {"status": "error", "message": str(e)}, status=status.HTTP_400_BAD_REQUEST
        )


@api_view(["POST"])
def mark_message_deleted(request, message_id):
    """Xabarni o'chirilgan deb belgilash"""
    try:
        message = Message.objects.get(message_id=message_id)
        message.is_deleted = True
        message.save()

        logger.info(f"🗑️ Message {message_id} o'chirilgan deb belgilandi")

        return Response(
            {
                "status": "success",
                "message": "Message marked as deleted",
                "message_id": message_id,
            },
            status=status.HTTP_200_OK,
        )

    except Message.DoesNotExist:
        return Response(
            {"status": "error", "message": "Message not found"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        logger.error(f"❌ Error marking message as deleted: {e}")
        return Response(
            {"status": "error", "message": str(e)}, status=status.HTTP_400_BAD_REQUEST
        )


@api_view(["POST"])
def bulk_mark_deleted(request):
    """Ko'p xabarlarni o'chirilgan deb belgilash"""
    try:
        message_ids = request.data.get("message_ids", [])

        if not message_ids:
            return Response(
                {"status": "error", "message": "No message IDs provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated = Message.objects.filter(message_id__in=message_ids).update(
            is_deleted=True
        )

        logger.info(f"🗑️ {updated} ta message o'chirilgan deb belgilandi")

        return Response(
            {
                "status": "success",
                "message": f"{updated} messages marked as deleted",
                "count": updated,
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        logger.error(f"❌ Error in bulk delete: {e}")
        return Response(
            {"status": "error", "message": str(e)}, status=status.HTTP_400_BAD_REQUEST
        )


# ============================================
# ✅ MEDIA FILE HANDLERS
# ============================================


@api_view(["GET"])
def get_telegram_file(request, message_id):
    """Download/serve media file"""
    try:
        logger.info(f"📥 File request for message_id={message_id}")
        message = Message.objects.filter(message_id=message_id).order_by("-id").first()

        if not message:
            return JsonResponse({"error": "Xabar topilmadi"}, status=404)

        # Check if has local file
        has_file_path = hasattr(message, "media_file_path")

        # METHOD 1: Serve from local file
        if has_file_path and message.media_file_path:
            if not os.path.isabs(message.media_file_path):
                file_path = os.path.join(settings.MEDIA_ROOT, message.media_file_path)
            else:
                file_path = message.media_file_path

            if os.path.exists(file_path):
                logger.info(f"✅ Serving local file: {file_path}")

                content_types = {
                    "photo": "image/jpeg",
                    "video": "video/mp4",
                    "voice": "audio/ogg",
                    "audio": "audio/mpeg",
                    "document": "application/octet-stream",
                    "sticker": "image/webp",
                    "animation": "video/mp4",
                }

                response = FileResponse(
                    open(file_path, "rb"),
                    content_type=content_types.get(
                        message.media_type, "application/octet-stream"
                    ),
                )

                file_name = getattr(
                    message, "media_file_name", None
                ) or os.path.basename(file_path)
                response["Content-Disposition"] = f'attachment; filename="{file_name}"'
                response["Content-Length"] = os.path.getsize(file_path)
                response["Access-Control-Allow-Origin"] = "*"

                return response

        # METHOD 2: Get from Telegram API
        if message.media_file_id:
            logger.info(f"📡 Fetching from Telegram API")

            if message.media_type == "sticker":
                return JsonResponse(
                    {"status": "error", "message": "Stickers cannot be downloaded"},
                    status=404,
                )

            bot_token = getattr(settings, "TELEGRAM_BOT_TOKEN", None)
            if not bot_token:
                return JsonResponse(
                    {"error": "TELEGRAM_BOT_TOKEN not configured"}, status=500
                )

            get_file_url = f"https://api.telegram.org/bot{bot_token}/getFile?file_id={message.media_file_id}"

            try:
                response = requests.get(get_file_url, timeout=5)
                data = response.json()

                if data.get("ok"):
                    file_path = data["result"]["file_path"]
                    file_url = (
                        f"https://api.telegram.org/file/bot{bot_token}/{file_path}"
                    )

                    return JsonResponse(
                        {"status": "success", "file_url": file_url, "redirect": True}
                    )
                else:
                    return JsonResponse(
                        {
                            "status": "error",
                            "message": "Failed to get file from Telegram",
                        },
                        status=400,
                    )

            except requests.RequestException as e:
                logger.error(f"❌ Telegram API error: {e}")
                return JsonResponse(
                    {"status": "error", "message": "Failed to connect to Telegram API"},
                    status=503,
                )

        return JsonResponse({"error": "Bu xabarda media yo'q"}, status=404)

    except Exception as e:
        logger.exception(f"❌ Error serving file: {str(e)}")
        return JsonResponse({"error": str(e)}, status=500)


@api_view(["GET"])
def get_telegram_media_url(request, message_id):
    """Get direct media URL"""
    try:
        message = Message.objects.filter(message_id=message_id).order_by("-id").first()

        if not message:
            return JsonResponse({"error": "Xabar topilmadi"}, status=404)

        has_file_path = hasattr(message, "media_file_path")

        # Try local file first
        if has_file_path and message.media_file_path:
            if not os.path.isabs(message.media_file_path):
                file_path = os.path.join(settings.MEDIA_ROOT, message.media_file_path)
            else:
                file_path = message.media_file_path

            if os.path.exists(file_path):
                relative_path = os.path.relpath(file_path, settings.MEDIA_ROOT).replace(
                    "\\", "/"
                )
                media_url = f"{settings.MEDIA_URL}{relative_path}"
                host = request.get_host()
                scheme = "https" if request.is_secure() else "http"
                full_url = f"{scheme}://{host}{media_url}"

                return JsonResponse(
                    {
                        "url": full_url,
                        "media_type": message.media_type,
                        "file_name": getattr(message, "media_file_name", None),
                        "file_size": message.media_file_size,
                        "source": "local",
                    }
                )

        # Try Telegram API
        if message.media_file_id and message.media_type != "sticker":
            bot_token = getattr(settings, "TELEGRAM_BOT_TOKEN", None)
            if bot_token:
                get_file_url = f"https://api.telegram.org/bot{bot_token}/getFile?file_id={message.media_file_id}"

                try:
                    response = requests.get(get_file_url, timeout=5)
                    data = response.json()

                    if data.get("ok"):
                        file_path = data["result"]["file_path"]
                        file_url = (
                            f"https://api.telegram.org/file/bot{bot_token}/{file_path}"
                        )

                        return JsonResponse(
                            {
                                "url": file_url,
                                "media_type": message.media_type,
                                "file_size": message.media_file_size,
                                "source": "telegram",
                            }
                        )
                except:
                    pass

        return JsonResponse({"error": "Media topilmadi"}, status=404)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@api_view(["GET"])
def proxy_telegram_file(request, message_id):
    """
    Proxy Telegram files through backend to solve CORS
    """
    try:
        logger.info(f"📥 Proxy request for message_id={message_id}")

        message = Message.objects.filter(message_id=message_id).order_by("-id").first()

        if not message:
            return JsonResponse({"error": "Xabar topilmadi"}, status=404)

        # ✅ Handle special media types
        if message.media_type == "location":
            return JsonResponse(
                {
                    "error": "Location xabarlari uchun fayl yo'q",
                    "media_type": "location",
                    "note": "Location data is stored as coordinates, not a file",
                },
                status=404,
            )

        if message.media_type == "sticker":
            return JsonResponse(
                {"error": "Sticker'lar yuklab olinmaydi", "media_type": "sticker"},
                status=404,
            )

        if not message.media_file_id:
            return JsonResponse(
                {"error": "Media yo'q", "media_type": message.media_type}, status=404
            )

        bot_token = getattr(settings, "TELEGRAM_BOT_TOKEN", None)
        if not bot_token:
            return JsonResponse(
                {"error": "TELEGRAM_BOT_TOKEN not configured"}, status=500
            )

        get_file_url = f"https://api.telegram.org/bot{bot_token}/getFile?file_id={message.media_file_id}"

        logger.info(f"📡 Getting file info from Telegram...")
        response = requests.get(get_file_url, timeout=10)
        data = response.json()

        if not data.get("ok"):
            return JsonResponse(
                {
                    "error": "Telegram API error",
                    "telegram_error": data.get("description"),
                },
                status=400,
            )

        file_path = data["result"]["file_path"]
        file_url = f"https://api.telegram.org/file/bot{bot_token}/{file_path}"

        logger.info(f"📥 Downloading from Telegram...")
        file_response = requests.get(file_url, timeout=30, stream=True)

        if file_response.status_code != 200:
            return JsonResponse({"error": "Failed to download"}, status=500)

        logger.info(f"✅ Proxying to client...")

        content_types = {
            "photo": "image/jpeg",
            "video": "video/mp4",
            "voice": "audio/ogg",
            "audio": "audio/mpeg",
            "document": "application/octet-stream",
            "sticker": "image/webp",
            "animation": "video/mp4",
        }

        response = HttpResponse(
            file_response.content,
            content_type=content_types.get(
                message.media_type, "application/octet-stream"
            ),
        )

        response["Access-Control-Allow-Origin"] = "*"
        response["Content-Length"] = len(file_response.content)
        response["Cache-Control"] = "public, max-age=3600"

        return response

    except requests.Timeout:
        logger.error("Telegram API timeout")
        return JsonResponse({"error": "Telegram API timeout"}, status=504)
    except Exception as e:
        logger.exception(f"❌ Proxy error: {str(e)}")
        return JsonResponse({"error": str(e)}, status=500)


@api_view(["GET"])
def test_telegram_file(request, message_id):
    """Test media availability"""
    try:
        messages = Message.objects.filter(message_id=message_id)
        count = messages.count()

        if count == 0:
            return JsonResponse({"error": "Message not found"}, status=404)

        message = messages.order_by("-id").first()
        has_file_path = hasattr(message, "media_file_path")

        info = {
            "message_id": message.message_id,
            "duplicate_count": count,
            "media_type": message.media_type,
            "has_media_file_path_field": has_file_path,
            "media_file_id": message.media_file_id,
        }

        if has_file_path:
            info["media_file_path"] = getattr(message, "media_file_path", None)

        return JsonResponse(info)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# Other functions...
@api_view(["GET"])
def group_comparison(request):
    """Guruhlar bo'yicha solishtirish"""
    try:
        all_groups = TelegramGroup.objects.all()
        result = []

        for group in all_groups:
            total_messages = Message.objects.filter(group=group).count()
            if total_messages < 5:
                continue

            unique_users = (
                Message.objects.filter(group=group).values("user_id").distinct().count()
            )
            deleted_messages = Message.objects.filter(
                group=group, is_deleted=True
            ).count()
            edited_messages = Message.objects.filter(
                group=group, is_edited=True
            ).count()
            avg_per_user = (
                round(total_messages / unique_users, 1) if unique_users > 0 else 0
            )

            media_types = (
                Message.objects.filter(group=group)
                .values("media_type")
                .annotate(count=Count("id"))
                .order_by("-count")[:5]
            )

            group_id = getattr(group, "telegram_id", None) or group.id
            group_name = getattr(group, "title", None) or f"Group {group_id}"

            result.append(
                {
                    "id": group_id,
                    "name": group_name,
                    "message_count": total_messages,
                    "user_count": unique_users,
                    "avg_messages_per_user": avg_per_user,
                    "deleted_count": deleted_messages,
                    "edited_count": edited_messages,
                    "media_distribution": list(media_types),
                }
            )

        result = sorted(result, key=lambda x: x["message_count"], reverse=True)

        return Response(
            {"status": "success", "total_groups": len(result), "groups": result}
        )

    except Exception as e:
        logger.exception(f"❌ Error: {e}")
        return Response({"status": "error", "message": str(e)}, status=400)


@api_view(["GET"])
def overview_stats(request):
    """Umumiy statistika"""
    total_messages = Message.objects.count()
    total_users = TelegramUser.objects.count()
    total_groups = (
        TelegramGroup.objects.annotate(msg_count=Count("messages"))
        .filter(msg_count__gte=5)
        .count()
    )

    deleted_messages = Message.objects.filter(is_deleted=True).count()
    edited_messages = Message.objects.filter(is_edited=True).count()

    return Response(
        {
            "total_messages": total_messages,
            "total_users": total_users,
            "total_groups": total_groups,
            "deleted_messages": deleted_messages,
            "edited_messages": edited_messages,
        }
    )


@api_view(["GET"])
def message_list(request):
    """Xabarlar ro'yxati"""
    page_size = int(request.GET.get("page_size", 50))
    page = int(request.GET.get("page", 1))

    start = (page - 1) * page_size
    end = start + page_size
    messages = list(Message.objects.all().order_by("-telegram_created_at")[start:end])

    serializer = MessageSerializer(messages, many=True)

    return Response({"count": Message.objects.count(), "results": serializer.data})
