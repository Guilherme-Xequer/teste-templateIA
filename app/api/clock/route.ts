import { gateway } from "@ai-sdk/gateway";
import { streamText } from "ai";

// Configuração CORS para permitir requisições do relógio
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// API principal para o relógio
export async function POST(request: Request) {
  try {
    const { message, model = "google/gemini-2.5-flash-lite" } = await request.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Mensagem é obrigatória" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // System prompt otimizado para respostas rápidas no relógio
    const systemPrompt = `Você é um assistente de estudos pessoal para um estudante de engenharia.
Suas respostas devem ser:
- CURTAS e DIRETAS (o usuário está lendo em um relógio)
- Focadas em matemática, física, cálculo, álgebra, banco de dados e engenharia
- Sem enrolação - vá direto ao ponto
- Use fórmulas quando necessário, mas explique de forma simples

Se for uma pergunta complexa, dê a resposta resumida primeiro, depois explique brevemente.`;

    const result = streamText({
      model: gateway.languageModel(model),
      system: systemPrompt,
      messages: [{ role: "user", content: message }],
      maxTokens: 500, // Respostas curtas para o relógio
    });

    // Retorna streaming para respostas mais rápidas
    return result.toDataStreamResponse({
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Erro na API Clock:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

// Endpoint GET para testar se a API está funcionando
export async function GET() {
  return new Response(
    JSON.stringify({
      status: "online",
      message: "API Clock funcionando! Use POST para enviar mensagens.",
      usage: {
        method: "POST",
        body: {
          message: "sua pergunta aqui",
          model: "google/gemini-2.5-flash-lite (opcional)",
        },
      },
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
