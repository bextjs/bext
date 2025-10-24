import type { Context } from "bext";

export async function GET(ctx: Context) {
  return ctx.text('Hello, World!');
}
