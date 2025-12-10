# backend/core/signals.py
# SIGNALS FOR YOUR MODEL STRUCTURE WITH AI

import logging

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from analytics.gemini_ai import (analyze_sentiment, classify_intent,
                                 extract_topics)
from core.models import Message, MessageAnalysis, TelegramUser

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Message)
def auto_analyze_message(sender, instance, created, **kwargs):
    """
    Yangi xabar yaratilganda avtomatik AI tahlil qilish

    IMPORTANT: Bu sizning model strukturangizga moslashtirilgan
    - TelegramUser.is_bot tekshiradi
    - MessageAnalysis yaratadi
    - Message.sentiment/topics yangilaydi
    """

    # Only analyze new messages
    if not created:
        return

    # Skip if no text or text too short
    if not instance.text or len(instance.text) < 3:
        logger.debug(f"⏭️ Skipping message {instance.message_id} - no text or too short")
        return

    # Skip bot messages
    if instance.user and instance.user.is_bot:
        logger.debug(f"⏭️ Skipping message {instance.message_id} - from bot")
        return

    try:
        logger.info(
            f"🤖 Auto-analyzing message {instance.message_id} from {instance.user}"
        )

        # ========================================
        # ✅ AI ANALYSIS
        # ========================================

        # 1. Sentiment Analysis
        sentiment = analyze_sentiment(instance.text)
        sentiment_score = get_sentiment_score(sentiment)
        logger.info(f"  ✅ Sentiment: {sentiment} ({sentiment_score})")

        # 2. Topic Extraction
        topics = extract_topics(instance.text)
        topic = topics[0] if topics else "general"
        logger.info(f"  ✅ Topics: {topics}")

        # 3. Intent Classification
        intent = classify_intent(instance.text)
        is_question = intent == "question"
        logger.info(f"  ✅ Intent: {intent}")

        # ========================================
        # SAVE TO MESSAGEANALYSIS
        # ========================================

        MessageAnalysis.objects.create(
            message=instance,
            topic=topic,
            sentiment=sentiment,
            sentiment_score=sentiment_score,
            intent=intent,
            keywords=topics,  # List of keywords
            is_question=is_question,
        )

        # ========================================
        # UPDATE MESSAGE WITH AI FIELDS
        # ========================================

        instance.sentiment = sentiment
        instance.topics = topics
        instance.ai_processed = True
        instance.ai_processed_at = timezone.now()
        instance.save(
            update_fields=["sentiment", "topics", "ai_processed", "ai_processed_at"]
        )

        logger.info(f"✅ Message {instance.message_id} analyzed successfully")

    except Exception as e:
        logger.error(
            f"❌ Auto-analysis error for message {instance.message_id}: {e}",
            exc_info=True,
        )

        # Save error to message
        instance.ai_error = str(e)
        instance.ai_processed = False
        instance.save(update_fields=["ai_error", "ai_processed"])


@receiver(post_save, sender=Message)
def auto_reanalyze_edited_message(sender, instance, created, **kwargs):
    """
    Tahrirlangan xabarni qayta tahlil qilish
    """

    # Skip newly created messages
    if created:
        return

    # Skip if not edited or no text
    if not instance.is_edited or not instance.text:
        return

    # Skip if already processed very recently (avoid loops)
    if instance.ai_processed_at:
        from datetime import timedelta

        if timezone.now() - instance.ai_processed_at < timedelta(seconds=5):
            logger.debug(f"⏭️ Skipping re-analysis - processed recently")
            return

    try:
        logger.info(f"🔄 Re-analyzing edited message {instance.message_id}")

        # AI Analysis
        sentiment = analyze_sentiment(instance.text)
        sentiment_score = get_sentiment_score(sentiment)
        topics = extract_topics(instance.text)
        topic = topics[0] if topics else "general"
        intent = classify_intent(instance.text)
        is_question = intent == "question"

        # Update or create MessageAnalysis
        analysis, created = MessageAnalysis.objects.update_or_create(
            message=instance,
            defaults={
                "topic": topic,
                "sentiment": sentiment,
                "sentiment_score": sentiment_score,
                "intent": intent,
                "keywords": topics,
                "is_question": is_question,
            },
        )

        # Update Message fields
        instance.sentiment = sentiment
        instance.topics = topics
        instance.ai_processed = True
        instance.ai_processed_at = timezone.now()
        instance.ai_error = None  # Clear any previous errors
        instance.save(
            update_fields=[
                "sentiment",
                "topics",
                "ai_processed",
                "ai_processed_at",
                "ai_error",
            ]
        )

        logger.info(f"✅ Edited message {instance.message_id} re-analyzed")

    except Exception as e:
        logger.error(
            f"❌ Re-analysis error for message {instance.message_id}: {e}",
            exc_info=True,
        )
        instance.ai_error = str(e)
        instance.save(update_fields=["ai_error"])


def get_sentiment_score(sentiment):
    """
    Convert sentiment to numeric score

    Args:
        sentiment (str): 'positive', 'negative', or 'neutral'

    Returns:
        float: Score between -1.0 and 1.0
    """
    sentiment_map = {
        "positive": 0.8,
        "neutral": 0.0,
        "negative": -0.8,
        "question": 0.0,  # For backward compatibility
    }
    return sentiment_map.get(sentiment, 0.0)


# ========================================
# UTILITY FUNCTIONS
# ========================================


def check_ai_system():
    """
    Check if AI system is working

    Usage:
        python manage.py shell
        >>> from core.signals import check_ai_system
        >>> check_ai_system()
    """
    try:
        from analytics.gemini_ai import health_check

        if health_check():
            logger.info("✅ AI system is ready")
            print("✅ AI system is ready")
            return True
        else:
            logger.error("❌ AI system health check failed")
            print("❌ AI system health check failed")
            return False

    except ImportError as e:
        logger.error(f"❌ AI module not found: {e}")
        print(f"❌ AI module not found: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ AI system error: {e}")
        print(f"❌ AI system error: {e}")
        return False


def test_ai_analysis(message_id):
    """
    Test AI analysis on specific message

    Usage:
        python manage.py shell
        >>> from core.signals import test_ai_analysis
        >>> test_ai_analysis(12345)
    """
    try:
        message = Message.objects.get(message_id=message_id)

        if not message.text:
            print(f"❌ Message {message_id} has no text")
            return

        print(f"📝 Message text: {message.text[:100]}...")
        print(f"\n🤖 Running AI analysis...")

        sentiment = analyze_sentiment(message.text)
        topics = extract_topics(message.text)
        intent = classify_intent(message.text)

        print(f"\n✅ Results:")
        print(f"  Sentiment: {sentiment}")
        print(f"  Topics: {topics}")
        print(f"  Intent: {intent}")

        return {"sentiment": sentiment, "topics": topics, "intent": intent}

    except Message.DoesNotExist:
        print(f"❌ Message {message_id} not found")
    except Exception as e:
        print(f"❌ Error: {e}")
