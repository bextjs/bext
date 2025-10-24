import type { Context } from "bext";

// Mock database
const users = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
];

export async function GET(ctx: Context) {
  return ctx.json({
    success: true,
    data: users,
    meta: {
      count: users.length,
      timestamp: new Date().toISOString()
    }
  });
}

export async function POST(ctx: Context) {
  try {
    const body = await ctx.req.json();
    const { name, email } = body;

    if (!name || !email) {
      return ctx.json({
        success: false,
        error: 'Name and email are required'
      }, 400);
    }

    const newUser = {
      id: String(users.length + 1),
      name,
      email
    };

    users.push(newUser);

    return ctx.json({
      success: true,
      data: newUser
    }, 201);
  } catch (error) {
    return ctx.json({
      success: false,
      error: 'Invalid JSON body'
    }, 400);
  }
}
