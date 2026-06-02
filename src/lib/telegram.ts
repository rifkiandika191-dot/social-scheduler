// Pengiriman notifikasi via Telegram Bot API.
// Set TELEGRAM_BOT_TOKEN (dari @BotFather) dan TELEGRAM_CHAT_ID di .env.
// Jika belum diisi, pesan hanya di-log (mode mock).

export async function sendTelegram(text: string): Promise<{ success: boolean; mock?: boolean; error?: unknown }> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    console.log('[Telegram Mock - set TELEGRAM_BOT_TOKEN & TELEGRAM_CHAT_ID untuk kirim sungguhan]', text)
    return { success: true, mock: true }
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      console.error('Telegram error:', res.status, body)
      return { success: false, error: body }
    }
    return { success: true }
  } catch (error) {
    console.error('Telegram error:', error)
    return { success: false, error }
  }
}
