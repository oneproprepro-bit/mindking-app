const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(url, key);

async function test() {
    console.log("Testing connection...");
    const { data, error } = await supabase.from('children').select('*').limit(1);
    if (error) {
        console.error("Error querying children:", error);
    } else {
        console.log("Success! Found children:", data);
    }
}

test();
