import { createClient } from '@supabase/supabase-js'
import { grants } from '@/lib/grants-data'
import { differenceInDays, parseISO } from 'date-fns'

// This endpoint is called by Vercel Cron Jobs
// Configure in vercel.json to run daily

export async function GET(request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization')
  const cronSecret = (process.env.CRON_SECRET || '').trim()
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const today = new Date()
  const notifications = []

  // Check for upcoming deadlines
  for (const grant of grants) {
    if (grant.deadline === 'rolling' || grant.deadline === 'various') continue

    const deadline = parseISO(grant.deadline)
    const daysUntil = differenceInDays(deadline, today)

    // Notify at 14 days, 7 days, and 3 days before deadline
    if ([14, 7, 3, 1].includes(daysUntil)) {
      // Get all users tracking this grant who haven't submitted
      const { data: progressRecords } = await supabase
        .from('grant_progress')
        .select('user_id, status')
        .eq('grant_id', grant.id)
        .not('status', 'in', '("submitted","successful","unsuccessful")')

      if (progressRecords) {
        for (const record of progressRecords) {
          notifications.push({
            user_id: record.user_id,
            type: 'deadline',
            title: `Deadline Alert: ${grant.name}`,
            message: daysUntil === 1
              ? `Tomorrow is the deadline for ${grant.name}!`
              : `${daysUntil} days until the deadline for ${grant.name}`,
            grant_id: grant.id
          })
        }
      }
    }
  }

  // Also notify users with custom reminders due today
  const { data: customReminders } = await supabase
    .from('grant_progress')
    .select('user_id, grant_id')
    .eq('reminder_date', today.toISOString().split('T')[0])
    .eq('reminder_sent', false)

  if (customReminders) {
    for (const reminder of customReminders) {
      const grant = grants.find(g => g.id === reminder.grant_id)
      if (grant) {
        notifications.push({
          user_id: reminder.user_id,
          type: 'reminder',
          title: `Reminder: ${grant.name}`,
          message: `You set a reminder for ${grant.name}`,
          grant_id: reminder.grant_id
        })

        // Mark reminder as sent
        await supabase
          .from('grant_progress')
          .update({ reminder_sent: true })
          .eq('user_id', reminder.user_id)
          .eq('grant_id', reminder.grant_id)
      }
    }
  }

  // Insert all notifications
  if (notifications.length > 0) {
    await supabase.from('notifications').insert(notifications)
  }

  return Response.json({
    success: true,
    notificationsSent: notifications.length,
    timestamp: new Date().toISOString()
  })
}
