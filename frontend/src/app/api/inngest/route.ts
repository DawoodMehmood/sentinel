import { serve } from "inngest/next";
import { inngest } from "@/utils/inngest";
import { minePatterns } from "@/inngest/minePatterns";

// Correct way: pass a single object
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [minePatterns],
});
