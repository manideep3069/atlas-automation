const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * ChatGPT Atlas Smart Browser Mode (V3 - Final)
 * ===============================================
 * SMART UNIVERSAL APPROACH:
 * 
 * 1. For TOP sites (Amazon, YouTube, Google) → Use direct search URL (best results)
 * 2. For ALL OTHER sites → Use Google site-specific search (100% reliable)
 * 
 * Example:
 * - "Open amazon.com and search for nike shoes"
 *   → https://www.amazon.com/s?k=nike+shoes (direct)
 * 
 * - "Open swiggy.com and search for biryani"
 *   → https://www.google.com/search?q=biryani+site:swiggy.com (via Google)
 * 
 * - "Open randomsite.xyz and find abc"
 *   → https://www.google.com/search?q=abc+site:randomsite.xyz (via Google)
 * 
 * This works for ANY website without needing templates!
 */

const APP_NAME = 'ChatGPT Atlas';
const APP_PATH = '/Applications/ChatGPT Atlas.app';

// ONLY top sites where direct search is significantly better
// Everything else uses Google site-specific search
const TOP_SITES = {
  'google.com': (q) => `https://www.google.com/search?q=${q}`,
  'youtube.com': (q) => `https://www.youtube.com/results?search_query=${q}`,
  'amazon.com': (q) => `https://www.amazon.com/s?k=${q}`,
  'amazon.in': (q) => `https://www.amazon.in/s?k=${q}`,
  'flipkart.com': (q) => `https://www.flipkart.com/search?q=${q}`,
  'ebay.com': (q) => `https://www.ebay.com/sch/i.html?_nkw=${q}`,
  'github.com': (q) => `https://github.com/search?q=${q}`,
  'stackoverflow.com': (q) => `https://stackoverflow.com/search?q=${q}`
};

async function runAtlasSmartBrowser() {
  const startTime = new Date();
  const runId = formatTimestamp(startTime);
  
  console.log('🌐 ChatGPT Atlas Smart Browser (V3 - Final)');
  console.log('═'.repeat(50));
  console.log('📌 Smart: Direct for top sites, Google for others');
  console.log(`📅 Run ID: ${runId}\n`);

  if (!fs.existsSync(APP_PATH)) {
    console.error(`❌ ${APP_NAME} not found at ${APP_PATH}`);
    return;
  }

  const configPath = path.join(__dirname, 'prompts.json');
  if (!fs.existsSync(configPath)) {
    console.error('❌ prompts.json not found.');
    return;
  }
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const prompts = config.prompts || [];
  const waitTime = config.waitTimePerPrompt || 30000;
  const takeScreenshots = config.screenshotAfterEachPrompt !== false;
  
  console.log(`📋 Loaded ${prompts.length} prompts`);
  console.log(`⏱️  Wait time: ${waitTime / 1000}s per prompt\n`);

  const trajectoryBaseDir = path.join(__dirname, 'atlas_trajectories');
  if (!fs.existsSync(trajectoryBaseDir)) fs.mkdirSync(trajectoryBaseDir);
  
  const trajectoryDir = path.join(trajectoryBaseDir, `smart_${runId}`);
  fs.mkdirSync(trajectoryDir);
  console.log(`📁 Output: atlas_trajectories/smart_${runId}/\n`);

  // Launch Atlas
  console.log(`1. Launching ${APP_NAME}...`);
  try {
    await execPromise(`open "${APP_PATH}"`);
    await sleep(5000);
    await runAppleScript(`tell application "${APP_NAME}" to activate`, trajectoryDir);
    console.log(`   ✅ Ready`);
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    return;
  }

  await sleep(5000);

  // Process prompts
  console.log('\n2. Processing prompts...\n');
  const results = [];

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    console.log(`   [${i + 1}/${prompts.length}] "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`);
    
    const { site, query, searchUrl, method } = buildSmartUrl(prompt);
    console.log(`      📍 ${site} | Method: ${method}`);
    console.log(`      🔗 ${searchUrl.substring(0, 60)}...`);
    
    const result = {
      index: i + 1,
      prompt,
      site,
      query,
      searchUrl,
      method,
      timestamp: new Date().toISOString(),
      success: false
    };

    try {
      await navigateToUrl(searchUrl, trajectoryDir);
      console.log(`      ⏳ Waiting ${waitTime / 1000}s...`);
      await sleep(waitTime);
      
      if (takeScreenshots) {
        const ssPath = path.join(trajectoryDir, `${String(i + 1).padStart(2, '0')}_result.png`);
        await execPromise(`screencapture -o "${ssPath}"`);
        result.screenshot = ssPath;
        console.log(`      📸 Done`);
      }
      
      result.success = true;
    } catch (error) {
      result.error = error.message;
      console.log(`      ❌ ${error.message}`);
    }

    results.push(result);
    if (i < prompts.length - 1) await sleep(2000);
  }

  // Save results
  console.log('\n3. Saving...');
  
  const summary = {
    runId,
    mode: 'smart_v3_final',
    startTime: startTime.toISOString(),
    endTime: new Date().toISOString(),
    duration: formatDuration(Date.now() - startTime),
    total: prompts.length,
    success: results.filter(r => r.success).length,
    results
  };

  fs.writeFileSync(path.join(trajectoryDir, 'summary.json'), JSON.stringify(summary, null, 2));
  await execPromise(`screencapture -o "${path.join(trajectoryDir, 'final.png')}"`);
  
  console.log('   ✅ Done\n');
  console.log('═'.repeat(50));
  console.log(`📊 ${summary.success}/${summary.total} successful | ${summary.duration}`);
  console.log(`📁 atlas_trajectories/smart_${runId}/`);
}

