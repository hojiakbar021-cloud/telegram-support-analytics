from rest_framework import serializers

from core.models import Message, MessageAnalysis, TelegramGroup, TelegramUser


class TelegramUserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = TelegramUser
        fields = [
            "id",
            "telegram_id",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "is_bot",
            "department",
            "created_at",
            "updated_at",
        ]


class TelegramGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = TelegramGroup
        fields = [
            "id",
            "telegram_id",
            "title",
            "username",
            "description",
            "member_count",
            "created_at",
            "updated_at",
        ]


class MessageAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageAnalysis
        fields = [
            "id",
            "topic",
            "category",
            "sentiment",
            "sentiment_score",
            "intent",
            "keywords",
            "regex_matches",
            "is_question",
            "analyzed_at",
        ]


class MessageSerializer(serializers.ModelSerializer):
    user = TelegramUserSerializer(read_only=True)
    group = TelegramGroupSerializer(read_only=True)
    analysis = MessageAnalysisSerializer(read_only=True)
    has_media = serializers.BooleanField(read_only=True)
    is_reply = serializers.BooleanField(read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "message_id",
            "user",
            "group",
            "text",
            "media_type",
            "media_file_id",
            "media_file_unique_id",
            "media_file_size",
            "media_mime_type",
            "reply_to_message_id",
            "forward_from_user_id",
            "forward_from_chat_id",
            "is_deleted",
            "is_edited",
            "telegram_created_at",
            "telegram_edited_at",
            "created_at",
            "updated_at",
            "has_media",
            "is_reply",
            "analysis",
        ]


class MessageListSerializer(serializers.ModelSerializer):
    """List view uchun oddiy serializer (tezroq)"""

    user_name = serializers.CharField(source="user.full_name", read_only=True)
    group_name = serializers.CharField(source="group.title", read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "message_id",
            "user_name",
            "group_name",
            "text",
            "media_type",
            "is_deleted",
            "is_edited",
            "telegram_created_at",
        ]
