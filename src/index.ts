import { createClient } from '@supabase/supabase-js';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const supabaseUrl = env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_KEY;

    // Initialize the Supabase client with environment variables
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { pathname } = new URL(request.url);
    const pathParts = pathname.split('/').filter(Boolean);

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // Adjust this to your frontend's origin if needed
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle OPTIONS request for CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Endpoint to fetch all entries
    if (pathname === "/api/entries") {
      const { data, error } = await supabase
        .from('entries')
        .select('id, entry_en, entry_es, layout(css_file_name)');

      if (error) {
        return new Response(`Error: ${error.message}`, { status: 500, headers: corsHeaders });
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Endpoint to fetch a specific entry's CSS
    if (pathParts[0] === "api" && pathParts[1] === "entries" && pathParts[3] === "css") {
      const entryId = pathParts[2];
      const { data, error } = await supabase
        .from('entries')
        .select('id, entry_en, entry_es, layout(css_file_name)')
        .eq('id', entryId)
        .single();

      if (error) {
        return new Response(`Error: ${error.message}`, { status: 500, headers: corsHeaders });
      }

      if (data) {
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({ error: "Entry not found" }), { status: 404, headers: corsHeaders });
      }
    }

    // Endpoint to fetch a specific entry's keywords
    if (pathParts[0] === "api" && pathParts[1] === "entries" && pathParts[3] === "keywords") {
      const entryId = pathParts[2];
      const { data, error } = await supabase
        .from('entrykeywords')
        .select('keyword_id, keywords!inner(keyword, label_en, label_es)')
        .eq('entry_id', entryId);

      if (error) {
        return new Response(`Error: ${error.message}`, { status: 500, headers: corsHeaders });
      }

      if (data && data.length > 0) {
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({ error: "Entry not found" }), { status: 404, headers: corsHeaders });
      }
    }

    // Default response for unsupported paths
    return new Response(
      "Available endpoints: /api/entries, /api/entries/:id/css, /api/entries/:id/keywords",
      { status: 200, headers: corsHeaders }
    );
  },
} satisfies ExportedHandler<Env>;
