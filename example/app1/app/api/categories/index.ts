import type { Context } from "bext";

// Mock database
const categories = [
  { id: "1", name: "Category 1" },
  { id: "2", name: "Category 2" },
];

export async function GET(ctx: Context) {
  return ctx.json({
    success: true,
    data: categories,
    meta: {
      count: categories.length,
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

    const newCategory = {
      id: String(categories.length + 1),
      name,
    };

    categories.push(newCategory);

    return ctx.json(
      {
        success: true,
        data: newCategory,
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
