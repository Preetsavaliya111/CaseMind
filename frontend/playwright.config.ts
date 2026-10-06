import { defineConfig } from '@playwright/test'

const externalBaseURL = process.env.CASEMIND_BROWSER_BASE_URL

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 30_000 },
  use: { baseURL: externalBaseURL || 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  webServer: externalBaseURL ? undefined : [{
    command: process.env.CASEMIND_BROWSER_PRODUCTION === '1'
      ? `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort --outDir ${process.env.CASEMIND_BROWSER_BUILD_DIR || 'dist'}`
      : 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 120_000,
    env: { VITE_API_BASE_URL: '/api/v1', CASEMIND_DEV_API_PROXY: 'http://127.0.0.1:8011' },
  }, ...(process.env.CASEMIND_BROWSER_API === '1' ? [{
    command: `${process.env.CASEMIND_TEST_PYTHON || 'python'} ../backend/scripts/browser_test_server.py`,
    url: 'http://127.0.0.1:8011/api/v1/health/live',
    reuseExistingServer: false,
    timeout: 120_000,
  }] : [])],
})
