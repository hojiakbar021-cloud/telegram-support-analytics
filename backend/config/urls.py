# backend/config/urls.py

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path

from analytics import views as analytics_views
from analytics.views import ai_insights, ai_sentiment_analysis
from telegram_bot.message_views import MessageViewSet
from telegram_bot.views import proxy_telegram_file  # ✅ ADD THIS
from telegram_bot.views import (bulk_mark_deleted, get_message_history,
                                get_telegram_file, get_telegram_media_url,
                                group_comparison, mark_message_deleted,
                                telegram_webhook, test_telegram_file)

# ViewSet views
message_list_view = MessageViewSet.as_view({"get": "list"})
message_detail_view = MessageViewSet.as_view({"get": "retrieve"})

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/telegram/webhook/", telegram_webhook, name="telegram-webhook"),
    # Messages
    path("api/messages/", message_list_view, name="message-list"),
    path("api/messages/<int:message_id>/", message_detail_view, name="message-detail"),
    path(
        "api/messages/<int:message_id>/history/",
        get_message_history,
        name="message-history",
    ),
    # ✅ Media endpoints - ORDER MATTERS!
    path(
        "api/messages/<int:message_id>/file/test/", test_telegram_file, name="test-file"
    ),
    path(
        "api/messages/<int:message_id>/file/", get_telegram_file, name="telegram-file"
    ),
    path(
        "api/messages/<int:message_id>/media-url/",
        get_telegram_media_url,
        name="telegram-media-url",
    ),
    path(
        "api/messages/<int:message_id>/proxy/", proxy_telegram_file, name="proxy-file"
    ),  # ✅ ADD THIS
    path(
        "api/messages/<int:message_id>/delete/",
        mark_message_deleted,
        name="mark-deleted",
    ),
    path("api/messages/bulk-delete/", bulk_mark_deleted, name="bulk-delete"),
    # Analytics
    path("api/stats/overview/", analytics_views.stats_overview, name="stats-overview"),
    path("api/stats/top-users/", analytics_views.top_active_users, name="top-users"),
    path(
        "api/stats/word-frequency/",
        analytics_views.word_frequency,
        name="word-frequency",
    ),
    path(
        "api/stats/messages-per-day/",
        analytics_views.messages_per_day,
        name="messages-per-day",
    ),
    path(
        "api/stats/messages-per-hour/",
        analytics_views.messages_per_hour,
        name="messages-per-hour",
    ),
    path(
        "api/stats/media-distribution/",
        analytics_views.media_distribution,
        name="media-distribution",
    ),
    path("api/stats/top-topics/", analytics_views.top_topics, name="top-topics"),
    path(
        "api/stats/sentiment-overall/",
        analytics_views.sentiment_overall,
        name="sentiment-overall",
    ),
    path(
        "api/stats/reply-chain/", analytics_views.reply_chain_stats, name="reply-chain"
    ),
    path(
        "api/stats/user/<int:user_id>/",
        analytics_views.user_profile,
        name="user-profile",
    ),
    path("api/stats/group-comparison/", group_comparison, name="group_comparison"),
    # AI
    path("api/ai/sentiment/", ai_sentiment_analysis, name="ai_sentiment"),
    path("api/ai/insights/", ai_insights, name="ai_insights"),
]

# Serve media files
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
