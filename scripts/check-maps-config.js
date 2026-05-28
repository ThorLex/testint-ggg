#!/usr/bin/env node

/**
 * Script de vérification de la configuration Google Maps
 * 
 * Usage: node scripts/check-maps-config.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de la configuration Google Maps\n');

let hasErrors = false;
let hasWarnings = false;

// Vérifier app.json
console.log('1️⃣ Vérification de app.json...');
try {
    const appJsonPath = path.join(__dirname, '..', 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    const androidKey = appJson.expo?.android?.config?.googleMaps?.apiKey;
    const iosKey = appJson.expo?.ios?.config?.googleMapsApiKey;
    
    if (androidKey) {
        console.log(`   ✅ Clé Android trouvée: ${androidKey.substring(0, 20)}...`);
    } else {
        console.log('   ❌ Clé Android manquante dans app.json');
        hasErrors = true;
    }
    
    if (iosKey) {
        console.log(`   ✅ Clé iOS trouvée: ${iosKey.substring(0, 20)}...`);
    } else {
        console.log('   ⚠️  Clé iOS manquante dans app.json (OK si vous ne développez pas pour iOS)');
        hasWarnings = true;
    }
    
    if (androidKey && iosKey && androidKey !== iosKey) {
        console.log('   ⚠️  Les clés Android et iOS sont différentes');
        hasWarnings = true;
    }
} catch (error) {
    console.log(`   ❌ Erreur lors de la lecture de app.json: ${error.message}`);
    hasErrors = true;
}

// Vérifier AndroidManifest.xml
console.log('\n2️⃣ Vérification de AndroidManifest.xml...');
try {
    const manifestPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
    const manifest = fs.readFileSync(manifestPath, 'utf8');
    
    const apiKeyMatch = manifest.match(/android:name="com\.google\.android\.geo\.API_KEY"\s+android:value="([^"]+)"/);
    
    if (apiKeyMatch) {
        const key = apiKeyMatch[1];
        console.log(`   ✅ Clé API trouvée: ${key.substring(0, 20)}...`);
        
        // Vérifier si c'est la même que dans app.json
        const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf8'));
        const appJsonKey = appJson.expo?.android?.config?.googleMaps?.apiKey;
        
        if (appJsonKey && key !== appJsonKey) {
            console.log('   ⚠️  La clé dans AndroidManifest.xml diffère de celle dans app.json');
            console.log(`      app.json: ${appJsonKey.substring(0, 20)}...`);
            console.log(`      AndroidManifest.xml: ${key.substring(0, 20)}...`);
            hasWarnings = true;
        }
    } else {
        console.log('   ❌ Clé API non trouvée dans AndroidManifest.xml');
        hasErrors = true;
    }
    
    // Vérifier les permissions
    const hasFineLoc = manifest.includes('ACCESS_FINE_LOCATION');
    const hasCoarseLoc = manifest.includes('ACCESS_COARSE_LOCATION');
    
    if (hasFineLoc && hasCoarseLoc) {
        console.log('   ✅ Permissions de localisation présentes');
    } else {
        console.log('   ❌ Permissions de localisation manquantes');
        if (!hasFineLoc) console.log('      - ACCESS_FINE_LOCATION manquante');
        if (!hasCoarseLoc) console.log('      - ACCESS_COARSE_LOCATION manquante');
        hasErrors = true;
    }
} catch (error) {
    console.log(`   ❌ Erreur lors de la lecture de AndroidManifest.xml: ${error.message}`);
    hasErrors = true;
}

// Vérifier package.json
console.log('\n3️⃣ Vérification de package.json...');
try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const mapsVersion = packageJson.dependencies?.['react-native-maps'];
    
    if (mapsVersion) {
        console.log(`   ✅ react-native-maps installé: ${mapsVersion}`);
        
        if (mapsVersion !== '1.18.0') {
            console.log(`   ⚠️  Version recommandée: 1.18.0 (actuelle: ${mapsVersion})`);
            hasWarnings = true;
        }
    } else {
        console.log('   ❌ react-native-maps non installé');
        hasErrors = true;
    }
} catch (error) {
    console.log(`   ❌ Erreur lors de la lecture de package.json: ${error.message}`);
    hasErrors = true;
}

// Vérifier .env
console.log('\n4️⃣ Vérification de .env...');
try {
    const envPath = path.join(__dirname, '..', '.env');
    const env = fs.readFileSync(envPath, 'utf8');
    
    const apiKeyMatch = env.match(/EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=(.+)/);
    
    if (apiKeyMatch) {
        const key = apiKeyMatch[1].trim();
        console.log(`   ✅ Clé trouvée dans .env: ${key.substring(0, 20)}...`);
    } else {
        console.log('   ⚠️  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY non trouvée dans .env');
        hasWarnings = true;
    }
} catch (error) {
    console.log(`   ⚠️  Fichier .env non trouvé ou illisible: ${error.message}`);
    hasWarnings = true;
}

// Vérifier build.gradle
console.log('\n5️⃣ Vérification de build.gradle...');
try {
    const buildGradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
    const buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
    
    const packageMatch = buildGradle.match(/applicationId\s+"([^"]+)"/);
    
    if (packageMatch) {
        const packageName = packageMatch[1];
        console.log(`   ✅ Package name: ${packageName}`);
        
        if (packageName !== 'com.navipad.app') {
            console.log(`   ⚠️  Package name attendu: com.navipad.app`);
            hasWarnings = true;
        }
    } else {
        console.log('   ⚠️  Package name non trouvé');
        hasWarnings = true;
    }
} catch (error) {
    console.log(`   ⚠️  Erreur lors de la lecture de build.gradle: ${error.message}`);
    hasWarnings = true;
}

// Résumé
console.log('\n' + '═'.repeat(60));
console.log('\n📊 Résumé\n');

if (!hasErrors && !hasWarnings) {
    console.log('✅ Tout est correctement configuré !');
    console.log('\nSi la carte ne s\'affiche toujours pas:');
    console.log('1. Vérifiez que l\'API Maps SDK for Android est activée dans Google Cloud Console');
    console.log('2. Vérifiez les restrictions de la clé API (package name + SHA-1)');
    console.log('3. Rebuild l\'application: npx expo run:android');
    console.log('4. Vérifiez que Google Play Services est installé sur l\'appareil/émulateur');
} else {
    if (hasErrors) {
        console.log('❌ Erreurs détectées - À corriger:');
        console.log('   Consultez les messages ci-dessus pour les détails');
    }
    if (hasWarnings) {
        console.log('⚠️  Avertissements détectés - À vérifier:');
        console.log('   Ces problèmes peuvent ne pas être critiques');
    }
    
    console.log('\n📖 Consultez TROUBLESHOOTING_GOOGLE_MAPS.md pour plus d\'aide');
}

console.log('\n' + '═'.repeat(60) + '\n');

// Suggestions
console.log('💡 Suggestions:\n');
console.log('1. Testez votre clé API:');
console.log('   https://maps.googleapis.com/maps/api/staticmap?center=48.8566,2.3522&zoom=13&size=600x300&key=VOTRE_CLE\n');

console.log('2. Vérifiez Google Cloud Console:');
console.log('   https://console.cloud.google.com/apis/dashboard\n');

console.log('3. Utilisez le composant de diagnostic:');
console.log('   import { MapDiagnostic } from \'@/components/debug/MapDiagnostic\';\n');

console.log('4. Rebuild l\'application:');
console.log('   npx expo run:android\n');

process.exit(hasErrors ? 1 : 0);
