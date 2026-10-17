export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (!process.env.ADMIN_SESSION_SECRET || !process.env.ADMIN_SESSION_SECRET.trim()) {
      throw new Error('FATAL: ADMIN_SESSION_SECRET environment variable is missing. Application refuses to start without it set.');
    }
  }
}
