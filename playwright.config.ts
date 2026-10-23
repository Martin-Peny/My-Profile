import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  outputDir: "./artifacts/test-results",
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5199",
    channel: "chrome",
    viewport: { width: 1440, height: 1000 },
    launchOptions: { args: ["--enable-unsafe-swiftshader"] },
    trace: "retain-on-failure",
  },
  webServer: [{
    command: "npm run preview -- --port 5199 --strictPort",
    url: "http://127.0.0.1:5199",
    reuseExistingServer: false,
  }, {
    command: "npm run dev -- --port 5200 --strictPort",
    url: "http://127.0.0.1:5200",
    reuseExistingServer: false,
  }],
});
