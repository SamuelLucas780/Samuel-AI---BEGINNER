import "dotenv/config";
import express from "express";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.post("/api/chat", async (req, res) => {
  try {
    if (!client) {
      return res.status(503).json({
        error: "A IA ainda não foi conectada. Configure OPENAI_API_KEY no arquivo .env."
      });
    }

    const { messages } = req.body ?? {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Envie uma conversa válida." });
    }

    // Limita o histórico enviado para controlar custo e tamanho da solicitação.
    const safeMessages = messages.slice(-20).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content ?? "").slice(0, 6000)
    })).filter((m) => m.content.trim());

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-6-astra",
      instructions:
        "Você é SAMUEL AI, um assistente prestativo, claro, respeitoso e criativo. " +
        "Responda em português do Brasil por padrão. Explique assuntos difíceis de forma simples. " +
        "Não invente fatos; quando não souber, diga isso. Nunca peça senhas, chaves ou dados pessoais desnecessários.",
      input: safeMessages
    });

    res.json({ reply: response.output_text || "Não consegui gerar uma resposta agora." });
  } catch (error) {
    console.error("Erro na API:", error?.message || error);
    res.status(500).json({ error: "Ocorreu um erro ao conversar com a IA. Tente novamente." });
  }
});

app.listen(port, () => {
  console.log(`SAMUEL AI disponível em http://localhost:${port}`);
});
