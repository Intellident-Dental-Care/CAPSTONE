const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, service);

(async () => {
  try {
    // Try to create a policy that allows anyone to query for auth
    const sql = `CREATE POLICY auth_signin_policy ON auth.users FOR SELECT USING (true);`;
    
    const { data, error } = await admin.rpc('sql', { query: sql });
    
    if (error) {
      console.log('ERROR:', error.message || JSON.stringify(error));
    } else {
      console.log('SUCCESS:', data);
    }
  } catch (e) {
    console.log('ERROR_THROWN:', e.message);
  }
})();
