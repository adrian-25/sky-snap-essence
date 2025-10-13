import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, friendName } = await req.json();

    if (!userEmail || !userName || !friendName) {
      throw new Error("Missing required fields");
    }

    const { error } = await resend.emails.send({
      from: "Cloud Memory Gallery <onboarding@resend.dev>",
      to: [userEmail],
      subject: `🎉 Tomorrow is ${friendName}'s Birthday!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4F46E5; text-align: center;">🎂 Birthday Reminder</h1>
          <p style="font-size: 16px; line-height: 1.6;">
            Hi ${userName},
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            Just a friendly reminder that <strong>${friendName}'s birthday</strong> is tomorrow! 🎉
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            We've compiled all your memories with ${friendName} in your Cloud Memory Gallery. 
            Log in to view and share them!
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get('SUPABASE_URL')}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 12px 30px; 
                      text-decoration: none; 
                      border-radius: 8px;
                      display: inline-block;">
              View Memories
            </a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Best wishes,<br>
            Cloud Memory Gallery Team
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Email send error:", error);
      throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error in send-birthday-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
