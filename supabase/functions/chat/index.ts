import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, taskContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are FlowBoard AI — a smart, friendly project management assistant embedded in a Kanban board app. You help users organize tasks, prioritize work, and stay productive.

${taskContext ? `Here are the user's current tasks:\n${taskContext}\n` : 'The user has no tasks yet.'}

You can help users EDIT existing tasks. When a user asks to change a task (rename, change priority, move status, update description, etc.), respond with a JSON action block that the frontend will parse and execute.

To edit a task, include this exact format in your response:
\`\`\`action
{"type":"edit_task","task_title":"<exact current title>","updates":{"title":"new title","priority":"high","status":"in_progress","description":"new desc","category":"new cat"}}
\`\`\`

Only include the fields that need to change in "updates". Valid statuses: todo, in_progress, done, completed. Valid priorities: low, medium, high.

To delete a task:
\`\`\`action
{"type":"delete_task","task_title":"<exact current title>"}
\`\`\`

Guidelines:
- Be concise and actionable
- When asked about tasks, reference the actual board data above
- Suggest priorities and next steps based on the board state
- Use markdown formatting for clarity
- Be encouraging and motivating
- When editing tasks, always confirm what you changed`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
