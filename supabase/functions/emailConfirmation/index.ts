import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  try {
    if (!req.headers.get("content-type")?.includes("application/json")) {
      return new Response(JSON.stringify({ error: "Invalid content type" }), {
        status: 400,
      });
    }

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
      `)
      .eq("id", orderId)
      .single();

    if (error || !order) {
      console.error("Order fetch error:", error);
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
      });
    }

    const client = order.client;

    const emailBody = `
Olá ${client.name},

Obrigado pelo seu pedido #${order.id}!
Valor total: $${order.total}

Items:
${
      order.item.map((i) => {
        const product = i.product;
        return `- ${product.name}: ${i.amount} x $${product.price}`;
      }).join("\n")
    }

Agradecimentos,
Loja
`;

    const emailResponse = await supabase.functions.invoke("send-email", {
      method: "POST",
      body: JSON.stringify({
        to: client.email,
        subject: `Confirmação do pedido #${order.id}`,
        text: emailBody,
      }),
    });
    if (emailResponse.error) {
      console.error("Email function error:", emailResponse.error);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
    });
  } catch (err) {
    console.error("Edge function error:", err);
    let message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});

