"""
Gemini AI integration for Telegram message analysis.

This module provides AI-powered analytics for Telegram messages using Google's Gemini API.
It includes sentiment analysis, intent classification, topic extraction, and comprehensive
message analysis capabilities.
"""

import json
import os
import time
from functools import lru_cache
from typing import Any, Dict, List, Optional

# Constants
MODEL_NAME = "gemini-2.5-flash"
DEFAULT_TEMPERATURE = 0.7
DEFAULT_TOP_P = 0.95
DEFAULT_TOP_K = 40
DEFAULT_MAX_OUTPUT_TOKENS = 2048
ENV_API_KEY = "GEMINI_API_KEY"

# Try to import Gemini
try:
    import google.generativeai as genai

    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print(
        "⚠️ google-generativeai not installed. Install: pip install google-generativeai"
    )

# Configure Gemini if available
if GEMINI_AVAILABLE:
    api_key = os.getenv(ENV_API_KEY)
    if api_key:
        genai.configure(api_key=api_key)

        # Initialize model with configuration
        model = genai.GenerativeModel(
            MODEL_NAME,
            generation_config={
                "temperature": DEFAULT_TEMPERATURE,
                "top_p": DEFAULT_TOP_P,
                "top_k": DEFAULT_TOP_K,
                "max_output_tokens": DEFAULT_MAX_OUTPUT_TOKENS,
            },
        )
        print("✅ Gemini AI configured successfully")
    else:
        GEMINI_AVAILABLE = False
        print(f"⚠️ {ENV_API_KEY} not found in environment")


# ==========================================
# SENTIMENT ANALYSIS (MAIN FEATURE)
# ==========================================

# Sentiment constants
SENTIMENT_POSITIVE = "positive"
SENTIMENT_NEGATIVE = "negative"
SENTIMENT_NEUTRAL = "neutral"
MIN_TEXT_LENGTH = 3
MAX_TEXT_LENGTH = 500


def analyze_sentiment(text: str) -> str:
    """
    Analyze sentiment of a single text using Gemini AI.

    Args:
        text: The text to analyze

    Returns:
        str: One of 'positive', 'negative', or 'neutral'
    """
    # Return neutral for invalid inputs or when AI is not available
    if not GEMINI_AVAILABLE or not text or len(text.strip()) < MIN_TEXT_LENGTH:
        return SENTIMENT_NEUTRAL

    try:
        prompt = f"""Analyze the sentiment of this message and respond with ONLY ONE WORD: positive, negative, or neutral.

Message: "{text[:MAX_TEXT_LENGTH]}"

Response (one word only):"""

        response = model.generate_content(prompt)

        if response and hasattr(response, "text"):
            sentiment = response.text.lower().strip()

            # Clean response
            if SENTIMENT_POSITIVE in sentiment:
                return SENTIMENT_POSITIVE
            elif SENTIMENT_NEGATIVE in sentiment:
                return SENTIMENT_NEGATIVE
            else:
                return SENTIMENT_NEUTRAL
        else:
            return SENTIMENT_NEUTRAL

    except Exception as e:
        print(f"❌ Sentiment analysis error: {e}")
        return SENTIMENT_NEUTRAL


def analyze_sentiment_batch(
    messages: List[Dict[str, Any]], batch_size: int = 10
) -> List[Dict[str, Any]]:
    """
    Analyze sentiment for multiple messages in batches.

    Args:
        messages: List of message dicts with 'text' field
        batch_size: Number of messages to process in one API call

    Returns:
        List[Dict[str, Any]]: List of messages with sentiment added
    """
    # Default to neutral sentiment if AI is not available
    if not GEMINI_AVAILABLE:
        for msg in messages:
            msg["sentiment"] = SENTIMENT_NEUTRAL
        return messages

    try:
        results = []
        # Process in batches to avoid rate limits
        for i in range(0, len(messages), batch_size):
            batch = messages[i : i + batch_size]
            batch_results = _process_sentiment_batch(batch)
            results.extend(batch_results)

            # Rate limit protection
            if i + batch_size < len(messages):
                time.sleep(1)  # Wait 1 second between batches

        return results

    except Exception as e:
        print(f"❌ Batch sentiment analysis error: {e}")
        for msg in messages:
            msg["sentiment"] = SENTIMENT_NEUTRAL
        return messages


