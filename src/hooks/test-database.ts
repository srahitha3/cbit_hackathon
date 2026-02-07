// Add this function temporarily to test your database access
// You can call it from the browser console after importing

import { supabase } from "@/integrations/supabase/client";

export async function testDatabaseAccess() {
  const userId = "eea33269-b286-4cfe-a8f9-cbc619b8a857"; // Your user ID from the logs
  
  console.log("🧪 Testing database access for user:", userId);
  
  // Test 1: Check user_roles table
  console.log("📋 Test 1: Querying user_roles table...");
  try {
    const start1 = Date.now();
    const roleRes = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    const duration1 = Date.now() - start1;
    
    console.log(`✅ user_roles query completed in ${duration1}ms:`, roleRes);
  } catch (error) {
    console.error("❌ user_roles query failed:", error);
  }
  
  // Test 2: Check profiles table
  console.log("📋 Test 2: Querying profiles table...");
  try {
    const start2 = Date.now();
    const profileRes = await supabase
      .from("profiles")
      .select("full_name, department, enrollment_number")
      .eq("user_id", userId)
      .maybeSingle();
    const duration2 = Date.now() - start2;
    
    console.log(`✅ profiles query completed in ${duration2}ms:`, profileRes);
  } catch (error) {
    console.error("❌ profiles query failed:", error);
  }
  
  // Test 3: Check if tables exist at all
  console.log("📋 Test 3: Checking if tables exist...");
  try {
    const roleCheck = await supabase.from("user_roles").select("count");
    console.log("✅ user_roles table exists:", roleCheck);
    
    const profileCheck = await supabase.from("profiles").select("count");
    console.log("✅ profiles table exists:", profileCheck);
  } catch (error) {
    console.error("❌ Table check failed:", error);
  }
  
  console.log("🏁 Database tests complete");
}

// Auto-run test
testDatabaseAccess();