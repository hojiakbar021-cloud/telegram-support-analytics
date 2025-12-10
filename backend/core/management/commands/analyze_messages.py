# backend/core/management/commands/analyze_messages.py
# Django management command to analyze all messages with AI

from django.core.management.base import BaseCommand
from django.db.models import Q

from analytics.gemini_ai import analyze_sentiment_batch
from core.models import Message


class Command(BaseCommand):
    help = "Analyze all messages with AI (sentiment, topics, etc.)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--batch-size",
            type=int,
            default=50,
            help="Number of messages to process at once",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Maximum number of messages to process (default: all)",
        )

    def handle(self, *args, **options):
        batch_size = options["batch_size"]
        limit = options["limit"]

        # Get messages that haven't been analyzed yet
        messages = (
            Message.objects.filter(Q(sentiment__isnull=True) | Q(sentiment=""))
            .exclude(text__isnull=True)
            .exclude(text="")
            .order_by("-telegram_created_at")
        )

        if limit:
            messages = messages[:limit]

        total = messages.count()
        self.stdout.write(f"📊 Found {total} messages to analyze")

        if total == 0:
            self.stdout.write(self.style.SUCCESS("✅ All messages already analyzed!"))
            return

        processed = 0
        updated = 0

        # Process in batches
        for i in range(0, total, batch_size):
            batch = messages[i : i + batch_size]
            texts = [msg.text for msg in batch if msg.text]

            self.stdout.write(
                f"🔄 Processing batch {i//batch_size + 1}/{(total-1)//batch_size + 1}..."
            )

            try:
                # Analyze sentiments
                sentiments = analyze_sentiment_batch(texts)

                # Update messages
                for msg, sentiment in zip(batch, sentiments):
                    if sentiment and sentiment != "neutral":
                        msg.sentiment = sentiment
                        msg.save(update_fields=["sentiment"])
                        updated += 1
                    processed += 1

                self.stdout.write(f"✅ Processed {processed}/{total} messages")

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"❌ Error processing batch: {e}"))
                continue

        self.stdout.write(
            self.style.SUCCESS(f"🎉 Done! Updated {updated}/{processed} messages")
        )
        self.stdout.write(
            self.style.WARNING(
                f"ℹ️  {processed - updated} messages were neutral or failed"
            )
        )
