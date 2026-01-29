import { tool } from "ai";
import { z } from "zod";

interface SearchResult {
  title: string;
  snippet: string;
  link: string;
}

// Fast DuckDuckGo search - most reliable
async function quickSearch(query: string): Promise<{ answer?: string; abstract?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);

  try {
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!response.ok) return {};
    const data = await response.json();

    return {
      answer: data.Answer || undefined,
      abstract: data.Abstract || undefined,
    };
  } catch {
    clearTimeout(timeout);
    return {};
  }
}

// Brave Search - if API key available
async function braveSearch(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);

  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
      {
        headers: { "X-Subscription-Token": apiKey, Accept: "application/json" },
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (!response.ok) return [];
    const data = await response.json();

    return (data.web?.results || []).slice(0, 5).map((r: { title: string; description: string; url: string }) => ({
      title: r.title,
      snippet: r.description,
      link: r.url,
    }));
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

export const webSearch = tool({
  description: `Search the internet for current information. Use for: news, trending, social media, prices, weather, sports, celebrities, current events. ALWAYS use this - never say you can't access internet!`,
  inputSchema: z.object({
    query: z.string().describe("Search query - be specific"),
  }),
  needsApproval: false,
  execute: async (input) => {
    const currentDate = new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // HARD TIMEOUT - never wait more than 3 seconds total
    const searchPromise = (async () => {
      const [ddg, brave] = await Promise.all([
        quickSearch(input.query),
        braveSearch(input.query),
      ]);

      const response: Record<string, string> = {
        query: input.query,
        currentDate,
      };

      if (ddg.answer) response.answer = ddg.answer;
      if (ddg.abstract) response.summary = ddg.abstract;

      if (brave.length > 0) {
        response.results = brave
          .map((r, i) => `${i + 1}. ${r.title}: ${r.snippet}`)
          .join("\n");
      }

      if (!response.answer && !response.summary && !response.results) {
        response.note = "Sem resultados específicos. Responda com seu conhecimento geral.";
      }

      return response;
    })();

    // Hard 3 second timeout
    const timeoutPromise = new Promise<Record<string, string>>((resolve) => {
      setTimeout(() => {
        resolve({
          query: input.query,
          currentDate,
          note: "Busca demorou. Responda rapidamente com seu conhecimento.",
        });
      }, 3000);
    });

    return Promise.race([searchPromise, timeoutPromise]);
  },
});
