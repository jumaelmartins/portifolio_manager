import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    // base-ui Select popups (alignItemWithTrigger) run layout-measurement loops
    // that are slow under jsdom, especially with several options and under
    // parallel load. The default 5s testTimeout tips these interaction tests
    // into spurious "Test timed out" failures. 20s gives headroom without
    // weakening any assertion.
    testTimeout: 20000,
  },
});
