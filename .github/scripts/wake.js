// .github/scripts/wake.js
const { chromium } = require('playwright');

(async () => {
  const url = process.env.URL || 'https://etheria.streamlit.app/';
  console.log('Opening', url);

  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // tenta até 3 vezes: abrir, procurar botão e clicar
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`Attempt ${attempt}: navigating...`);
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const status = resp ? resp.status() : 'no-response';
      console.log('Initial response status:', status);

      // opcional: salvar um pequeno snippet do HTML para logs
      const htmlSnippet = (await page.content()).slice(0, 1200);
      console.log('HTML snippet (first 1200 chars):\n', htmlSnippet);

      // procurar botão pelo texto em inglês (ajuste se o texto for diferente)
      const btn = page.locator('text="Yes, get this app back up!"');
      const exists = await btn.count();
      if (exists > 0) {
        console.log('Found wake button, clicking...');
        try {
          await btn.first().click({ timeout: 10000 });
          // aguardar navegação ou mudança de conteúdo
          await page.waitForTimeout(5000);
          console.log('Clicked button, waiting a few seconds for app to wake...');
          // verificar se a página agora contém algo diferente (ex.: título, app content)
          const newHtml = (await page.content()).slice(0, 1200);
          console.log('Post-click HTML snippet:\n', newHtml);
          console.log('Assuming wake succeeded (inspect snippets). Exiting.');
          break;
        } catch (err) {
          console.log('Click failed:', err.toString());
        }
      } else {
        console.log('Wake button not found on this page.');
      }

      // se não encontrou ou não funcionou, aguarda e tenta novamente
      if (attempt < 3) {
        console.log('Sleeping 8s before next attempt...');
        await page.waitForTimeout(8000);
      } else {
        console.log('All attempts done; wake may have failed.');
      }
    }
  } catch (err) {
    console.error('Error in wake script:', err);
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
})();
