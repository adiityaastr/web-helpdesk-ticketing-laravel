import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const designDir = __dirname;

async function main() {
    console.log('Starting HTML to JPEG conversion in:', designDir);
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    const files = fs.readdirSync(designDir);
    const htmlFiles = files.filter(f => f.endsWith('.html'));

    console.log(`Found ${htmlFiles.length} HTML files.`);

    for (const file of htmlFiles) {
        const filePath = path.join(designDir, file);
        const fileUrl = `file:///${filePath.replace(/\\/g, '/')}`;
        const outputName = file.replace('.html', '.jpg');
        const outputPath = path.join(designDir, outputName);

        console.log(`Converting ${file} -> ${outputName}...`);
        await page.goto(fileUrl);
        
        // Wait for networkidle (so Tailwind CDN and fonts load)
        try {
            await page.waitForLoadState('networkidle', { timeout: 5000 });
        } catch (e) {
            console.log('Timeout waiting for networkidle, continuing...');
        }
        await page.waitForTimeout(1000); // 1s buffer for rendering animations/scripts

        await page.screenshot({
            path: outputPath,
            type: 'jpeg',
            quality: 90,
            fullPage: true
        });
        console.log(`Saved ${outputName}`);
    }

    await browser.close();
    console.log('Conversion completed successfully!');
}

main().catch(err => {
    console.error('Error during conversion:', err);
    process.exit(1);
});
