// Script pour tester la connexion à Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fimtgkoeizkvdaxiopdw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpbXRna29laXprdmRheGlvcGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDk1NTEsImV4cCI6MjA4NTEyNTU1MX0.zhA9RbGUDAWnVkGnTcTbTEDYeMAPFj8A8zpTs4hxMpc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('🔄 Test de connexion à Supabase...\n');

    try {
        // Test 1: Vérifier la connexion
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });

        if (error) {
            if (error.code === '42P01') {
                console.log('⚠️  La table "users" n\'existe pas encore.');
                console.log('👉 Vous devez exécuter le schema SQL dans Supabase.\n');
            } else {
                console.log('❌ Erreur:', error.message);
            }
        } else {
            console.log('✅ Connexion réussie !');
            console.log('✅ La table "users" existe.\n');
        }

        // Test 2: Lister toutes les tables
        console.log('📋 Recherche des tables existantes...\n');

        const tables = ['users', 'clients', 'tasks', 'deals', 'activities', 'email_accounts', 'emails'];

        for (const table of tables) {
            const { error: tableError } = await supabase.from(table).select('count', { count: 'exact', head: true });

            if (tableError && tableError.code === '42P01') {
                console.log(`   ❌ ${table} - N'existe pas`);
            } else if (tableError) {
                console.log(`   ⚠️  ${table} - Erreur: ${tableError.message}`);
            } else {
                console.log(`   ✅ ${table} - Existe`);
            }
        }

        console.log('\n✨ Test terminé !');

    } catch (err) {
        console.log('❌ Erreur de connexion:', err.message);
    }
}

testConnection();
