import asyncio
import logging
import os
import re
from datetime import datetime
from pathlib import Path

import aiohttp
from aiogram import Bot, Dispatcher, F
from aiogram.filters import CommandStart
from aiogram.types import Message
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

if not BOT_TOKEN:
    raise ValueError("TELEGRAM_BOT_TOKEN topilmadi! .env.example faylini tekshiring.")
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
MEDIA_DIR = Path("media/telegram")
MEDIA_DIR.mkdir(parents=True, exist_ok=True)


async def download_media_file(message: Message, media_type: str) -> tuple:
    """
    Download media file from Telegram
    Returns: (file_path, file_name, file_size)
    """
    try:
        file_id = None
        file_name = None

        if media_type == "photo":
            photo = message.photo[-1]
            file_id = photo.file_id
            file_name = f"photo_{message.message_id}.jpg"

        elif media_type == "video":
            file_id = message.video.file_id
            file_name = message.video.file_name or f"video_{message.message_id}.mp4"

        elif media_type == "voice":
            file_id = message.voice.file_id
            file_name = f"voice_{message.message_id}.ogg"

        elif media_type == "audio":
            file_id = message.audio.file_id
            file_name = message.audio.file_name or f"audio_{message.message_id}.mp3"

        elif media_type == "document":
            file_id = message.document.file_id
            file_name = message.document.file_name or f"document_{message.message_id}"

        elif media_type == "sticker":
            file_id = message.sticker.file_id
            file_name = f"sticker_{message.message_id}.webp"

        elif media_type == "animation":
            file_id = message.animation.file_id
            file_name = (
                message.animation.file_name or f"animation_{message.message_id}.mp4"
            )

        elif media_type == "video_note":
            file_id = message.video_note.file_id
            file_name = f"video_note_{message.message_id}.mp4"

        if not file_id:
            logger.warning(f"No file_id for {media_type}")
            return None, None, None

        file = await bot.get_file(file_id)

        date_path = datetime.now().strftime("%Y/%m/%d")
        dir_path = MEDIA_DIR / date_path
        dir_path.mkdir(parents=True, exist_ok=True)

        file_path = dir_path / file_name

        await bot.download_file(file.file_path, file_path)

        file_size = file_path.stat().st_size

        relative_path = str(file_path.relative_to(MEDIA_DIR)).replace("\\", "/")

        logger.info(f"✅ Downloaded {media_type}: {relative_path} ({file_size} bytes)")

        return relative_path, file_name, file_size

    except Exception as e:
        logger.error(f"❌ Error downloading media: {e}")
        return None, None, None


async def send_to_backend(message_data: dict):
    """Xabarni backend'ga yuborish"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{BACKEND_URL}/api/telegram/webhook/",
                json=message_data,
                headers={"Content-Type": "application/json"},
                timeout=aiohttp.ClientTimeout(total=30),
            ) as response:
                if response.status == 200:
                    logger.info(
                        f"✅ Message {message_data.get('message_id')} sent to backend"
                    )
                else:
                    logger.error(f"❌ Backend error: {response.status}")
                    text = await response.text()
                    logger.error(f"Response: {text[:200]}")
    except asyncio.TimeoutError:
        logger.error(f"❌ Backend timeout")
    except Exception as e:
        logger.error(f"❌ Error sending to backend: {e}")


def detect_emoji_only(text: str) -> bool:
    """Check if text contains only emojis"""
    if not text:
        return False

    emoji_pattern = re.compile(
        "["
        "\U0001f600-\U0001f64f"
        "\U0001f300-\U0001f5ff"
        "\U0001f680-\U0001f6ff"
        "\U0001f700-\U0001f77f"
        "\U0001f780-\U0001f7ff"
        "\U0001f800-\U0001f8ff"
        "\U0001f900-\U0001f9ff"
        "\U0001fa00-\U0001fa6f"
        "\U0001fa70-\U0001faff"
        "\U00002702-\U000027b0"
        "\U000024c2-\U0001f251"
        "]+"
    )

    text_without_emoji = emoji_pattern.sub("", text.strip())
    return len(text_without_emoji) == 0 and len(text.strip()) > 0


async def extract_message_data(
    message: Message, event_type: str = "new_message"
) -> dict:
    """Telegram xabaridan kerakli ma'lumotlarni olish"""

    media_type = "text"
    media_file_id = None
    media_file_unique_id = None
    media_file_size = None
    media_mime_type = None
    media_file_path = None
    media_file_name = None

    if message.sticker:
        media_type = "sticker"
        media_file_id = message.sticker.file_id
        media_file_unique_id = message.sticker.file_unique_id
        media_file_size = message.sticker.file_size
    elif message.animation:
        media_type = "animation"
        media_file_id = message.animation.file_id
        media_file_unique_id = message.animation.file_unique_id
        media_file_size = message.animation.file_size
        media_mime_type = message.animation.mime_type
    elif message.photo:
        media_type = "photo"
        photo = message.photo[-1]
        media_file_id = photo.file_id
        media_file_unique_id = photo.file_unique_id
        media_file_size = photo.file_size
    elif message.video:
        media_type = "video"
        media_file_id = message.video.file_id
        media_file_unique_id = message.video.file_unique_id
        media_file_size = message.video.file_size
        media_mime_type = message.video.mime_type
    elif message.voice:
        media_type = "voice"
        media_file_id = message.voice.file_id
        media_file_unique_id = message.voice.file_unique_id
        media_file_size = message.voice.file_size
        media_mime_type = message.voice.mime_type
    elif message.audio:
        media_type = "audio"
        media_file_id = message.audio.file_id
        media_file_unique_id = message.audio.file_unique_id
        media_file_size = message.audio.file_size
        media_mime_type = message.audio.mime_type
    elif message.document:
        media_type = "document"
        media_file_id = message.document.file_id
        media_file_unique_id = message.document.file_unique_id
        media_file_size = message.document.file_size
        media_mime_type = message.document.mime_type
    elif message.video_note:
        media_type = "video_note"
        media_file_id = message.video_note.file_id
        media_file_unique_id = message.video_note.file_unique_id
        media_file_size = message.video_note.file_size
    elif message.location:
        media_type = "location"
    elif message.contact:
        media_type = "contact"
    elif message.poll:
        media_type = "poll"
    elif message.text:
        if detect_emoji_only(message.text):
            media_type = "emoji"

    if (
        media_type not in ["text", "emoji", "location", "contact", "poll"]
        and media_file_id
    ):
        try:
            logger.info(
                f"📥 Downloading {media_type} for message {message.message_id}..."
            )
            media_file_path, media_file_name, downloaded_size = (
                await download_media_file(message, media_type)
            )
            if media_file_path:
                logger.info(f"✅ Downloaded: {media_file_path}")
        except Exception as e:
            logger.error(f"❌ Failed to download media: {e}")

    def to_iso_string(dt):
        if dt is None:
            return None
        if isinstance(dt, datetime):
            return dt.isoformat()
        if isinstance(dt, int):
            return datetime.fromtimestamp(dt).isoformat()
        return str(dt)

    data = {
        "event_type": event_type,
        "is_edited": event_type == "edited_message",
        "message_id": message.message_id,
        "group_id": message.chat.id,
        "group_name": message.chat.title
        or message.chat.username
        or f"Chat {message.chat.id}",
        "sender_id": message.from_user.id,
        "sender_username": message.from_user.username,
        "sender_first_name": message.from_user.first_name,
        "sender_last_name": message.from_user.last_name,
        "is_bot": message.from_user.is_bot,
        "message_text": message.text or message.caption,
        "media_type": media_type,
        "media_file_id": media_file_id,
        "media_file_unique_id": media_file_unique_id,
        "media_file_size": media_file_size,
        "media_mime_type": media_mime_type,
        "media_file_path": media_file_path,
        "media_file_name": media_file_name,
        "reply_to_message_id": (
            message.reply_to_message.message_id if message.reply_to_message else None
        ),
        "forward_from_user_id": (
            message.forward_from.id if message.forward_from else None
        ),
        "forward_from_chat_id": (
            message.forward_from_chat.id if message.forward_from_chat else None
        ),
        "telegram_created_at": to_iso_string(message.date),
        "telegram_edited_at": to_iso_string(message.edit_date),
        "raw_json": message.model_dump_json(),
    }

    return data


