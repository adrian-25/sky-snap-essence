import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get today's date in MM-DD format
    const today = new Date();
    const todayMonthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    console.log('Checking birthdays for:', todayMonthDay);

    // Query profiles for birthdays matching today
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, birthday')
      .not('birthday', 'is', null);

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      throw profileError;
    }

    console.log('Found profiles:', profiles?.length);

    // Filter profiles with today's birthday
    const birthdayProfiles = profiles?.filter(profile => {
      if (!profile.birthday) return false;
      const birthDate = new Date(profile.birthday);
      const birthMonthDay = `${String(birthDate.getMonth() + 1).padStart(2, '0')}-${String(birthDate.getDate()).padStart(2, '0')}`;
      return birthMonthDay === todayMonthDay;
    }) || [];

    console.log('Birthday profiles today:', birthdayProfiles.length);

    // Send emails for each birthday person
    const results = [];
    for (const profile of birthdayProfiles) {
      // Get user's email from auth.users
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.id);
      
      if (userError || !userData.user) {
        console.error('Error fetching user:', userError);
        continue;
      }

      const userEmail = userData.user.email;
      
      // Get all images for this user
      const { data: images, error: imagesError } = await supabase
        .from('images')
        .select('image_url, uploaded_at')
        .eq('user_id', profile.id)
        .order('uploaded_at', { ascending: false })
        .limit(10);

      if (imagesError) {
        console.error('Error fetching images:', imagesError);
      }

      // For now, just log - you'll need to integrate with an email service like Resend
      console.log(`🎂 Birthday today for ${profile.username} (${userEmail})`);
      console.log(`Found ${images?.length || 0} images for memory collage`);
      
      // TODO: Integrate with email service (Resend) to send actual emails
      // You'll need to add RESEND_API_KEY secret and implement email sending
      
      results.push({
        username: profile.username,
        email: userEmail,
        imageCount: images?.length || 0,
        status: 'logged' // Change to 'sent' when email is implemented
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Checked ${profiles?.length} profiles, found ${birthdayProfiles.length} birthdays today`,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in send-birthday-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});