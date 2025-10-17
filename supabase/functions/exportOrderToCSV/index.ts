// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
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

type OrderClient = {
  name: string;
  email: string;
}[];

type Order = {
  id: string;
  order_date: string;
  total: number;
  client: OrderClient;
  item: OrderItem[];
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

Deno.serve(async () => {
  try {
    const { data: orders, error } = await supabase
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
      `);

    if (error) throw error;

    const csvData: CsvData[] = [];

    orders?.forEach((order: Order) => {
      const client = order.client[0];

      order.item.forEach((i: OrderItem) => {
        const product = i.product[0];

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

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/exportOrderToCSV' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
