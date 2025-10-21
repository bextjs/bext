import type { Context } from "bext";

export async function GET(ctx: Context) {
  return new Response('Hello, World!', {
    headers: { 'Content-Type': 'text/plain' }
  });
}
