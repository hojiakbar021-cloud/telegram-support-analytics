from django.contrib import admin

from .models import (Message, MessageAnalysis, MessageHistory, TelegramGroup,
                     TelegramUser)


@admin.register(TelegramUser)
class TelegramUserAdmin(admin.ModelAdmin):
    list_display = [
        "telegram_id",
        "username",
        "full_name",
        "is_bot",
        "department",
        "created_at",
    ]
    list_filter = ["is_bot", "department", "created_at"]
    search_fields = ["telegram_id", "username", "first_name", "last_name"]
    ordering = ["-created_at"]


@admin.register(TelegramGroup)
class TelegramGroupAdmin(admin.ModelAdmin):
    list_display = ["telegram_id", "title", "username", "member_count", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["telegram_id", "title", "username"]
    ordering = ["-created_at"]


class MessageHistoryInline(admin.TabularInline):
    model = MessageHistory
    extra = 0
    readonly_fields = ["old_text", "new_text", "edited_at"]
    can_delete = False


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = [
        "message_id",
        "user",
        "group",
        "media_type",
        "text_preview",
        "is_deleted",
        "is_edited",
        "telegram_created_at",
    ]
    list_filter = [
        "media_type",
        "is_deleted",
        "is_edited",
        "group",
        "telegram_created_at",
    ]
    search_fields = ["message_id", "text", "user__username"]
    ordering = ["-telegram_created_at"]
    raw_id_fields = ["user", "group", "reply_to"]
    inlines = [MessageHistoryInline]

    def text_preview(self, obj):
        if obj.text:
            return obj.text[:50] + "..." if len(obj.text) > 50 else obj.text
        return f"[{obj.media_type}]"

    text_preview.short_description = "Text Preview"


@admin.register(MessageAnalysis)
class MessageAnalysisAdmin(admin.ModelAdmin):
    list_display = ["message", "topic", "sentiment", "is_question", "analyzed_at"]
    list_filter = ["sentiment", "is_question", "topic", "analyzed_at"]
    search_fields = ["message__text", "topic", "keywords"]
    ordering = ["-analyzed_at"]
    raw_id_fields = ["message"]


@admin.register(MessageHistory)
class MessageHistoryAdmin(admin.ModelAdmin):
    list_display = ["message", "old_text_preview", "new_text_preview", "edited_at"]
    list_filter = ["edited_at"]
    search_fields = ["message__text", "old_text", "new_text"]
    ordering = ["-edited_at"]
    raw_id_fields = ["message"]

    def old_text_preview(self, obj):
        if obj.old_text:
            return obj.old_text[:30] + "..." if len(obj.old_text) > 30 else obj.old_text
        return "-"

    old_text_preview.short_description = "Old Text"

    def new_text_preview(self, obj):
        if obj.new_text:
            return obj.new_text[:30] + "..." if len(obj.new_text) > 30 else obj.new_text
        return "-"

    new_text_preview.short_description = "New Text"
