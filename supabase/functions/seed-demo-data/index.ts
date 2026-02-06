import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if admin already exists
    const { data: existingRoles } = await supabaseAdmin.from("user_roles").select("id").eq("role", "admin").limit(1);
    if (existingRoles && existingRoles.length > 0) {
      return new Response(JSON.stringify({ message: "Seed data already exists" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create admin
    const { data: admin } = await supabaseAdmin.auth.admin.createUser({
      email: "admin@campus.edu",
      password: "Admin@123456",
      email_confirm: true,
      user_metadata: { full_name: "Dr. Admin Kumar" },
    });
    const adminId = admin.user!.id;
    await supabaseAdmin.from("user_roles").insert({ user_id: adminId, role: "admin" });
    await supabaseAdmin.from("profiles").update({ full_name: "Dr. Admin Kumar", department: "Administration" }).eq("user_id", adminId);

    // Create faculty
    const { data: faculty } = await supabaseAdmin.auth.admin.createUser({
      email: "faculty@campus.edu",
      password: "Faculty@123456",
      email_confirm: true,
      user_metadata: { full_name: "Prof. Sharma" },
    });
    const facultyId = faculty.user!.id;
    await supabaseAdmin.from("user_roles").insert({ user_id: facultyId, role: "faculty" });
    await supabaseAdmin.from("profiles").update({ full_name: "Prof. Sharma", department: "Computer Science" }).eq("user_id", facultyId);

    // Create student
    const { data: student } = await supabaseAdmin.auth.admin.createUser({
      email: "student@campus.edu",
      password: "Student@123456",
      email_confirm: true,
      user_metadata: { full_name: "Rahul Verma" },
    });
    const studentId = student.user!.id;
    await supabaseAdmin.from("user_roles").insert({ user_id: studentId, role: "student" });
    await supabaseAdmin.from("profiles").update({ full_name: "Rahul Verma", department: "Computer Science", enrollment_number: "CS2024001" }).eq("user_id", studentId);

    // Seed bonafide requests
    await supabaseAdmin.from("bonafide_requests").insert([
      { student_id: studentId, purpose: "Required for passport application", date_needed: "2026-03-01", status: "approved", remarks: "Approved. Please collect from office.", reviewed_by: facultyId },
      { student_id: studentId, purpose: "Bank account opening", date_needed: "2026-02-15", status: "pending" },
      { student_id: studentId, purpose: "Scholarship application", date_needed: "2026-01-20", status: "rejected", remarks: "Incomplete details. Please resubmit.", reviewed_by: facultyId },
    ]);

    // Seed notices
    await supabaseAdmin.from("notices").insert([
      { title: "Mid-Semester Examination Schedule", content: "Mid-semester exams will begin from March 15, 2026. Detailed schedule will be shared by departments. Students are advised to collect their hall tickets from the examination cell.", target_audience: ["student", "faculty"], created_by: adminId },
      { title: "Faculty Development Program", content: "A 3-day Faculty Development Program on 'AI in Education' will be held from Feb 20-22. All faculty members are encouraged to participate. Registration link will be shared via email.", target_audience: ["faculty"], created_by: adminId },
      { title: "Campus Maintenance Notice", content: "The campus WiFi will undergo maintenance on Feb 10 from 10 PM to 6 AM. Services may be intermittent during this period.", target_audience: ["student", "faculty", "admin"], created_by: adminId },
    ]);

    // Seed audit logs
    await supabaseAdmin.from("audit_logs").insert([
      { user_id: adminId, role: "admin", action: "user_created", details: { email: "faculty@campus.edu", role: "faculty" } },
      { user_id: adminId, role: "admin", action: "user_created", details: { email: "student@campus.edu", role: "student" } },
      { user_id: adminId, role: "admin", action: "notice_published", details: { title: "Mid-Semester Examination Schedule" } },
      { user_id: studentId, role: "student", action: "bonafide_request_submitted", details: { purpose: "Passport application" } },
      { user_id: facultyId, role: "faculty", action: "bonafide_request_approved", details: { student: "Rahul Verma" } },
    ]);

    return new Response(JSON.stringify({
      message: "Seed data created successfully",
      credentials: {
        admin: { email: "admin@campus.edu", password: "Admin@123456" },
        faculty: { email: "faculty@campus.edu", password: "Faculty@123456" },
        student: { email: "student@campus.edu", password: "Student@123456" },
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Seed error:", err);
    return new Response(JSON.stringify({ error: "Failed to seed data" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