/**
 * Build the smartest URL for any prompt
 */
function buildSmartUrl(prompt) {
  // Extract site
  const siteMatch = prompt.match(/(?:open|go to|navigate to|visit|on)\s+(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  const site = siteMatch ? siteMatch[1].toLowerCase() : 'google.com';
  
  // Extract query
  let query = '';
  const qMatch = prompt.match(/(?:and\s+)?(?:search\s+(?:for\s+)?|find\s+(?:me\s+)?|look\s+for\s+)(.+)/i);
  if (qMatch) {
    query = qMatch[1].trim().replace(/^me\s+/, '');
  }
  
  const encodedQuery = encodeURIComponent(query).replace(/%20/g, '+');
  
  // Check if it's a top site with direct search
  const topSiteKey = Object.keys(TOP_SITES).find(k => site.includes(k));
  
  if (topSiteKey && query) {
    // Use direct site search
    return {
      site,
      query,
      searchUrl: TOP_SITES[topSiteKey](encodedQuery),
      method: 'DIRECT'
    };
  } else if (query) {
    // Use Google site-specific search (UNIVERSAL)
    const cleanSite = site.replace('www.', '');
    return {
      site,
      query,
      searchUrl: `https://www.google.com/search?q=${encodedQuery}+site:${cleanSite}`,
      method: 'GOOGLE_SITE'
    };
  } else {
    // Just navigate to homepage
    return {
      site,
      query: '',
      searchUrl: `https://www.${site.replace('www.', '')}`,
      method: 'HOMEPAGE'
    };
  }
}

async function navigateToUrl(url, trajectoryDir) {
  const escaped = url.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  await runAppleScript(`
    tell application "${APP_NAME}" to activate
    delay 0.5
    tell application "System Events"
      tell process "${APP_NAME}"
        set frontmost to true
        delay 0.3
        keystroke "l" using {command down}
        delay 0.3
        keystroke "a" using {command down}
        delay 0.1
        key code 51
        delay 0.2
        keystroke "${escaped}"
        delay 0.3
        keystroke return
      end tell
    end tell
  `, trajectoryDir);
}

async function runAppleScript(script, dir) {
  const tmp = path.join(dir || __dirname, 'temp.scpt');
  fs.writeFileSync(tmp, script.trim());
  try { await execPromise(`osascript "${tmp}"`); } 
  finally { try { fs.unlinkSync(tmp); } catch(e){} }
}

function formatTimestamp(d) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

runAtlasSmartBrowser();
