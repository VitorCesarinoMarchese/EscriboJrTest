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

type OrderProduct = {
  name: string;
  price: number;
};

type OrderItem = {
  amount: number;
  total: number;
  product: OrderProduct[];
};

Deno.serve(async (req) => {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(JSON.stringify({ error: "Missing orderId" }), {
        status: 400,
      });
    }

    const { data: order, error } = await supabase
      .from("order")
      .select(`
    id,
    client: client_id(
      name,
      email
    ),
    order_date,
    total,
    item: item(
      amount,
      total,
      product: product(
        name,
        price
      )
    )
      `).eq("id", orderId)
      .single();

    if (error || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
      });
    }

    const emailBody = `
      Ola ${order.client[0].name},

      Obrigado pelo seu pedido #${order.id}!
      Valor total: $${order.total}

      Items:
      ${
      order.item.map((i: OrderItem) => {
        const product = i.product[0];
        return `- ${product.name}: ${i.amount} x $${product.price}`;
      }).join("\n")
    }

      Agradecimentos,
      Loja
    `;

    const { data: emailData, error: emailError } = await supabase.functions
      .invoke("send-email", {
        method: "POST",
        body: JSON.stringify({
          to: order.client[0].email,
          subject: `Confirmação do pedido #${order.id}`,
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
    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    }
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
    });
  }
});

/* To invoke locally:

  1. Run `s sudo pacman -U ./docker-desktop-x86_64.pkg.tar.zstupabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/emailConfirmation' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
