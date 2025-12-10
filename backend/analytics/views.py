# backend/analytics/views.py
# UPDATED WITH ENHANCED AI INTEGRATION

import re
from collections import Counter
from datetime import timedelta

from django.db.models import Avg, Count, Q
from django.db.models.functions import TruncDate, TruncHour
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.models import Message, MessageAnalysis, TelegramUser

# ========================================
# ✅ ENHANCED AI IMPORTS
# ========================================
from .gemini_ai import (analyze_message_comprehensive, analyze_sentiment,
                        analyze_sentiment_batch, classify_intent,
                        extract_topics, generate_group_insights,
                        generate_weekly_insights, is_gemini_available)


@api_view(["GET"])
def stats_overview(request):
    """Umumiy statistika"""
    total_messages = Message.objects.count()
    total_users = TelegramUser.objects.count()
    total_groups = Message.objects.values("group").distinct().count()

    # Media statistika
    media_stats = Message.objects.values("media_type").annotate(count=Count("id"))

    # Deleted/Edited
    deleted_count = Message.objects.filter(is_deleted=True).count()
    edited_count = Message.objects.filter(is_edited=True).count()

    return Response(
        {
            "total_messages": total_messages,
            "total_users": total_users,
            "total_groups": total_groups,
            "deleted_messages": deleted_count,
            "edited_messages": edited_count,
            "media_distribution": list(media_stats),
        }
    )


@api_view(["GET"])
def top_active_users(request):
    """Eng faol userlar"""
    limit = int(request.GET.get("limit", 10))

    users = (
        TelegramUser.objects.annotate(message_count=Count("messages"))
        .filter(message_count__gt=0)
        .order_by("-message_count")[:limit]
    )

    data = [
        {
            "user_id": user.telegram_id,
            "username": user.username,
            "full_name": user.full_name,
            "first_name": user.first_name,
            "message_count": user.message_count,
        }
        for user in users
    ]

    return Response(data)


@api_view(["GET"])
def word_frequency(request):
    """
    So'z chastotasi - AI keywords'dan yoki basic text analysis
    """
    limit = int(request.GET.get("limit", 20))

    # Try to get from AI-extracted keywords first
    all_keywords = []

    # Get AI keywords from MessageAnalysis
    analyses = MessageAnalysis.objects.filter(keywords__isnull=False).values_list(
        "keywords", flat=True
    )

    for keywords in analyses:
        if isinstance(keywords, list):
            all_keywords.extend(keywords)
        elif isinstance(keywords, str):
            all_keywords.extend(keywords.split(","))

    # If we have AI keywords, use them
    if all_keywords:
        keyword_counts = Counter([k.strip() for k in all_keywords if k])
        top_words = [
            {"word": word, "count": count}
            for word, count in keyword_counts.most_common(limit)
        ]
        return Response(top_words)

    # Fallback: Basic text analysis
    messages = Message.objects.filter(
        media_type="text", text__isnull=False
    ).values_list("text", flat=True)

    all_words = []
    stop_words = {
        "va",
        "yoki",
        "lekin",
        "uchun",
        "and",
        "or",
        "but",
        "the",
        "is",
        "in",
        "to",
        "a",
        "of",
        "for",
        "на",
        "в",
        "и",
        "с",
        "по",
        "что",
        "это",
        "bu",
        "u",
        "ham",
        "bilan",
        "dan",
        "ga",
        "ni",
        "ни",
        "да",
        "нет",
    }

    for text in messages:
        words = re.findall(r"\b\w+\b", text.lower())
        words = [w for w in words if w not in stop_words and len(w) > 2]
        all_words.extend(words)

    word_counts = Counter(all_words)
    top_words = [
        {"word": word, "count": count} for word, count in word_counts.most_common(limit)
    ]

    return Response(top_words)


@api_view(["GET"])
def messages_per_day(request):
    """Kunlik xabarlar statistikasi"""
    days = int(request.GET.get("days", 30))

    stats = (
        Message.objects.annotate(date=TruncDate("telegram_created_at"))
        .values("date")
        .annotate(count=Count("id"))
        .order_by("date")
    )

    # Last N days
    stats = list(stats)[-days:]

    data = [
        {"date": item["date"].isoformat(), "count": item["count"]} for item in stats
    ]

    return Response(data)


@api_view(["GET"])
def messages_per_hour(request):
    """Soatlik xabarlar statistikasi"""
    stats = (
        Message.objects.annotate(hour=TruncHour("telegram_created_at"))
        .values("hour")
        .annotate(count=Count("id"))
        .order_by("hour")
    )

    # Last 24 hours
    stats = list(stats)[-24:]

    data = [
        {
            "hour": item["hour"].isoformat() if item["hour"] else None,
            "count": item["count"],
        }
        for item in stats
    ]

    return Response(data)


