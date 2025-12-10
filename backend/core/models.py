from django.db import models


class TelegramUser(models.Model):
    """Telegram foydalanuvchilari"""

    telegram_id = models.BigIntegerField(unique=True, db_index=True)
    username = models.CharField(max_length=255, null=True, blank=True)
    first_name = models.CharField(max_length=255, null=True, blank=True)
    last_name = models.CharField(max_length=255, null=True, blank=True)
    is_bot = models.BooleanField(default=False)
    department = models.CharField(max_length=255, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "telegram_users"
        ordering = ["-created_at"]
        verbose_name = "Telegram User"
        verbose_name_plural = "Telegram Users"

    def __str__(self):
        return f"@{self.username}" if self.username else f"User {self.telegram_id}"

    @property
    def full_name(self):
        """To'liq ism"""
        parts = [self.first_name, self.last_name]
        return " ".join([p for p in parts if p]) or f"User {self.telegram_id}"


class TelegramGroup(models.Model):
    """Telegram guruhlari"""

    telegram_id = models.BigIntegerField(unique=True, db_index=True)
    title = models.CharField(max_length=255)
    username = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    member_count = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "telegram_groups"
        ordering = ["-created_at"]
        verbose_name = "Telegram Group"
        verbose_name_plural = "Telegram Groups"

    def __str__(self):
        return self.title


class Message(models.Model):
    """Guruhdan kelgan xabarlar"""

    MEDIA_TYPES = (
        ("text", "Text"),
        ("emoji", "Emoji"),
        ("photo", "Photo"),
        ("video", "Video"),
        ("audio", "Audio"),
        ("voice", "Voice"),
        ("document", "Document"),
        ("sticker", "Sticker"),
        ("animation", "Animation"),
        ("video_note", "Video Note"),
        ("location", "Location"),
        ("contact", "Contact"),
        ("poll", "Poll"),
        ("other", "Other"),
    )

    message_id = models.BigIntegerField(db_index=True)
    user = models.ForeignKey(
        TelegramUser, on_delete=models.CASCADE, related_name="messages"
    )
    group = models.ForeignKey(
        TelegramGroup, on_delete=models.CASCADE, related_name="messages"
    )

    text = models.TextField(null=True, blank=True)
    media_type = models.CharField(
        max_length=20, choices=MEDIA_TYPES, default="text", db_index=True
    )

    media_file_id = models.CharField(max_length=255, null=True, blank=True)
    media_file_unique_id = models.CharField(max_length=255, null=True, blank=True)
    media_file_size = models.BigIntegerField(null=True, blank=True)
    media_mime_type = models.CharField(max_length=100, null=True, blank=True)

    media_file_path = models.CharField(
        max_length=500,
        null=True,
        blank=True,
        help_text="Local file path relative to MEDIA_ROOT: telegram/2024/12/10/photo_123.jpg",
    )
    media_file_name = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Original file name: photo_123.jpg",
    )

    reply_to_message_id = models.BigIntegerField(null=True, blank=True, db_index=True)
    reply_to = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="replies",
        db_column="reply_to_id",
    )

    forward_from_user_id = models.BigIntegerField(null=True, blank=True)
    forward_from_chat_id = models.BigIntegerField(null=True, blank=True)

    raw_json = models.JSONField(null=True, blank=True)

    is_deleted = models.BooleanField(default=False, db_index=True)
    is_edited = models.BooleanField(default=False, db_index=True)

    telegram_created_at = models.DateTimeField()
    telegram_edited_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    sentiment = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        db_index=True,
        help_text="AI-detected sentiment: positive, negative, neutral",
    )

    topics = models.JSONField(
        null=True,
        blank=True,
        help_text="AI-extracted topics/keywords list: ['yordam', 'savol']",
    )

    ai_processed = models.BooleanField(
        default=False, db_index=True, help_text="Whether AI analysis completed"
    )

    ai_processed_at = models.DateTimeField(
        null=True, blank=True, help_text="When AI analysis was performed"
    )

    ai_error = models.TextField(
        null=True, blank=True, help_text="AI processing error if any"
    )

    class Meta:
        db_table = "messages"
        ordering = ["-telegram_created_at"]
        unique_together = ["message_id", "group"]
        verbose_name = "Message"
        verbose_name_plural = "Messages"
        indexes = [
            models.Index(fields=["group", "-telegram_created_at"]),
            models.Index(fields=["user", "-telegram_created_at"]),
            models.Index(fields=["media_type", "-telegram_created_at"]),
            models.Index(fields=["sentiment"]),
            models.Index(fields=["ai_processed"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["message_id", "group"], name="unique_message_per_group"
            )
        ]

    def __str__(self):
        text_preview = self.text[:50] if self.text else f"[{self.media_type}]"
        return f"Message {self.message_id} - {text_preview}"

    @property
    def has_media(self):
        """Media bormi?"""
        return self.media_type != "text"

    @property
    def is_reply(self):
        """Reply xabarmi?"""
        return self.reply_to_message_id is not None

    @property
    def has_local_file(self):
        """Local file mavjudmi?"""
        if not self.media_file_path:
            return False
        import os

        from django.conf import settings

        file_path = os.path.join(settings.MEDIA_ROOT, self.media_file_path)
        return os.path.exists(file_path)


class MessageAnalysis(models.Model):
    """Xabarlar tahlili (AI-powered)"""

    SENTIMENT_CHOICES = (
        ("positive", "Positive"),
        ("negative", "Negative"),
        ("neutral", "Neutral"),
        ("question", "Question"),
    )

    INTENT_CHOICES = (
        ("question", "Question"),
        ("complaint", "Complaint"),
        ("request", "Request"),
        ("feedback", "Feedback"),
        ("greeting", "Greeting"),
        ("other", "Other"),
    )

    message = models.OneToOneField(
        Message, on_delete=models.CASCADE, related_name="analysis"
    )

    topic = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    category = models.CharField(max_length=100, null=True, blank=True, db_index=True)

    sentiment = models.CharField(
        max_length=20,
        choices=SENTIMENT_CHOICES,
        null=True,
        blank=True,
        db_index=True,
        help_text="AI-detected sentiment",
    )
    sentiment_score = models.FloatField(
        null=True, blank=True, help_text="Numeric score: -1.0 to 1.0"
    )

    intent = models.CharField(
        max_length=100,
        choices=INTENT_CHOICES,
        null=True,
        blank=True,
        db_index=True,
        help_text="AI-detected user intent",
    )

    keywords = models.JSONField(
        null=True,
        blank=True,
        help_text="AI-extracted keywords list: ['yordam', 'savol', 'PDF']",
    )

    regex_matches = models.JSONField(
        null=True, blank=True, help_text="Legacy regex matches (deprecated)"
    )

    is_question = models.BooleanField(
        default=False, db_index=True, help_text="Is this a question? (AI-detected)"
    )

    analyzed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "message_analysis"
        ordering = ["-analyzed_at"]
        verbose_name = "Message Analysis"
        verbose_name_plural = "Message Analyses"
        indexes = [
            models.Index(fields=["intent"]),
        ]

    def __str__(self):
        return f"Analysis for Message {self.message.message_id}"

    @property
    def keywords_list(self):
        """Get keywords as list"""
        if isinstance(self.keywords, list):
            return self.keywords
        return []


class MessageHistory(models.Model):
    """Xabar tahrir tarixi"""

    message = models.ForeignKey(
        Message, on_delete=models.CASCADE, related_name="edit_history"
    )

    old_text = models.TextField(null=True, blank=True)

    new_text = models.TextField(null=True, blank=True)

    edited_at = models.DateTimeField(auto_now_add=True)

    edit_metadata = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = "message_history"
        ordering = ["-edited_at"]
        verbose_name = "Message History"
        verbose_name_plural = "Message Histories"

    def __str__(self):
        return f"Edit history for Message {self.message.message_id} at {self.edited_at}"
