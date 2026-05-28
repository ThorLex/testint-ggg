#!/usr/bin/env node

/**
 * Script de test de connexion à l'API Navipad
 * 
 * Usage: node scripts/test-api-connection.js
 */

const https = require('https');

const API_BASE_URL = 'https://navipad-superbase.vercel.app';
const API_KEY = '88abf96eead6f01f632b98a6315f64a8c09d084b1ba43917ca1d4591581cd95d';

const endpoints = [
    { name: 'Map Data', path: '/api/public/map/all' },
    { name: 'Amodiataires', path: '/api/mobile/public/amodiataires?limit=1' },
    { name: 'Zone Bounds', path: '/api/geolocation/zone-bounds' },
];

console.log('🔍 Test de connexion à l\'API Navipad\n');
console.log(`URL de base: ${API_BASE_URL}`);
console.log(`Clé API: ${API_KEY.substring(0, 20)}...\n`);

function testEndpoint(endpoint) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const url = `${API_BASE_URL}${endpoint.path}`;
        
        console.log(`\n📡 Test: ${endpoint.name}`);
        console.log(`   URL: ${url}`);
        
        const options = {
            method: 'GET',
            headers: {
                'x-api-key': API_KEY,
                'Accept': 'application/json',
            },
        };
        
        const req = https.request(url, options, (res) => {
            const duration = Date.now() - startTime;
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`   ✅ Status: ${res.statusCode}`);
                console.log(`   ⏱️  Durée: ${duration}ms`);
                
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        console.log(`   📦 Données reçues: ${JSON.stringify(json).substring(0, 100)}...`);
                        resolve({ success: true, status: res.statusCode, duration, data: json });
                    } catch (e) {
                        console.log(`   ⚠️  Erreur de parsing JSON: ${e.message}`);
                        console.log(`   📄 Données brutes: ${data.substring(0, 200)}...`);
                        resolve({ success: false, status: res.statusCode, duration, error: 'JSON parse error' });
                    }
                } else {
                    console.log(`   ❌ Erreur: ${res.statusCode} ${res.statusMessage}`);
                    console.log(`   📄 Réponse: ${data.substring(0, 200)}`);
                    resolve({ success: false, status: res.statusCode, duration, error: data });
                }
            });
        });
        
        req.on('error', (error) => {
            const duration = Date.now() - startTime;
            console.log(`   ❌ Erreur de connexion: ${error.message}`);
            console.log(`   ⏱️  Durée: ${duration}ms`);
            resolve({ success: false, duration, error: error.message });
        });
        
        req.on('timeout', () => {
            const duration = Date.now() - startTime;
            console.log(`   ⏱️  Timeout après ${duration}ms`);
            req.destroy();
            resolve({ success: false, duration, error: 'Timeout' });
        });
        
        req.setTimeout(30000); // 30 secondes
        req.end();
    });
}

async function runTests() {
    const results = [];
    
    for (const endpoint of endpoints) {
        const result = await testEndpoint(endpoint);
        results.push({ endpoint: endpoint.name, ...result });
    }
    
    console.log('\n\n📊 Résumé des Tests\n');
    console.log('═'.repeat(60));
    
    results.forEach((result) => {
        const status = result.success ? '✅ SUCCÈS' : '❌ ÉCHEC';
        console.log(`${status} - ${result.endpoint}`);
        console.log(`   Durée: ${result.duration}ms`);
        if (result.status) {
            console.log(`   Status HTTP: ${result.status}`);
        }
        if (result.error) {
            console.log(`   Erreur: ${result.error}`);
        }
        console.log('');
    });
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    console.log('═'.repeat(60));
    console.log(`\n🎯 Résultat: ${successCount}/${totalCount} tests réussis\n`);
    
    if (successCount === totalCount) {
        console.log('✅ Tous les endpoints sont accessibles !');
        console.log('   L\'API fonctionne correctement.\n');
    } else {
        console.log('⚠️  Certains endpoints ne sont pas accessibles.');
        console.log('   Vérifiez:');
        console.log('   1. Votre connexion internet');
        console.log('   2. L\'état du serveur backend');
        console.log('   3. La clé API');
        console.log('   4. Les URLs des endpoints\n');
    }
}

runTests().catch(console.error);
