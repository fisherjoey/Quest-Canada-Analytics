const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://cpsc405.joeyfishertech.com';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

// Test credentials - update these as needed
const TEST_EMAIL = 'admin@quest.com';
const TEST_PASSWORD = 'test123';

// Pages to capture
const publicPages = [
  { path: '/', name: 'landing-page', title: 'Landing Page', description: 'The main landing page showcasing Quest Canada\'s climate action tracking mission.' },
  { path: '/login', name: 'login-page', title: 'Login Page', description: 'User authentication page for accessing the application.' },
  { path: '/signup', name: 'signup-page', title: 'Sign Up Page', description: 'New user registration page.' },
  { path: '/dashboards', name: 'dashboards-page', title: 'Public Dashboards', description: 'Public climate data dashboards and visualizations.' },
];

const authenticatedPages = [
  { path: '/assessments', name: 'assessments-list', title: 'Assessments List', description: 'View all climate action benchmark assessments for communities.' },
  { path: '/assessments/new', name: 'assessment-new', title: 'Create New Assessment', description: 'Create a new benchmark assessment for a community using the comprehensive 10-indicator form.' },
  { path: '/assessments/import', name: 'assessment-import', title: 'AI Import Assessment', description: 'Import assessments from PDF using AI-powered extraction.' },
  { path: '/projects', name: 'projects-list', title: 'Projects List', description: 'View all climate action projects.' },
  { path: '/projects/new', name: 'project-new', title: 'Create New Project', description: 'Create a new climate action project with funding and milestone tracking.' },
  { path: '/account', name: 'account-page', title: 'Account Settings', description: 'Manage your account settings and preferences.' },
  { path: '/admin', name: 'admin-analytics', title: 'Admin Analytics Dashboard', description: 'Analytics overview for administrators.' },
  { path: '/admin/users', name: 'admin-users', title: 'User Management', description: 'Manage user accounts and permissions.' },
  { path: '/admin/settings', name: 'admin-settings', title: 'Admin Settings', description: 'Application settings and configuration.' },
];

async function dismissCookieBanner(page) {
  try {
    // Try to click "Accept all" button
    const acceptButton = await page.$('button:has-text("Accept all")');
    if (acceptButton) {
      await acceptButton.click();
      await page.waitForTimeout(500);
      console.log('  Cookie banner dismissed');
    }
  } catch (e) {
    // Ignore if no cookie banner
  }
}

async function captureScreenshots() {
  // Ensure screenshot directory exists
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  console.log('Starting screenshot capture...\n');

  // Go to landing page first to dismiss cookie banner
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await dismissCookieBanner(page);

  // Capture public pages
  console.log('=== Capturing Public Pages ===\n');
  for (const pageInfo of publicPages) {
    try {
      console.log(`Capturing: ${pageInfo.title} (${pageInfo.path})`);
      await page.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1000);
      await dismissCookieBanner(page);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${pageInfo.name}.png`),
        fullPage: false
      });
      console.log(`  ✓ Saved: ${pageInfo.name}.png`);
    } catch (error) {
      console.log(`  ✗ Failed: ${error.message}`);
    }
  }

  // Try to signup/login for authenticated pages
  console.log('\n=== Creating test account ===\n');
  let loggedIn = false;

  try {
    // First try signing up a new user
    await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await dismissCookieBanner(page);

    console.log('Attempting to sign up...');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    let currentUrl = page.url();
    console.log(`After signup URL: ${currentUrl}`);

    // If still on signup, account may exist - try login
    if (currentUrl.includes('/signup') || currentUrl.includes('/login')) {
      console.log('Signup may have failed (account might exist), trying login...');

      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);

      await page.fill('input[name="email"]', TEST_EMAIL);
      await page.fill('input[name="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);

      currentUrl = page.url();
      console.log(`After login URL: ${currentUrl}`);
    }

    // Also try with existing test account
    if (currentUrl.includes('/login')) {
      console.log('Trying with existing test account...');
      await page.fill('input[name="email"]', 'test@test.com');
      await page.fill('input[name="password"]', 'test123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);
      currentUrl = page.url();
      console.log(`After second login attempt URL: ${currentUrl}`);
    }

    if (!currentUrl.includes('/login') && !currentUrl.includes('/signup')) {
      loggedIn = true;
      console.log('Successfully authenticated!');
    } else {
      console.log('Could not authenticate - will capture login pages instead');
    }
  } catch (error) {
    console.log(`Auth error: ${error.message}`);
  }

  // Capture authenticated pages
  console.log('\n=== Capturing Authenticated Pages ===\n');
  for (const pageInfo of authenticatedPages) {
    try {
      console.log(`Capturing: ${pageInfo.title} (${pageInfo.path})`);
      await page.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500);
      await dismissCookieBanner(page);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${pageInfo.name}.png`),
        fullPage: false
      });
      console.log(`  ✓ Saved: ${pageInfo.name}.png`);
    } catch (error) {
      console.log(`  ✗ Failed: ${error.message}`);
    }
  }

  // Try to capture a detail page if assessments exist
  console.log('\n=== Capturing Detail Pages ===\n');
  try {
    await page.goto(`${BASE_URL}/assessments`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for a link to an assessment detail (not "new")
    const assessmentLinks = await page.$$('a[href^="/assessments/"]');
    for (const link of assessmentLinks) {
      const href = await link.getAttribute('href');
      if (href && !href.includes('/new') && !href.includes('/import') && !href.includes('/review')) {
        console.log(`Found assessment link: ${href}`);
        await link.click();
        await page.waitForTimeout(2000);
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, 'assessment-detail.png'),
          fullPage: false
        });
        console.log('  ✓ Saved: assessment-detail.png');
        break;
      }
    }
  } catch (error) {
    console.log(`  Detail page capture skipped: ${error.message}`);
  }

  await browser.close();
  console.log('\n=== Screenshot capture complete! ===');

  // Generate documentation data
  const allPages = [...publicPages, ...authenticatedPages];
  const docData = {
    capturedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    pages: allPages.map(p => ({
      ...p,
      screenshot: `${p.name}.png`
    }))
  };

  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, 'pages-data.json'),
    JSON.stringify(docData, null, 2)
  );
  console.log('Pages data saved to pages-data.json');
}

captureScreenshots().catch(console.error);
