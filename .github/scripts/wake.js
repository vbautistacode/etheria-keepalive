// .github/scripts/wake.js
const { chromium } = require('playwright');
const fs = require('fs');

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

      // salvar snapshot inicial
      try { await page.screenshot({ path: `wake_before_${attempt}.png`, fullPage: false }); } catch {}
      const htmlBefore = (await page.content()).slice(0, 10000);
      fs.writeFileSync(`wake_before_${attempt}.html`, htmlBefore);

      // seletores possíveis para o botão de wake (inglês/variações)
      const selectors = [
        'button:has-text("Yes, get this app back up!")',
        'text="Yes, get this app back up!"',
        'text="Get this app back up"',
        'text="Get this app back up!"',
        'text="Sim, traga este app de volta!"',
        'button'
      ];

      let clicked = false;
      for (const sel of selectors) {
        try {
          console.log(`Checking selector: ${sel}`);
          await page.waitForSelector(sel, { timeout: 8000 }).catch(() => null);
          const el = await page.$(sel);
          if (el) {
            console.log(`Found element for selector: ${sel}. Attempting click...`);
            try {
              await el.click({ timeout: 10000 });
              clicked = true;
              console.log('Click succeeded via element.click()');
            } catch (err) {
              console.log('Direct click failed, trying evaluate click:', err.toString());
              try {
                await page.evaluate(e => e.click(), el);
                clicked = true;
                console.log('Click succeeded via evaluate');
              } catch (err2) {
                console.log('Evaluate click failed:', err2.toString());
              }
            }
            if (clicked) break;
          } else {
            console.log(`Selector ${sel} not present as element.`);
          }
        } catch (err) {
          console.log(`Error checking selector ${sel}:`, err.toString());
        }
      }

      // aguardar e salvar pós-clique
      await page.waitForTimeout(10000);
      try { await page.screenshot({ path: `wake_after_${attempt}.png`, fullPage: false }); } catch {}
      const htmlAfter = (await page.content()).slice(0, 10000);
      fs.writeFileSync(`wake_after_${attempt}.html`, htmlAfter);

      if (clicked) {
        console.log('Clicked wake button; check post-click HTML and screenshots for app content.');
        break;
      } else {
        console.log('Wake button not clicked this attempt. Retrying after delay...');
        await page.waitForTimeout(8000);
      }
    }
  } catch (err) {
    console.error('Error in wake script:', err);
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
})();
