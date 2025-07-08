
// Supabase functions deployment script for Replit
// Suora deployaus Supabase CLI:n beta-versiolla, joka tukee --use-api lippua (ei Docker-riippuvuutta)
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Supabase projektin tunniste (project ref)
const PROJECT_REF = 'rmkleyyzieacwltcbgzs';

// Argumantit komentorivillä
const args = process.argv.slice(2);
const shouldShowHelp = args.includes('--help') || args.includes('-h');
const shouldDeployAll = args.includes('all');
const specificFunctions = args.filter(arg => !arg.startsWith('-') && arg !== 'all');

if (shouldShowHelp) {
  console.log(`
📋 Supabase Functions Deployment Tool

Käyttö:
  node scripts/deploy-functions.js [options] [function names]

Vaihtoehdot:
  all         Deployaa kaikki funktiot
  [nimi]      Deployaa vain nimetty funktio (voit listata useita)
  --help, -h  Näytä tämä ohje

Esimerkkejä:
  node scripts/deploy-functions.js all                  # Deployaa kaikki funktiot
  node scripts/deploy-functions.js get-shared-company   # Deployaa vain yhden funktion
  node scripts/deploy-functions.js func1 func2          # Deployaa useita nimettyjä funktioita
  `);
  process.exit(0);
}

console.log(`
📢 Supabase-funktioiden deployment-työkalu

⚡ Tämä työkalu käyttää Supabase CLI:n beta-versiota, joka tukee --use-api lippua.
   Näin funktiot voidaan deployata suoraan Replitistä ilman Dockeria!
`);

// Funktioiden hakemisto
const FUNCTIONS_DIR = path.join(process.cwd(), 'supabase/functions');

// Listaa saatavilla olevat funktiot
try {
  const functions = fs.readdirSync(FUNCTIONS_DIR)
    .filter(item => {
      const itemPath = path.join(FUNCTIONS_DIR, item);
      return fs.statSync(itemPath).isDirectory() && 
            fs.existsSync(path.join(itemPath, 'index.ts'));
    });

  console.log(`📋 Saatavilla olevat funktiot:`);
  functions.forEach(func => console.log(`  - ${func}`));
  console.log();

  // Tarkista onko funktioita ylipäätään
  if (functions.length === 0) {
    console.log('❌ Ei löytynyt yhtään funktiota supabase/functions hakemistosta!');
    process.exit(1);
  }

  // Päätä mitä funktioita deployataan
  let functionsToBeDeployed = [];
  if (shouldDeployAll) {
    functionsToBeDeployed = functions;
    console.log(`🚀 Deployataan kaikki funktiot (${functionsToBeDeployed.length} kpl)...`);
  } else if (specificFunctions.length > 0) {
    // Tarkista että kaikki annetut funktiot ovat olemassa
    const nonExistingFuncs = specificFunctions.filter(func => !functions.includes(func));
    if (nonExistingFuncs.length > 0) {
      console.log(`❌ Seuraavia funktioita ei löydy: ${nonExistingFuncs.join(', ')}`);
      process.exit(1);
    }
    functionsToBeDeployed = specificFunctions;
    console.log(`🚀 Deployataan valitut funktiot: ${functionsToBeDeployed.join(', ')}`);
  } else {
    console.log(`ℹ️ Et valinnut yhtään funktiota. Käytä 'all' deployataksesi kaikki funktiot.`);
    console.log(`ℹ️ Käytä '--help' nähdäksesi kaikki komennot.`);
    process.exit(0);
  }

  // Asenna Supabase CLI beta-versio
  console.log(`\n📦 Asennetaan Supabase CLI beta-versio...`);
  try {
    execSync('npm install -g supabase@beta || true', { stdio: 'inherit' });
    console.log(`✅ Supabase CLI beta asennettu.`);
  } catch (error) {
    console.log(`⚠️ Supabase CLI:n asennus saattoi epäonnistua, mutta kokeillaan silti deployausta npx:n kautta.`);
  }

  // Deployaa funktiot
  if (shouldDeployAll) {
    console.log(`\n🚀 Deployataan kaikki funktiot projektiin ${PROJECT_REF}...`);
    try {
      // Varmistetaan --use-api lipun käyttö Docker-vapaan version kanssa
      execSync(`npx supabase@beta functions deploy --all --use-api --project-ref ${PROJECT_REF}`, { 
        stdio: 'inherit' 
      });
      console.log(`\n✅ Kaikki funktiot on deployattu onnistuneesti!`);
    } catch (error) {
      console.error(`\n❌ Virhe funktioiden deployauksessa: ${error.message}`);
      process.exit(1);
    }
  } else {
    // Deployaa funktiot yksi kerrallaan
    let successCount = 0;
    let failedFunctions = [];

    for (const func of functionsToBeDeployed) {
      console.log(`\n🚀 Deployataan funktio '${func}' projektiin ${PROJECT_REF}...`);
      try {
        // Varmistetaan --use-api lipun käyttö Docker-vapaan version kanssa
        execSync(`npx supabase@beta functions deploy ${func} --use-api --project-ref ${PROJECT_REF}`, { 
          stdio: 'inherit' 
        });
        console.log(`✅ Funktio '${func}' deployattu onnistuneesti!`);
        successCount++;
      } catch (error) {
        console.error(`❌ Virhe funktion '${func}' deployauksessa: ${error.message}`);
        failedFunctions.push(func);
      }
    }

    // Yhteenveto
    console.log(`\n📊 Deployauksen yhteenveto:`);
    console.log(`   ✅ Onnistuneet deployaukset: ${successCount}/${functionsToBeDeployed.length}`);
    
    if (failedFunctions.length > 0) {
      console.log(`   ❌ Epäonnistuneet funktiot: ${failedFunctions.join(', ')}`);
      process.exit(1);
    }
  }

} catch (error) {
  console.error(`\n❌ Vakava virhe: ${error.message}`);
  process.exit(1);
}
