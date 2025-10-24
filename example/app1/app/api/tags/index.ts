import type { Context } from "bext";

// Mock database
const tags = [
  { id: "1", name: "Tag 1" },
  { id: "2", name: "Tag 2" },
];

export async function GET(ctx: Context) {
  return ctx.json({
    success: true,
    data: tags,
    meta: {
      count: tags.length,
      timestamp: new Date().toISOString(),
    },
  });
}

export async function POST(ctx: Context) {
  try {
    const body = await ctx.req.json();
    const { name } = body;

    if (!name) {
      return ctx.json(
        {
          success: false,
          error: "Name is required",
        },
        400
      );
    }

    const newTag = {
      id: String(tags.length + 1),
      name,
    };

    tags.push(newTag);

    return ctx.json(
      {
        success: true,
        data: newTag,
      },
      201
    );
  } catch (error) {
    return ctx.json(
      {
        success: false,
        error: "Invalid JSON body",
      },
      400
    );
  }
}
