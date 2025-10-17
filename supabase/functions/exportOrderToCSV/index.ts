import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Papa from "npm:papaparse@5.5.3";
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

type CsvData = {
  orderId: string;
  clientName: string;
  clientEmail: string;
  productName: string;
  productPrice: number;
  amount: number;
  itemTotal: number;
  orderTotal: number;
};

Deno.serve(async (req) => {
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return new Response(JSON.stringify({ error: "Invalid content type" }), {
      status: 400,
    });
  }

  const { orderId } = await req.json();
  try {
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

    if (error) throw error;

    const csvData: CsvData[] = [];

    const client = order.client;

    order.item.forEach((i: OrderItem) => {
      const product = i.product;
      csvData.push({
        orderId: order.id,
        clientName: client.name,
        clientEmail: client.email,
        productName: product.name,
        productPrice: product.price,
        amount: i.amount,
        itemTotal: i.total,
        orderTotal: order.total,
      });
    });

    const csv = Papa.unparse(csvData);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=orders.csv",
      },
    });
  } catch (err) {
    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    }
    return new Response("Error exporting CSV: " + message, { status: 500 });
  }
});
