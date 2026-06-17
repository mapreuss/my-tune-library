import { createServerFn } from "@tanstack/react-start";

export const getGoogleClientId = createServerFn({ method: "GET" }).handler(async () => {
  return { clientId: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "" };
});
