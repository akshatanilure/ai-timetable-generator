const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Intercept console messages
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  try {
    await page.goto('http://localhost:3000/login');
    await page.type('input[type="email"]', 'admin@example.com'); // Put a dummy or generic login if needed, or if it redirects
    await page.type('input[type="password"]', 'password123'); // Or we can just go to /timetables if no auth
    // Let's just try going directly to /timetables
    await page.goto('http://localhost:3000/timetables');
    await page.waitForTimeout(2000);
  } catch(e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
