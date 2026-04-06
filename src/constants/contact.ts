/** Set `VITE_CONTACT_EMAIL` in `.env`; fallback is only for local dev. */
export const CONTACT_EMAIL =
  (import.meta.env.VITE_CONTACT_EMAIL as string | undefined)?.trim() ||
  'tomiwaaluko02@gmail.com';
