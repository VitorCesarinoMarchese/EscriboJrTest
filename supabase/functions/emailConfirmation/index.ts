// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(JSON.stringify({ error: "Missing orderId" }), {
        status: 400,
      });
    }

    // Fetch order details
    const { data: order, error } = await supabase
      .from("order")
      .select(
        "id, total, client:client_id(name, email), items(product_id, quantity, price)",
      )
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
      });
    }

    // Compose email
    const emailBody = `
      Hi ${order.client.name},

      Thank you for your order #${order.id}!
      Total: $${order.total}

      Items:
      ${
      order.items.map((i: any) =>
        `- ${i.product_id}: ${i.quantity} x $${i.price}`
      ).join("\n")
    }

      Cheers,
      Your Shop
    `;

    // Send email via Supabase SMTP / Postmark / SendGrid
    const { data: emailData, error: emailError } = await supabase.functions
      .invoke("send-email", {
        method: "POST",
        body: JSON.stringify({
          to: order.client.email,
          subject: `Order Confirmation #${order.id}`,
          text: emailBody,
        }),
      });

    if (emailError) {
      return new Response(JSON.stringify({ error: emailError.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/emailConfirmation' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
