export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const isSandbox = (process.env.PAYMENT_MODE ?? "sandbox") !== "production";
/** DEMO_MODE=true runs the whole app on built-in sample data, with no Supabase or payment keys. */
export const isDemo = process.env.DEMO_MODE === "true";
