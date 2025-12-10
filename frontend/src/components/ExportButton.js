import React from 'react';
import { Download } from 'lucide-react';

function ExportButton({ data, filename = 'export', darkMode = false }) {
  const exportToCSV = () => {
    if (!data || data.length === 0) {
      alert("Ma'lumot yo'q!");
      return;
    }

    const selectedFields = [
      {
        label: 'ID',
        getValue: (item) => item.message_id || '-',
      },
      {
        label: 'Foydalanuvchi',
        getValue: (item) => {
          return (
            item.user?.full_name ||
            item.user?.first_name ||
            item.user?.username ||
            '-'
          );
        },
      },
      {
        label: 'Guruh',
        getValue: (item) => {
          return item.group?.title || item.group?.name || '-';
        },
      },
      {
        label: 'Xabar',
        getValue: (item) => item.text || '-',
      },
      {
        label: 'Media',
        getValue: (item) => item.media_type || 'text',
      },
      {
        label: 'Kayfiyat',
        getValue: (item) => item.sentiment || 'neutral',
      },
      {
        label: 'Sana',
        getValue: (item) => {
          const value = item.telegram_created_at;
          if (!value) return '-';

          try {
            const date = new Date(value);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${day}.${month}.${year} ${hours}:${minutes}`;
          } catch (e) {
            return '-';
          }
        },
      },
      {
        label: 'Tahrirlangan',
        getValue: (item) => (item.is_edited ? 'Ha' : 'Yoq'),
      },
      {
        label: 'Ochirilgan',
        getValue: (item) => (item.is_deleted ? 'Ha' : 'Yoq'),
      },
      {
        label: 'Javob',
        getValue: (item) => item.reply_to_message_id || '-',
      },
    ];

    const headers = selectedFields.map((f) => f.label).join(',');

    const rows = data
      .map((item) => {
        return selectedFields
          .map((field) => {
            let value = field.getValue(item);

            let stringValue = String(value).trim();

            stringValue = stringValue.replace(/[\n\r]+/g, ' ');

            stringValue = stringValue.replace(/\s+/g, ' ');

            if (stringValue.includes(',') || stringValue.includes('"')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }

            return stringValue;
          })
          .join(',');
      })
      .join('\n');

    const csv = `${headers}\n${rows}`;

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${timestamp}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={exportToCSV}
      className={`inline-flex items-center px-4 py-2 font-semibold rounded-lg shadow transition ${
        darkMode
          ? 'bg-green-600 hover:bg-green-700 text-white'
          : 'bg-green-600 hover:bg-green-700 text-white'
      }`}
      title="CSV formatida yuklab olish"
    >
      <Download className="w-4 h-4 mr-2" />
      CSV Eksport
    </button>
  );
}

export default ExportButton;