@dp.message(F.chat.type.in_(["group", "supergroup"]))
async def handle_group_message(message: Message):
    """Guruh xabarlarini qabul qilish"""
    try:
        logger.info(
            f"📩 New message: {message.message_id} from {message.from_user.username or message.from_user.first_name}"
        )

        message_data = await extract_message_data(message, "new_message")

        await send_to_backend(message_data)

    except Exception as e:
        logger.exception(f"❌ Error processing message: {e}")


@dp.edited_message(F.chat.type.in_(["group", "supergroup"]))
async def handle_edited_message(message: Message):
    """✅ Tahrirlangan xabarlarni qabul qilish"""
    try:
        logger.info(
            f"✏️ Edited message: {message.message_id} from {message.from_user.username or message.from_user.first_name}"
        )

        message_data = await extract_message_data(message, "edited_message")

        await send_to_backend(message_data)

        logger.info(f"✅ Edit event sent to backend for message {message.message_id}")

    except Exception as e:
        logger.exception(f"❌ Error processing edited message: {e}")


@dp.message(CommandStart())
async def cmd_start(message: Message):
    """Start komandasi"""
    await message.answer(
        "👋 Salom! Men HR Support Analytics Bot.\n\n"
        "Meni guruhga admin sifatida qo'shing va men barcha xabarlarni tahlil qilaman.\n\n"
        "✅ Xabarlarni qabul qilaman\n"
        "✅ Tahrirlangan xabarlarni kuzataman\n"
        "✅ Media fayllarni yuklab olaman\n"
        "✅ AI tahlil qilaman"
    )


@dp.message()
async def handle_private_message(message: Message):
    """Private xabarlar (agar kerak bo'lsa)"""
    if message.chat.type == "private":
        await message.answer(
            "Salom! Meni guruhga qo'shing va barcha xabarlarni tahlil qilaman.\n\n"
            f"Backend: {BACKEND_URL}\n"
            f"Media saved: {MEDIA_DIR}"
        )


async def main():
    """Botni ishga tushirish"""
    logger.info("=" * 60)
    logger.info("🚀 HR Support Analytics Bot starting...")
    logger.info(f"📡 Backend URL: {BACKEND_URL}")
    logger.info(f"💾 Media directory: {MEDIA_DIR.absolute()}")
    logger.info("=" * 60)

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{BACKEND_URL}/api/stats/overview/",
                timeout=aiohttp.ClientTimeout(total=5),
            ) as response:
                if response.status == 200:
                    logger.info("✅ Backend connection successful")
                else:
                    logger.warning(f"⚠️ Backend returned status {response.status}")
    except Exception as e:
        logger.error(f"❌ Cannot connect to backend: {e}")
        logger.warning("⚠️ Bot will continue but messages won't be saved")

    logger.info("🔄 Starting polling...")
    await dp.start_polling(
        bot, allowed_updates=dp.resolve_used_update_types(), drop_pending_updates=True
    )


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\n👋 Bot stopped by user")
    except Exception as e:
        logger.exception(f"❌ Fatal error: {e}")
