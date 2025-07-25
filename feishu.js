export default async function handler(req, res) {
  const { type, challenge, event } = req.body;

  // 1. 飞书服务器校验
  if (type === 'url_verification') {
    return res.status(200).json({ challenge });
  }

  // 2. 用户发送消息事件处理
  if (type === 'event_callback' && event && event.message) {
    const userMsg = event.message.content;
    const replyText = await getChatGPTReply(userMsg); // 下面定义这个函数

    await sendFeishuReply(event.message.chat_id, replyText);
    return res.status(200).send('ok');
  }

  res.status(200).send('ignored');
}

async function getChatGPTReply(message) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "ChatGPT 出错了，请稍后再试。";
}

async function sendFeishuReply(chatId, text) {
  await fetch("https://open.feishu.cn/open-apis/im/v1/messages", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.FEISHU_BOT_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      receive_id_type: "chat_id",
      receive_id: chatId,
      content: JSON.stringify({ text }),
      msg_type: "text",
    }),
  });
}