@api_view(["GET"])
def media_distribution(request):
    """Media turlari bo'yicha statistika"""
    stats = (
        Message.objects.values("media_type")
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    return Response(list(stats))


@api_view(["GET"])
def top_topics(request):
    """Eng ko'p uchraydigan mavzular (AI-extracted)"""
    limit = int(request.GET.get("limit", 10))

    topics = (
        MessageAnalysis.objects.filter(topic__isnull=False)
        .exclude(topic="")
        .values("topic")
        .annotate(count=Count("id"))
        .order_by("-count")[:limit]
    )

    return Response(list(topics))


@api_view(["GET"])
def sentiment_overall(request):
    """Umumiy sentiment statistikasi (AI-powered)"""

    # Get from Message model
    sentiments = (
        Message.objects.filter(sentiment__isnull=False)
        .values("sentiment")
        .annotate(count=Count("id"))
    )

    # Fallback to MessageAnalysis
    if not sentiments:
        sentiments = (
            MessageAnalysis.objects.filter(sentiment__isnull=False)
            .values("sentiment")
            .annotate(count=Count("id"))
        )

    # Average sentiment score from MessageAnalysis
    avg_score = MessageAnalysis.objects.aggregate(avg=Avg("sentiment_score"))["avg"]

    return Response(
        {
            "distribution": list(sentiments),
            "average_score": round(avg_score, 2) if avg_score else 0.0,
            "ai_powered": is_gemini_available(),
        }
    )


@api_view(["GET"])
def reply_chain_stats(request):
    """Reply chain statistikasi"""
    total_replies = Message.objects.filter(reply_to_message_id__isnull=False).count()
    total_messages = Message.objects.count()

    # Eng ko'p reply olgan xabarlar
    top_replied = (
        Message.objects.annotate(reply_count=Count("replies"))
        .filter(reply_count__gt=0)
        .order_by("-reply_count")[:10]
    )

    top_replied_data = [
        {
            "message_id": msg.message_id,
            "text": msg.text[:100] if msg.text else f"[{msg.media_type}]",
            "user": msg.user.full_name or msg.user.username,
            "reply_count": msg.reply_count,
        }
        for msg in top_replied
    ]

    return Response(
        {
            "total_replies": total_replies,
            "reply_percentage": (
                round((total_replies / total_messages * 100), 2)
                if total_messages
                else 0
            ),
            "top_replied_messages": top_replied_data,
        }
    )


@api_view(["GET"])
def user_profile(request, user_id):
    """Individual user profil"""
    try:
        user = TelegramUser.objects.get(telegram_id=user_id)
    except TelegramUser.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    # User statistikasi
    total_messages = user.messages.count()
    text_messages = user.messages.filter(media_type="text").count()
    media_messages = total_messages - text_messages

    # Media types
    media_stats = user.messages.values("media_type").annotate(count=Count("id"))

    # Questions asked (AI-detected)
    questions = user.messages.filter(analysis__is_question=True).count()

    # Sentiment
    sentiments = (
        user.messages.filter(sentiment__isnull=False)
        .values("sentiment")
        .annotate(count=Count("id"))
    )

    if not sentiments:
        sentiments = (
            MessageAnalysis.objects.filter(message__user=user, sentiment__isnull=False)
            .values("sentiment")
            .annotate(count=Count("id"))
        )

    return Response(
        {
            "user_id": user.telegram_id,
            "username": user.username,
            "full_name": user.full_name,
            "first_name": user.first_name,
            "total_messages": total_messages,
            "text_messages": text_messages,
            "media_messages": media_messages,
            "media_distribution": list(media_stats),
            "questions_asked": questions,
            "sentiment_distribution": list(sentiments),
        }
    )


# ========================================
# ✅ ENHANCED AI-POWERED ENDPOINTS
# ========================================


@api_view(["GET"])
def ai_sentiment_analysis(request):
    """
    AI-powered batch sentiment analysis
    Analyzes last 50 messages with Gemini AI
    """
    try:
        # Get last 50 messages with text
        messages = list(
            Message.objects.exclude(text__isnull=True)
            .exclude(text="")
            .select_related("user")
            .order_by("-telegram_created_at")[:50]
        )

        if not messages:
            return Response(
                {
                    "status": "success",
                    "total": 0,
                    "stats": {"positive": 0, "negative": 0, "neutral": 0},
                    "messages": [],
                    "powered_by": "Google Gemini AI",
                }
            )

        # ✅ Use batch sentiment analysis
        messages_list = [{"text": msg.text, "id": msg.id} for msg in messages]
        analyzed = analyze_sentiment_batch(messages_list, batch_size=10)

        # Build results
        results = []
        for msg, analyzed_msg in zip(messages, analyzed):
            sentiment = analyzed_msg.get("sentiment", "neutral")
            score = (
                0.8
                if sentiment == "positive"
                else -0.8 if sentiment == "negative" else 0.0
            )

            results.append(
                {
                    "message_id": msg.message_id,
                    "text": msg.text[:100],
                    "user": msg.user.full_name or msg.user.username,
                    "sentiment": sentiment,
                    "score": score,
                    "ai_powered": True,
                }
            )

            # ✅ Save sentiment back to Message model
            if msg.sentiment != sentiment:
                msg.sentiment = sentiment
                msg.save(update_fields=["sentiment"])

        # Calculate stats
        positive = sum(1 for r in results if r["sentiment"] == "positive")
        negative = sum(1 for r in results if r["sentiment"] == "negative")
        neutral = sum(1 for r in results if r["sentiment"] == "neutral")

        return Response(
            {
                "status": "success",
                "total": len(results),
                "stats": {
                    "positive": positive,
                    "negative": negative,
                    "neutral": neutral,
                    "positive_percent": (
                        round((positive / len(results)) * 100, 1) if results else 0
                    ),
                    "negative_percent": (
                        round((negative / len(results)) * 100, 1) if results else 0
                    ),
                },
                "messages": results[:10],
                "ai_available": is_gemini_available(),
                "powered_by": "Google Gemini AI",
            }
        )

    except Exception as e:
        print(f"AI Sentiment Analysis Error: {e}")
        import traceback

        traceback.print_exc()

        return Response(
            {
                "status": "error",
                "message": str(e),
                "ai_available": is_gemini_available(),
            },
            status=500,
        )


@api_view(["GET"])
def weekly_insights(request):
    """
    Haftalik AI-generated insights
    Uses Gemini AI for comprehensive weekly analysis
    """
    try:
        # Last 7 days
        week_ago = timezone.now() - timedelta(days=7)
        messages = Message.objects.filter(
            telegram_created_at__gte=week_ago
        ).select_related("user", "group")

        message_count = messages.count()

        if message_count == 0:
            return Response(
                {
                    "status": "success",
                    "period": "7 days",
                    "message_count": 0,
                    "insights": "📊 Hali tahlil qilish uchun yetarli xabar yo'q.",
                    "generated_at": timezone.now().isoformat(),
                    "powered_by": "Google Gemini AI",
                }
            )

        # Prepare data for AI
        messages_list = []
        for msg in messages[:100]:  # Limit to 100 for API
            messages_list.append(
                {
                    "text": msg.text or f"[{msg.media_type}]",
                    "user": msg.user.full_name or msg.user.username,
                    "sentiment": msg.sentiment,
                }
            )

        # Get unique users and groups
        users = messages.values("user__username", "user__full_name").distinct().count()
        groups = messages.values("group__title").distinct()

        data = {
            "total_messages": message_count,
            "users": users,
            "groups": [g["group__title"] for g in groups if g["group__title"]],
            "messages": messages_list,
        }

        # ✅ Generate insights with Gemini AI
        insights = generate_weekly_insights(data)

        return Response(
            {
                "status": "success",
                "period": "7 days",
                "message_count": message_count,
                "insights": insights,
                "generated_at": timezone.now().isoformat(),
                "ai_available": is_gemini_available(),
                "powered_by": "Google Gemini AI",
            }
        )

    except Exception as e:
        print(f"Weekly Insights Error: {e}")
        import traceback

        traceback.print_exc()

        return Response({"status": "error", "message": str(e)}, status=500)


@api_view(["GET"])
def group_insights(request, group_id):
    """
    AI-powered group analysis
    GET /api/stats/group-insights/<group_id>/
    """
    try:
        from core.models import TelegramGroup

        # Get group
        try:
            group = TelegramGroup.objects.get(telegram_id=group_id)
        except TelegramGroup.DoesNotExist:
            return Response({"error": "Group not found"}, status=404)

        # Get group messages
        messages = (
            Message.objects.filter(group=group)
            .select_related("user")
            .order_by("-telegram_created_at")[:200]
        )

        if not messages:
            return Response(
                {
                    "status": "success",
                    "group_name": group.title,
                    "insights": "📊 Bu guruhda hali xabarlar yo'q.",
                    "message_count": 0,
                    "powered_by": "Google Gemini AI",
                }
            )

        # Prepare messages for AI
        messages_list = []
        for msg in messages:
            messages_list.append(
                {
                    "text": msg.text or f"[{msg.media_type}]",
                    "user_name": msg.user.full_name or msg.user.username,
                    "sentiment": msg.sentiment,
                    "created_at": msg.telegram_created_at.isoformat(),
                }
            )

        # ✅ Generate group insights with AI
        insights = generate_group_insights(messages_list, group.title)

        return Response(
            {
                "status": "success",
                "group_id": group_id,
                "group_name": group.title,
                "message_count": len(messages_list),
                "insights": insights,
                "generated_at": timezone.now().isoformat(),
                "ai_available": is_gemini_available(),
                "powered_by": "Google Gemini AI",
            }
        )

    except Exception as e:
        print(f"Group Insights Error: {e}")
        import traceback

        traceback.print_exc()

        return Response({"status": "error", "message": str(e)}, status=500)


@api_view(["POST"])
def analyze_message_api(request):
    """
    Analyze a single message with comprehensive AI
    POST /api/analyze-message/
    Body: {"text": "message text"}
    """
    text = request.data.get("text")

    if not text:
        return Response({"error": "text required"}, status=400)

    try:
        # ✅ Use comprehensive analysis
        message_data = {"text": text}
        analyzed = analyze_message_comprehensive(message_data)

        return Response(
            {
                "text": text,
                "sentiment": analyzed.get("sentiment", "neutral"),
                "intent": analyzed.get("intent", "general"),
                "topics": analyzed.get("topics", []),
                "urgency": analyzed.get("urgency", "low"),
                "ai_available": is_gemini_available(),
                "powered_by": "Google Gemini AI",
            }
        )

    except Exception as e:
        print(f"Analyze Message Error: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def intent_distribution(request):
    """
    Intent distribution statistics (AI-detected)
    Shows what users are trying to do
    """
    intents = (
        MessageAnalysis.objects.filter(intent__isnull=False)
        .values("intent")
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    return Response(
        {
            "distribution": list(intents),
            "total": sum(i["count"] for i in intents),
            "ai_available": is_gemini_available(),
            "powered_by": "Gemini AI",
        }
    )


@api_view(["GET"])
def ai_insights(request):
    """
    AI Insights endpoint for GeminiInsights component
    GET /api/ai/insights/
    """
    try:
        # Get messages from last 7 days
        seven_days_ago = timezone.now() - timedelta(days=7)
        messages = Message.objects.filter(
            telegram_created_at__gte=seven_days_ago
        ).select_related("user", "group")

        message_count = messages.count()

        # If no messages
        if message_count == 0:
            return Response(
                {
                    "status": "success",
                    "insights": "📊 Hali tahlil qilish uchun yetarli xabar yo'q.\n\nKamida 10 ta xabar qo'shing.",
                    "message_count": 0,
                    "period": "Oxirgi 7 kun",
                    "generated_at": timezone.now().isoformat(),
                    "ai_available": is_gemini_available(),
                    "powered_by": "Google Gemini AI",
                }
            )

        # Prepare messages for AI
        messages_list = []
        for msg in messages[:100]:  # Limit to 100
            messages_list.append(
                {
                    "text": msg.text or f"[{msg.media_type}]",
                    "user": msg.user.full_name or msg.user.username,
                    "sentiment": msg.sentiment,
                }
            )

        # Get basic stats
        user_count = messages.values("user").distinct().count()

        data = {
            "total_messages": message_count,
            "users": user_count,
            "messages": messages_list,
        }

        # ✅ Generate AI insights
        insights_text = generate_weekly_insights(data)

        return Response(
            {
                "status": "success",
                "insights": insights_text,
                "message_count": message_count,
                "period": "Oxirgi 7 kun",
                "generated_at": timezone.now().isoformat(),
                "ai_available": is_gemini_available(),
                "powered_by": "Google Gemini AI",
            }
        )

    except Exception as e:
        print(f"AI Insights Error: {e}")
        import traceback

        traceback.print_exc()

        return Response(
            {
                "status": "error",
                "message": str(e),
                "insights": "❌ AI insights yaratishda xatolik yuz berdi.",
                "message_count": 0,
                "ai_available": is_gemini_available(),
            },
            status=500,
        )


@api_view(["GET"])
def ai_status(request):
    """
    Check Gemini AI availability
    GET /api/ai/status/
    """
    from .gemini_ai import get_api_status

    status = get_api_status()

    return Response(
        {
            "status": "success",
            "gemini_available": status["available"],
            "api_key_configured": status["api_key_configured"],
            "model": status["model"],
        }
    )
