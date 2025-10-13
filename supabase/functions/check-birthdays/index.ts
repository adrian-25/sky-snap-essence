import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (_req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get tomorrow's date (MM-DD format)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowMonth = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const tomorrowDay = String(tomorrow.getDate()).padStart(2, "0");

    console.log(`Checking for birthdays on ${tomorrowMonth}-${tomorrowDay}`);

    // Get all images with birth dates matching tomorrow
    const { data: images, error: imagesError } = await supabase
      .from("images")
      .select("user_id, friend_name, birth_date")
      .not("birth_date", "is", null)
      .not("friend_name", "is", null);

    if (imagesError) {
      console.error("Error fetching images:", imagesError);
      throw imagesError;
    }

    // Filter images where birth_date month/day matches tomorrow
    const upcomingBirthdays = images?.filter((img) => {
      if (!img.birth_date) return false;
      const birthDate = new Date(img.birth_date);
      const birthMonth = String(birthDate.getMonth() + 1).padStart(2, "0");
      const birthDay = String(birthDate.getDate()).padStart(2, "0");
      return birthMonth === tomorrowMonth && birthDay === tomorrowDay;
    }) || [];

    console.log(`Found ${upcomingBirthdays.length} upcoming birthdays`);

    // Group by user_id and friend_name
    const birthdaysByUser = new Map<string, Set<string>>();
    for (const img of upcomingBirthdays) {
      if (!birthdaysByUser.has(img.user_id)) {
        birthdaysByUser.set(img.user_id, new Set());
      }
      birthdaysByUser.get(img.user_id)!.add(img.friend_name);
    }

    // Send emails for each user
    const emailPromises = [];
    for (const [userId, friendNames] of birthdaysByUser.entries()) {
      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .single();

      // Get user email from auth.users
      const { data: { user } } = await supabase.auth.admin.getUserById(userId);

      if (user?.email && profile?.username) {
        for (const friendName of friendNames) {
          console.log(`Sending birthday email to ${user.email} for ${friendName}`);
          
          // Call the send-birthday-email function
          const emailPromise = supabase.functions.invoke("send-birthday-email", {
            body: {
              userEmail: user.email,
              userName: profile.username,
              friendName,
            },
          });
          emailPromises.push(emailPromise);
        }
      }
    }

    await Promise.all(emailPromises);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${emailPromises.length} birthday reminders`,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in check-birthdays:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
