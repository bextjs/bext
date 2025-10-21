import type { Context } from "bext";

export async function GET(ctx: Context) {
  return new Response('Welcome to BextJS', {
    headers: { 'Content-Type': 'text/plain' }
  });
}
