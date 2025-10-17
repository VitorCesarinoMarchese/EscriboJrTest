import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (_req) => {
  try {
    // Subscribe to inserts on the 'order' table
    const channel = supabase
      .channel("public:order")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "order" },
        async (payload) => {
          const orderId = payload.new.id;
          console.log("New order inserted:", orderId);

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
            return;
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

          try {
            const res = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
              },
              body: JSON.stringify({
                from: `${Deno.env.get("RESEND_EMAIL")}`,
                to: client.email,
                subject: `Pedido #${order.id}`,
                html: emailBody.replace(/\n/g, "<br>"),
              }),
            });
            const data = await res.json();
            console.log("Email sent:", data);
          } catch (err) {
            console.error("Email send error:", err);
          }
        },
      )
      .subscribe();

    return new Response(
      JSON.stringify({ success: true, message: "Realtime listener started" }),
      { status: 200 },
    );
  } catch (err) {
    console.error("Edge function error:", err);
    let message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