def _process_sentiment_batch(batch: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process a single batch of messages for sentiment analysis.

    Args:
        batch: A batch of messages to analyze

    Returns:
        List[Dict[str, Any]]: The batch with sentiment added
    """
    # Build batch prompt
    texts = []
    for idx, msg in enumerate(batch):
        text = msg.get("text", "") or msg.get("content", "")
        if text:
            texts.append(f"{idx + 1}. {text[:200]}")

    # If no valid texts, return batch with neutral sentiment
    if not texts:
        for msg in batch:
            msg["sentiment"] = SENTIMENT_NEUTRAL
        return batch

    prompt = f"""Analyze sentiment for each message below. Respond with ONLY a JSON array of sentiments.

Messages:
{chr(10).join(texts)}

Respond with JSON array like: ["positive", "neutral", "negative", ...]
Only use: positive, negative, or neutral
JSON array only, no explanation:"""

    response = model.generate_content(prompt)

    if response and hasattr(response, "text"):
        # Try to parse JSON response
        try:
            response_text = _clean_response_text(response.text)
            sentiments = json.loads(response_text)
            _assign_sentiments_to_messages(batch, sentiments)
        except json.JSONDecodeError:
            # Fallback: analyze individually
            for msg in batch:
                msg["sentiment"] = analyze_sentiment(msg.get("text", ""))
    else:
        # Default to neutral if no valid response
        for msg in batch:
            msg["sentiment"] = SENTIMENT_NEUTRAL

    return batch


def _clean_response_text(response_text: str) -> str:
    """
    Clean response text by removing markdown code blocks.

    Args:
        response_text: The raw response text

    Returns:
        str: Cleaned response text
    """
    response_text = response_text.strip()

    # Remove markdown code blocks if present
    if "```json" in response_text:
        response_text = response_text.split("```json")[1].split("```")[0]
    elif "```" in response_text:
        response_text = response_text.split("```")[1].split("```")[0]

    return response_text


def _assign_sentiments_to_messages(
    messages: List[Dict[str, Any]], sentiments: List[str]
) -> None:
    """
    Assign sentiment values to messages.

    Args:
        messages: List of message dicts
        sentiments: List of sentiment values
    """
    valid_sentiments = [SENTIMENT_POSITIVE, SENTIMENT_NEGATIVE, SENTIMENT_NEUTRAL]

    for idx, msg in enumerate(messages):
        if idx < len(sentiments):
            sentiment = sentiments[idx].lower().strip()
            msg["sentiment"] = (
                sentiment if sentiment in valid_sentiments else SENTIMENT_NEUTRAL
            )
        else:
            msg["sentiment"] = SENTIMENT_NEUTRAL


# ==========================================
# INTENT CLASSIFICATION
# ==========================================

# Intent constants
INTENT_QUESTION = "question"
INTENT_COMPLAINT = "complaint"
INTENT_FEEDBACK = "feedback"
INTENT_REQUEST = "request"
INTENT_GREETING = "greeting"
INTENT_GENERAL = "general"
INTENT_MAX_TEXT_LENGTH = 300


def classify_intent(text: str) -> str:
    """
    Classify user intent using Gemini AI.

    Args:
        text: The text to analyze

    Returns:
        str: One of 'question', 'complaint', 'feedback', 'request', 'greeting', or 'general'
    """
    # Return general for invalid inputs or when AI is not available
    if not GEMINI_AVAILABLE or not text:
        return INTENT_GENERAL

    try:
        valid_intents = [
            INTENT_QUESTION,
            INTENT_COMPLAINT,
            INTENT_FEEDBACK,
            INTENT_REQUEST,
            INTENT_GREETING,
            INTENT_GENERAL,
        ]

        prompt = f"""Classify the intent of this message. Respond with ONLY ONE WORD:

Options: question, complaint, feedback, request, greeting, general

Message: "{text[:INTENT_MAX_TEXT_LENGTH]}"

Intent (one word):"""

        response = model.generate_content(prompt)

        if response and hasattr(response, "text"):
            intent = response.text.lower().strip()

            # Find matching intent
            for valid_intent in valid_intents:
                if valid_intent in intent:
                    return valid_intent

            # Default to general if no match found
            return INTENT_GENERAL
        else:
            return INTENT_GENERAL

    except Exception as e:
        print(f"❌ Intent classification error: {e}")
        return INTENT_GENERAL


# ==========================================
# TOPIC EXTRACTION
# ==========================================

# Topic extraction constants
DEFAULT_MAX_TOPICS = 3
TOPIC_MAX_TEXT_LENGTH = 500
MIN_TOPIC_LENGTH = 2


def extract_topics(text: str, max_topics: int = DEFAULT_MAX_TOPICS) -> List[str]:
    """
    Extract main topics from text using Gemini AI.

    Args:
        text: The text to analyze
        max_topics: Maximum number of topics to extract

    Returns:
        List[str]: List of extracted topic strings
    """
    # Return empty list for invalid inputs or when AI is not available
    if not GEMINI_AVAILABLE or not text:
        return []

    try:
        prompt = f"""Extract {max_topics} main topics from this text. Respond with ONLY a comma-separated list.

Text: "{text[:TOPIC_MAX_TEXT_LENGTH]}"

Topics (comma-separated, {max_topics} max):"""

        response = model.generate_content(prompt)

        if response and hasattr(response, "text"):
            # Process and filter topics
            topics = [t.strip() for t in response.text.split(",")]
            valid_topics = [
                t for t in topics[:max_topics] if t and len(t) > MIN_TOPIC_LENGTH
            ]
            return valid_topics
        else:
            return []

    except Exception as e:
        print(f"❌ Topic extraction error: {e}")
        return []


# ==========================================
# COMPREHENSIVE MESSAGE ANALYSIS
# ==========================================

# Urgency constants
URGENCY_HIGH = "high"
URGENCY_MEDIUM = "medium"
URGENCY_LOW = "low"
COMPREHENSIVE_MAX_TEXT_LENGTH = 500


def analyze_message_comprehensive(message: Dict[str, Any]) -> Dict[str, Any]:
    """
    Comprehensive analysis of a single message.

    Performs a complete analysis of a message, adding sentiment, intent,
    topics, and urgency fields to the message dictionary.

    Args:
        message: Dictionary containing message data with 'text' or 'content' field

    Returns:
        Dict[str, Any]: The message with analysis fields added
    """
    # Set default values
    default_analysis = {
        "sentiment": SENTIMENT_NEUTRAL,
        "intent": INTENT_GENERAL,
        "topics": [],
        "urgency": URGENCY_LOW,
    }

    # Return defaults if AI is not available
    if not GEMINI_AVAILABLE:
        return _apply_analysis_to_message(message, default_analysis)

    # Extract text from message
    text = message.get("text", "") or message.get("content", "")

    # Return defaults for invalid inputs
    if not text or len(text.strip()) < MIN_TEXT_LENGTH:
        return _apply_analysis_to_message(message, default_analysis)

    try:
        # Single comprehensive prompt to reduce API calls
        analysis = _get_comprehensive_analysis(text)
        return _apply_analysis_to_message(message, analysis)
    except Exception as e:
        print(f"❌ Comprehensive analysis error: {e}")
        return _apply_analysis_to_message(message, default_analysis)


def _get_comprehensive_analysis(text: str) -> Dict[str, Any]:
    """
    Get comprehensive analysis for a text using Gemini AI.

    Args:
        text: The text to analyze

    Returns:
        Dict[str, Any]: Analysis results with sentiment, intent, topics, and urgency
    """
    prompt = f"""Analyze this message and respond with JSON:

Message: "{text[:COMPREHENSIVE_MAX_TEXT_LENGTH]}"

Provide JSON with these fields:
- sentiment: "positive", "negative", or "neutral"
- intent: "question", "complaint", "feedback", "request", "greeting", or "general"
- topics: array of 1-3 main topics (strings)
- urgency: "high", "medium", or "low"

JSON only, no explanation:"""

    response = model.generate_content(prompt)

    if response and hasattr(response, "text"):
        try:
            response_text = _clean_response_text(response.text)
            analysis = json.loads(response_text)

            # Validate fields
            return {
                "sentiment": analysis.get("sentiment", SENTIMENT_NEUTRAL),
                "intent": analysis.get("intent", INTENT_GENERAL),
                "topics": analysis.get("topics", []),
                "urgency": analysis.get("urgency", URGENCY_LOW),
            }
        except json.JSONDecodeError:
            # Fallback: individual analysis
            return {
                "sentiment": analyze_sentiment(text),
                "intent": classify_intent(text),
                "topics": extract_topics(text),
                "urgency": URGENCY_LOW,
            }
    else:
        # Default values if no response
        return {
            "sentiment": SENTIMENT_NEUTRAL,
            "intent": INTENT_GENERAL,
            "topics": [],
            "urgency": URGENCY_LOW,
        }


def _apply_analysis_to_message(
    message: Dict[str, Any], analysis: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Apply analysis results to a message.

    Args:
        message: The message dictionary to update
        analysis: Analysis results to apply

    Returns:
        Dict[str, Any]: Updated message with analysis fields
    """
    message["sentiment"] = analysis["sentiment"]
    message["intent"] = analysis["intent"]
    message["topics"] = analysis["topics"]
    message["urgency"] = analysis["urgency"]
    return message


# ==========================================
# GROUP ANALYTICS
# ==========================================

# Group analytics constants
DEFAULT_GROUP_NAME = "Guruh"
MAX_SAMPLE_MESSAGES = 50
MAX_DISPLAY_MESSAGES = 30
MAX_MESSAGE_PREVIEW_LENGTH = 100
HIGH_ACTIVITY_THRESHOLD = 100
MEDIUM_ACTIVITY_THRESHOLD = 50


def generate_group_insights(
    messages: List[Dict[str, Any]], group_name: str = DEFAULT_GROUP_NAME
) -> str:
    """
    Generate comprehensive insights for a group's messages.

    Args:
        messages: List of message dictionaries
        group_name: Name of the group

    Returns:
        str: Formatted text analysis in Uzbek language
    """
    if not GEMINI_AVAILABLE or not messages:
        return _generate_fallback_group_insights(messages, group_name)

    try:
        # Prepare data for analysis
        analysis_data = _prepare_group_analysis_data(messages, group_name)

        # Generate insights using AI
        return _generate_ai_group_insights(analysis_data)
    except Exception as e:
        print(f"❌ Group insights error: {e}")
        return _generate_fallback_group_insights(messages, group_name)


def _prepare_group_analysis_data(
    messages: List[Dict[str, Any]], group_name: str
) -> Dict[str, Any]:
    """
    Prepare data for group analysis.

    Args:
        messages: List of message dictionaries
        group_name: Name of the group

    Returns:
        Dict[str, Any]: Prepared data for analysis
    """
    total = len(messages)

    # Sample messages for analysis (last 50)
    sample_messages = (
        messages[-MAX_SAMPLE_MESSAGES:]
        if len(messages) > MAX_SAMPLE_MESSAGES
        else messages
    )

    # Build message text
    messages_text = "\n".join(
        [
            f"- {msg.get('user_name', 'User')}: {msg.get('text', '')[:MAX_MESSAGE_PREVIEW_LENGTH]}"
            for msg in sample_messages
            if msg.get("text")
        ][:MAX_DISPLAY_MESSAGES]
    )  # Limit to 30 messages

    # Count sentiments if available
    sentiments = {SENTIMENT_POSITIVE: 0, SENTIMENT_NEGATIVE: 0, SENTIMENT_NEUTRAL: 0}

    for msg in messages:
        sentiment = msg.get("sentiment", SENTIMENT_NEUTRAL)
        sentiments[sentiment] = sentiments.get(sentiment, 0) + 1

    return {
        "group_name": group_name,
        "total": total,
        "sentiments": sentiments,
        "messages_text": messages_text,
    }


def _generate_ai_group_insights(data: Dict[str, Any]) -> str:
    """
    Generate group insights using AI.

    Args:
        data: Prepared analysis data

    Returns:
        str: AI-generated insights
    """
    group_name = data["group_name"]
    total = data["total"]
    sentiments = data["sentiments"]
    messages_text = data["messages_text"]

    prompt = f"""Analyze these Telegram group messages and provide insights in Uzbek language:

**Guruh:** {group_name}
**Jami xabarlar:** {total}
**Sentiment:** Positive: {sentiments[SENTIMENT_POSITIVE]}, Negative: {sentiments[SENTIMENT_NEGATIVE]}, Neutral: {sentiments[SENTIMENT_NEUTRAL]}

**Xabarlar namunasi:**
{messages_text}

Quyidagi formatda javob bering (Uzbek tilida):

📊 **{group_name} - Tahlil**

✅ **Umumiy ko'rsatkichlar:**
[2-3 asosiy statistika]

💬 **Asosiy mavzular:**
[3-5 mavzu]

📈 **Trendlar va kuzatishlar:**
[2-3 muhim trend]

⚡ **Tavsiyalar:**
[1-2 amaliy tavsiya]

Faqat matn, JSON emas!"""

    response = model.generate_content(prompt)

    if response and hasattr(response, "text"):
        return response.text.strip()
    else:
        return _generate_fallback_group_insights_from_data(data)


def _generate_fallback_group_insights(
    messages: List[Dict[str, Any]], group_name: str
) -> str:
    """
    Generate fallback insights without AI.

    Args:
        messages: List of message dictionaries
        group_name: Name of the group

    Returns:
        str: Formatted fallback insights
    """
    # Prepare data
    data = _prepare_group_analysis_data(messages, group_name)
    return _generate_fallback_group_insights_from_data(data)


def _generate_fallback_group_insights_from_data(data: Dict[str, Any]) -> str:
    """
    Generate fallback insights from prepared data.

    Args:
        data: Prepared analysis data

    Returns:
        str: Formatted fallback insights
    """
    group_name = data["group_name"]
    total = data["total"]
    sentiments = data["sentiments"]

    # Count users
    unique_users = set()
    for msg in data.get("messages", []):
        if msg.get("user_name"):
            unique_users.add(msg.get("user_name"))

    positive_percent = round(
        sentiments[SENTIMENT_POSITIVE] / total * 100 if total > 0 else 0, 1
    )

    # Determine activity level
    if total > HIGH_ACTIVITY_THRESHOLD:
        activity = "🔥 Yuqori faollik"
    elif total > MEDIUM_ACTIVITY_THRESHOLD:
        activity = "📊 O'rtacha faollik"
    else:
        activity = "📉 Past faollik"

    # Determine sentiment mood
    mood = (
        "😊 Ijobiy muhit"
        if sentiments[SENTIMENT_POSITIVE] > sentiments[SENTIMENT_NEGATIVE]
        else "😐 Neytral muhit"
    )

    insight = f"""📊 **{group_name} - Tahlil**

✅ **Umumiy ko'rsatkichlar:**
- Jami xabarlar: {total}
- Faol foydalanuvchilar: {len(unique_users)}
- Positive xabarlar: {sentiments[SENTIMENT_POSITIVE]} ({positive_percent}%)

📈 **Faollik:**
{activity}

💬 **Sentiment:**
{mood}
"""
    return insight


# ==========================================
# WEEKLY INSIGHTS
# ==========================================

# Weekly insights constants
WEEKLY_MAX_SAMPLE_MESSAGES = 30
WEEKLY_MAX_DISPLAY_MESSAGES = 20
WEEKLY_MAX_MESSAGE_PREVIEW_LENGTH = 80
DAYS_IN_WEEK = 7
NO_DATA_MESSAGE = "📊 Hali tahlil qilish uchun yetarli xabar yo'q."


def generate_weekly_insights(data: Dict[str, Any]) -> str:
    """
    Generate weekly insights from aggregated data.

    Args:
        data: Dictionary containing aggregated message data

    Returns:
        str: Formatted weekly insights in Uzbek language
    """
    if not GEMINI_AVAILABLE:
        return _generate_fallback_weekly_insights(data)

    try:
        message_count = data.get("total_messages", 0)

        # Return early if no messages
        if message_count == 0:
            return NO_DATA_MESSAGE

        # Prepare data for analysis
        analysis_data = _prepare_weekly_analysis_data(data)

        # Generate insights using AI
        return _generate_ai_weekly_insights(analysis_data)
    except Exception as e:
        print(f"❌ Weekly insights error: {e}")
        return _generate_fallback_weekly_insights(data)


def _prepare_weekly_analysis_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepare data for weekly analysis.

    Args:
        data: Raw data dictionary

    Returns:
        Dict[str, Any]: Prepared data for analysis
    """
    message_count = data.get("total_messages", 0)
    messages = data.get("messages", [])
    groups = data.get("groups", [])
    users = data.get("users", [])

    # Sample messages
    sample_messages = (
        messages[-WEEKLY_MAX_SAMPLE_MESSAGES:]
        if len(messages) > WEEKLY_MAX_SAMPLE_MESSAGES
        else messages
    )
    messages_text = "\n".join(
        [
            f"- {msg.get('user', 'User')}: {msg.get('text', '')[:WEEKLY_MAX_MESSAGE_PREVIEW_LENGTH]}"
            for msg in sample_messages
            if msg.get("text")
        ][:WEEKLY_MAX_DISPLAY_MESSAGES]
    )

    return {
        "message_count": message_count,
        "messages": messages,
        "groups": groups,
        "users": users,
        "messages_text": messages_text,
    }


def _generate_ai_weekly_insights(data: Dict[str, Any]) -> str:
    """
    Generate weekly insights using AI.

    Args:
        data: Prepared analysis data

    Returns:
        str: AI-generated insights
    """
    message_count = data["message_count"]
    groups = data.get("groups", [])
    users = data.get("users", [])
    messages_text = data["messages_text"]

    prompt = f"""Oxirgi haftaning Telegram xabarlarini tahlil qiling (Uzbek tilida):

**Statistika:**
- Jami xabarlar: {message_count}
- Guruhlar: {len(groups)}
- Faol foydalanuvchilar: {len(users)}

**Xabarlar:**
{messages_text}

Formatda javob bering:

📊 **Haftalik Tahlil**

✅ **Ko'rsatkichlar:**
[2-3 asosiy statistika]

💬 **Mavzular:**
[3-4 asosiy mavzu]

📈 **Trendlar:**
[2-3 trend]

⚡ **Tavsiyalar:**
[1-2 tavsiya]

Faqat matn!"""

    response = model.generate_content(prompt)

    if response and hasattr(response, "text"):
        return response.text.strip()
    else:
        return _generate_fallback_weekly_insights_from_data(data)


def _generate_fallback_weekly_insights(data: Dict[str, Any]) -> str:
    """
    Generate fallback weekly insights without AI.

    Args:
        data: Raw data dictionary

    Returns:
        str: Formatted fallback insights
    """
    # Prepare data
    analysis_data = _prepare_weekly_analysis_data(data)
    return _generate_fallback_weekly_insights_from_data(analysis_data)


def _generate_fallback_weekly_insights_from_data(data: Dict[str, Any]) -> str:
    """
    Generate fallback weekly insights from prepared data.

    Args:
        data: Prepared analysis data

    Returns:
        str: Formatted fallback insights
    """
    message_count = data["message_count"]
    messages = data.get("messages", [])

    # Count unique users
    unique_users = set()
    for msg in messages:
        if msg.get("user"):
            unique_users.add(msg.get("user"))

    # Calculate daily average
    avg_daily = round(message_count / DAYS_IN_WEEK, 1)

    # Determine activity level
    if message_count > HIGH_ACTIVITY_THRESHOLD:
        activity = "🔥 Yuqori"
    elif message_count > MEDIUM_ACTIVITY_THRESHOLD:
        activity = "📊 O'rtacha"
    else:
        activity = "📉 Past"

    insight = f"""📊 **Haftalik Tahlil**

✅ **Ko'rsatkichlar:**
- Jami xabarlar: {message_count}
- Faol foydalanuvchilar: {len(unique_users)}
- Kunlik o'rtacha: {avg_daily} xabar

📈 **Faollik:** {activity}
"""
    return insight


# ==========================================
# UTILITY FUNCTIONS
# ==========================================


def is_gemini_available() -> bool:
    """
    Check if Gemini AI is available.

    Returns:
        bool: True if Gemini AI is available and configured, False otherwise
    """
    return GEMINI_AVAILABLE


def get_api_status() -> Dict[str, Any]:
    """
    Get Gemini API status information.

    Returns:
        Dict[str, Any]: Dictionary containing API status information:
            - available: Whether Gemini AI is available
            - api_key_configured: Whether API key is configured
            - model: The model name if available, None otherwise
    """
    return {
        "available": GEMINI_AVAILABLE,
        "api_key_configured": bool(os.getenv(ENV_API_KEY)),
        "model": MODEL_NAME if GEMINI_AVAILABLE else None,
    }
