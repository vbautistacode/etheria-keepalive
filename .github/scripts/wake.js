// .github/scripts/wake.js
const { chromium } = require('playwright');

(async () => {
  const url = process.env.URL || 'https://etheria.streamlit.app/';
  console.log('Opening', url);

  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    for (let attempt = 1; attempt <= 5; attempt++) {
      console.log(`Attempt ${attempt}: navigating...`);
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => null);
      const status = resp ? resp.status() : 'no-response';
      console.log('Initial response status:', status);

      const html = (await page.content()).slice(0, 3000);
      console.log('HTML snippet (first 3000 chars):\n', html);

      // procurar botão pelo texto em inglês e em português
      const selectors = [
        'text="Yes, get this app back up!"',
        'text="Sim, traga este app de volta!"',
        'text="Get this app back up"',
        'text="Voltar ao app"'
      ];

      let clicked = false;
      for (const sel of selectors) {
        const btn = page.locator(sel);
        if (await btn.count() > 0) {
          console.log(`Found button matching selector: ${sel}. Clicking...`);
          try {
            await btn.first().click({ timeout: 10000 });
            clicked = true;
            break;
          } catch (err) {
            console.log('Click attempt failed:', err.toString());
          }
        }
      }

      if (clicked) {
        console.log('Clicked wake button, waiting for app to initialize...');
        // aguardar um pouco para a app carregar
        await page.waitForTimeout(10000);
        const postHtml = (await page.content()).slice(0, 3000);
        console.log('Post-click HTML snippet:\n', postHtml);
        console.log('If the app is awake, you should see app content in the snippet above.');
        break;
      } else {
        console.log('Wake button not found. Will retry after delay.');
      }

      // esperar antes da próxima tentativa
      await page.waitForTimeout(8000);
    }
  } catch (err) {
    console.error('Error in wake script:', err);
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
})();
