import type { Context } from "bext";

// Mock database (in a real app, this would be a database)
const users = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
];

export async function GET(ctx: Context) {
  const userId = ctx.params?.id;
  const user = users.find(u => u.id === userId);

  if (!user) {
    return ctx.json({
      success: false,
      error: 'User not found'
    }, 404);
  }

  return ctx.json({
    success: true,
    data: user
  }, 200);
}
