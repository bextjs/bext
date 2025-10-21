import type { Context } from "bext";

// Mock database
const users = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
];

export async function GET(ctx: Context) {
  return new Response(
    JSON.stringify({
      success: true,
      data: users,
      meta: {
        count: users.length,
        timestamp: new Date().toISOString()
      }
    }),
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

export async function POST(ctx: Context) {
  try {
    const body = await ctx.req.json();
    const { name, email } = body;

    if (!name || !email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Name and email are required'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const newUser = {
      id: String(users.length + 1),
      name,
      email
    };

    users.push(newUser);

    return new Response(
      JSON.stringify({
        success: true,
        data: newUser
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid JSON body'
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
