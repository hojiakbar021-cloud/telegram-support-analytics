import re
from collections import Counter
from typing import Dict, List, Optional

# Savol so'zlari
QUESTION_WORDS = [
    "qanday",
    "nima",
    "qachon",
    "qayer",
    "kim",
    "nega",
    "nechta",
    "qaysi",
    "how",
    "what",
    "when",
    "where",
    "who",
    "why",
    "which",
    "how many",
    "?",
]

# Topic keywords (HR bilan bog'liq)
TOPIC_KEYWORDS = {
    "salary": ["maosh", "oylik", "ish haqi", "salary", "payment", "pay", "pul"],
    "vacation": ["ta'til", "dam olish", "vacation", "holiday", "отпуск"],
    "sick_leave": ["kasallik", "bemor", "sick", "болен", "больничный"],
    "contract": ["shartnoma", "kontrakt", "contract", "договор"],
    "document": ["hujjat", "dokument", "document", "справка", "документ"],
    "schedule": ["jadval", "ish vaqti", "schedule", "working hours", "график"],
    "resignation": ["ishdan ketish", "resign", "quit", "увольнение"],
    "bonus": ["bonus", "mukofot", "премия", "reward"],
    "training": ["treining", "o'qitish", "training", "обучение"],
    "insurance": ["sug'urta", "insurance", "страховка"],
}

# Sentiment keywords
POSITIVE_WORDS = [
    "yaxshi",
    "ajoyib",
    "zo'r",
    "rahmat",
    "good",
    "great",
    "thanks",
    "отлично",
    "спасибо",
]
NEGATIVE_WORDS = [
    "yomon",
    "muammo",
    "xato",
    "bad",
    "problem",
    "error",
    "issue",
    "плохо",
    "проблема",
]


def is_question(text: str) -> bool:
    """Matn savolmi?"""
    if not text:
        return False

    text_lower = text.lower()

    # Savol belgisi bormi?
    if "?" in text:
        return True

    # Savol so'zi bormi?
    for word in QUESTION_WORDS:
        if word in text_lower:
            return True

    return False


def detect_topic(text: str) -> Optional[str]:
    """Matn qaysi mavzuga tegishli?"""
    if not text:
        return None

    text_lower = text.lower()

    # Har bir topic bo'yicha tekshirish
    topic_scores = {}
    for topic, keywords in TOPIC_KEYWORDS.items():
        score = sum(1 for keyword in keywords if keyword in text_lower)
        if score > 0:
            topic_scores[topic] = score

    # Eng ko'p mos kelgan topicni qaytarish
    if topic_scores:
        return max(topic_scores, key=topic_scores.get)

    return None


def detect_sentiment(text: str) -> tuple[str, float]:
    """Sentiment aniqlash (oddiy regex-based)"""
    if not text:
        return "neutral", 0.5

    text_lower = text.lower()

    # Savol bo'lsa, sentiment 'question'
    if is_question(text):
        return "question", 0.5

    # Positive va negative so'zlarni sanash
    positive_count = sum(1 for word in POSITIVE_WORDS if word in text_lower)
    negative_count = sum(1 for word in NEGATIVE_WORDS if word in text_lower)

    # Sentiment aniqlash
    if positive_count > negative_count:
        score = min(0.5 + (positive_count * 0.1), 1.0)
        return "positive", score
    elif negative_count > positive_count:
        score = max(0.5 - (negative_count * 0.1), 0.0)
        return "negative", score
    else:
        return "neutral", 0.5


def extract_keywords(text: str, top_n: int = 5) -> List[str]:
    """Matndan kalit so'zlarni ajratib olish"""
    if not text:
        return []

    # Stop words (keraksiz so'zlar)
    stop_words = {
        "va",
        "yoki",
        "lekin",
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
    }

    # So'zlarga bo'lish va tozalash
    words = re.findall(r"\b\w+\b", text.lower())

    # Stop words va qisqa so'zlarni olib tashlash
    words = [w for w in words if w not in stop_words and len(w) > 2]

    # Eng ko'p uchraganlarni topish
    word_counts = Counter(words)
    top_words = [word for word, count in word_counts.most_common(top_n)]

    return top_words


def analyze_message(text: str) -> Dict:
    """Matnni to'liq tahlil qilish"""
    if not text:
        return {
            "is_question": False,
            "topic": None,
            "sentiment": "neutral",
            "sentiment_score": 0.5,
            "keywords": [],
        }

    sentiment, score = detect_sentiment(text)

    return {
        "is_question": is_question(text),
        "topic": detect_topic(text),
        "sentiment": sentiment,
        "sentiment_score": score,
        "keywords": extract_keywords(text),
    }
