const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("=== GCventease Admin Creation Tool ===");
console.log("This script helps you elevate a user to 'Administrator' role.");
console.log("WARNING: You need your Supabase *SERVICE_ROLE* key (not the anon key) to make these changes.");
console.log("You can find this in your Supabase Dashboard > Settings > API > service_role (secret).");
console.log("");

rl.question('Enter Supabase URL: ', (url) => {
  rl.question('Enter SERVICE_ROLE Key: ', (key) => {
    rl.question('Enter Email of user to make Admin: ', async (email) => {

      try {
        const supabase = createClient(url, key, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });

        // 1. Find user by email (Admin API)
        /* 
           Note: listUsers is the standard way to find a user server-side.
           Ideally we'd use getUserByEmail if available in admin api, or list.
        */
        console.log(`Looking up user ${email}...`);

        // listUsers might be paginated, but hopefully it's small list or we find them.
        // Actually, admin.listUsers() is best.
        const { data: { users }, error } = await supabase.auth.admin.listUsers();

        if (error) throw error;

        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
          console.error(`\nError: User with email '${email}' not found!`);
          console.log("Please ensure the user has signed up first.");
        } else {
          console.log(`User found: ${user.id}`);
          console.log(`Current Role: ${user.user_metadata?.role || 'None'}`);

          // 2. Update user metadata
          const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { user_metadata: { ...user.user_metadata, role: 'Administrator' } }
          );

          if (updateError) throw updateError;

          console.log("\nSuccess! User has been promoted to Administrator.");
          console.log("They can now access the Admin Panel at /admin");
        }

      } catch (err) {
        console.error("\nAn error occurred:", err.message);
      } finally {
        rl.close();
      }
    });
  });
});
