#!/usr/bin/env tsx

/**
 * Test Data Seeding Script for Unveil App
 * 
 * This script creates comprehensive test data for both host and guest experiences.
 * It detects your current user and creates realistic scenarios where you can test:
 * - Being a guest at other people's events
 * - Being a host with guests for your own events
 * - Various RSVP statuses, messaging, media, and sub-events
 * 
 * Usage:
 * 1. Set your SUPABASE_URL and SUPABASE_ANON_KEY in .env.local
 * 2. Run: npx tsx scripts/seed-test-data.ts
 * 3. Or run with custom options: npx tsx scripts/seed-test-data.ts --clean
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../app/reference/supabase.types'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        if (value && !process.env[key]) {
          process.env[key] = value
        }
      }
    })
  }
}

// Load environment variables
loadEnvFile()

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)

// Test user data
const TEST_USERS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'alice.smith@example.com',
    full_name: 'Alice Smith',
    phone: '+1234567001',
    role: 'host' as const,
    avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616c2c01a1e?w=150'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'bob.johnson@example.com',
    full_name: 'Bob Johnson',
    phone: '+1234567002',
    role: 'host' as const,
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'carol.davis@example.com',
    full_name: 'Carol Davis',
    phone: '+1234567003',
    role: 'guest' as const,
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'david.wilson@example.com',
    full_name: 'David Wilson',
    phone: '+1234567004',
    role: 'guest' as const,
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    email: 'emma.brown@example.com',
    full_name: 'Emma Brown',
    phone: '+1234567005',
    role: 'host' as const,
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
  }
]

async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.log('ℹ️  No authenticated user found. Test data will be created without user association.')
    return null
  }
  return user
}

async function createTestUsers() {
  console.log('👥 Creating test users...')
  
  const { error } = await supabase
    .from('users')
    .upsert(TEST_USERS, { onConflict: 'id' })
  
  if (error) {
    console.error('❌ Error creating test users:', error.message)
    return false
  }
  
  console.log('✅ Test users created successfully')
  return true
}

async function createTestEvents(currentUserId?: string) {
  console.log('🎉 Creating test events...')
  
  const events = [
    {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      title: 'Alice & Michael\'s Wedding',
      description: 'Join us for our special day filled with love, laughter, and celebration. We can\'t wait to share this magical moment with our closest family and friends.',
      event_date: '2024-08-15T16:00:00+00:00',
      location: 'Rosewood Manor, Napa Valley, California',
      host_user_id: '11111111-1111-1111-1111-111111111111',
      is_public: false,
      header_image_url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800'
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      title: 'Bob\'s 30th Birthday Bash',
      description: 'Let\'s celebrate three decades of Bob! Come party with us for an unforgettable night of music, dancing, and great company.',
      event_date: '2024-07-20T19:00:00+00:00',
      location: 'The Rooftop Bar, Downtown San Francisco',
      host_user_id: '22222222-2222-2222-2222-222222222222',
      is_public: true,
      header_image_url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800'
    },
    {
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      title: 'Emma\'s Baby Shower',
      description: 'Help us celebrate the upcoming arrival of Baby Brown! Join us for an afternoon of games, gifts, and sweet treats.',
      event_date: '2024-09-05T14:00:00+00:00',
      location: 'Garden Pavilion, Golden Gate Park',
      host_user_id: '55555555-5555-5555-5555-555555555555',
      is_public: false,
      header_image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800'
    }
  ]
  
  // Add user's own test event if they're authenticated
  if (currentUserId) {
    events.push({
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      title: 'My Test Event',
      description: 'This is a test event that I\'m hosting to test the host experience with guests.',
      event_date: '2024-08-01T18:00:00+00:00',
      location: 'My Test Venue, My City',
      host_user_id: currentUserId,
      is_public: false,
      header_image_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800'
    })
  }
  
  const { error } = await supabase
    .from('events')
    .upsert(events, { onConflict: 'id' })
  
  if (error) {
    console.error('❌ Error creating test events:', error.message)
    return false
  }
  
  console.log('✅ Test events created successfully')
  return true
}

async function createSubEvents() {
  console.log('📅 Creating sub-events...')
  
  const subEvents = [
    {
      id: 'sub1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      event_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'Rehearsal Dinner',
      description: 'Intimate dinner for the wedding party and immediate family',
      event_date: '2024-08-14T18:30:00+00:00',
      location: 'Vineyard Restaurant, Napa Valley',
      is_required: false,
      sort_order: 1
    },
    {
      id: 'sub2-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      event_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'Wedding Ceremony',
      description: 'The main wedding ceremony',
      event_date: '2024-08-15T16:00:00+00:00',
      location: 'Rosewood Manor Gardens',
      is_required: true,
      sort_order: 2
    },
    {
      id: 'sub3-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      event_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'Reception',
      description: 'Dinner, dancing, and celebration',
      event_date: '2024-08-15T18:00:00+00:00',
      location: 'Rosewood Manor Ballroom',
      is_required: true,
      sort_order: 3
    },
    {
      id: 'sub4-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      event_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'After Party',
      description: 'Late night celebration for the party animals',
      event_date: '2024-08-15T22:00:00+00:00',
      location: 'The Wine Cellar',
      is_required: false,
      sort_order: 4
    }
  ]
  
  const { error } = await supabase
    .from('sub_events')
    .upsert(subEvents, { onConflict: 'id' })
  
  if (error) {
    console.error('❌ Error creating sub-events:', error.message)
    return false
  }
  
  console.log('✅ Sub-events created successfully')
  return true
}

async function createEventGuests(currentUserId?: string, currentUserEmail?: string, currentUserPhone?: string) {
  console.log('👤 Creating event guests...')
  
  const guests = []
  
  // Add current user as guest to Alice's Wedding if authenticated
  if (currentUserId && currentUserEmail) {
    guests.push({
      id: 'guest-user-aaaa-aaaa-aaaaaaaaaaaa',
      event_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      guest_name: 'You (Current User)',
      guest_email: currentUserEmail,
      phone: currentUserPhone || '+1234567999',
      rsvp_status: 'pending',
      user_id: currentUserId,
      guest_tags: ['friends', 'app_users'],
      notes: 'Current app user testing guest experience'
    })
    
    // Add current user to Bob's Birthday
    guests.push({
      id: 'guest-user-bbbb-bbbb-bbbbbbbbbbbb',
      event_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      guest_name: 'You (Current User)',
      guest_email: currentUserEmail,
      phone: currentUserPhone || '+1234567999',
      rsvp_status: 'attending',
      user_id: currentUserId,
      guest_tags: ['close_friends'],
      notes: 'Close friend testing the guest experience'
    })
  }
  
  // Alice's Wedding guests
  guests.push(
    {
      id: 'guest2-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      event_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      guest_name: 'Carol Davis',
      guest_email: 'carol.davis@example.com',
      phone: '+1234567003',
      rsvp_status: 'attending',
      user_id: '33333333-3333-3333-3333-333333333333',
      guest_tags: ['family', 'bride_side'],
      notes: 'Sister of the bride'
    },
    {
      id: 'guest3-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      event_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      guest_name: 'David Wilson',
      guest_email: 'david.wilson@example.com',
      phone: '+1234567004',
      rsvp_status: 'attending',
      user_id: '44444444-4444-4444-4444-444444444444',
      guest_tags: ['friends', 'groom_side'],
      notes: 'Best friend of the groom'
    },
    {
      id: 'guest4-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      event_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      guest_name: 'Jennifer Miller',
      guest_email: 'jennifer.miller@example.com',
      phone: '+1234567010',
      rsvp_status: 'maybe',
      user_id: null,
      guest_tags: ['family', 'bride_side'],
      notes: 'Aunt of the bride'
    }
  )
  
  // Bob's Birthday guests
  guests.push(
    {
      id: 'guest2-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      event_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      guest_name: 'Alice Smith',
      guest_email: 'alice.smith@example.com',
      phone: '+1234567001',
      rsvp_status: 'attending',
      user_id: '11111111-1111-1111-1111-111111111111',
      guest_tags: ['close_friends'],
      notes: 'Childhood friend'
    },
    {
      id: 'guest3-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      event_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      guest_name: 'Emma Brown',
      guest_email: 'emma.brown@example.com',
      phone: '+1234567005',
      rsvp_status: 'maybe',
      user_id: '55555555-5555-5555-5555-555555555555',
      guest_tags: ['work_friends'],
      notes: 'Coworker'
    }
  )
  
  // Add guests to user's own event if they're authenticated
  if (currentUserId) {
    guests.push(
      {
        id: 'guest1-cccc-cccc-cccc-cccccccccccc',
        event_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        guest_name: 'Alice Smith',
        guest_email: 'alice.smith@example.com',
        phone: '+1234567001',
        rsvp_status: 'attending',
        user_id: '11111111-1111-1111-1111-111111111111',
        guest_tags: ['vip', 'close_friends'],
        notes: 'Close friend and fellow host'
      },
      {
        id: 'guest2-cccc-cccc-cccc-cccccccccccc',
        event_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        guest_name: 'Test Guest Without Account',
        guest_email: 'test.guest@example.com',
        phone: '+1234567030',
        rsvp_status: 'pending',
        user_id: null,
        guest_tags: ['acquaintances'],
        notes: 'Someone without an app account'
      }
    )
  }
  
  const { error } = await supabase
    .from('event_guests')
    .upsert(guests, { onConflict: 'id' })
  
  if (error) {
    console.error('❌ Error creating event guests:', error.message)
    return false
  }
  
  console.log('✅ Event guests created successfully')
  return true
}

async function createSampleMessages() {
  console.log('💬 Creating sample messages...')
  
  const messages = [
    {
      id: 'msg1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      event_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      sender_user_id: '11111111-1111-1111-1111-111111111111',
      content: 'Welcome to our wedding celebration! We\'re so excited to share this special day with all of you. Please don\'t hesitate to reach out if you have any questions.',
      message_type: 'announcement',
      recipient_tags: ['all']
    },
    {
      id: 'msg2-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      event_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      sender_user_id: '33333333-3333-3333-3333-333333333333',
      content: 'Can\'t wait for the big day! Is there anything I can help with for setup?',
      message_type: 'channel',
      recipient_tags: ['family']
    },
    {
      id: 'msg3-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      event_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      sender_user_id: '11111111-1111-1111-1111-111111111111',
      content: 'Thanks Carol! We\'ll have a setup crew, but your offer means the world to us. Just come ready to celebrate! 💕',
      message_type: 'channel',
      recipient_tags: ['family']
    }
  ]
  
  const { error } = await supabase
    .from('messages')
    .upsert(messages, { onConflict: 'id' })
  
  if (error) {
    console.error('❌ Error creating messages:', error.message)
    return false
  }
  
  console.log('✅ Sample messages created successfully')
  return true
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up existing test data...')
  
  const testEventIds = [
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'cccccccc-cccc-cccc-cccc-cccccccccccc'
  ]
  
  const testUserIds = TEST_USERS.map(u => u.id)
  
  // Delete in correct order due to foreign key constraints
  await supabase.from('guest_sub_event_assignments').delete().in('guest_id', 
    ['guest1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'guest2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'guest3-aaaa-aaaa-aaaa-aaaaaaaaaaaa']
  )
  await supabase.from('messages').delete().in('event_id', testEventIds)
  await supabase.from('media').delete().in('event_id', testEventIds)
  await supabase.from('event_guests').delete().in('event_id', testEventIds)
  await supabase.from('sub_events').delete().in('event_id', testEventIds)
  await supabase.from('events').delete().in('id', testEventIds)
  await supabase.from('users').delete().in('id', testUserIds)
  
  console.log('✅ Test data cleanup completed')
}

async function main() {
  const args = process.argv.slice(2)
  const shouldClean = args.includes('--clean')
  
  console.log('🚀 Starting Unveil Test Data Seeding...\n')
  
  if (shouldClean) {
    await cleanupTestData()
    console.log()
  }
  
  // Get current user context
  const currentUser = await getCurrentUser()
  const currentUserId = currentUser?.id
  const currentUserEmail = currentUser?.email
  const currentUserPhone = currentUser?.phone
  
  if (currentUser) {
    console.log(`👋 Hello ${currentUser.email}! Creating personalized test data...\n`)
  } else {
    console.log('👋 Creating general test data (no authenticated user found)...\n')
  }
  
  // Create all test data
  let success = true
  success = success && await createTestUsers()
  success = success && await createTestEvents(currentUserId)
  success = success && await createSubEvents()
  success = success && await createEventGuests(currentUserId, currentUserEmail, currentUserPhone)
  success = success && await createSampleMessages()
  
  if (success) {
    console.log('\n🎉 Test data seeding completed successfully!')
    console.log('\n📋 Summary of what was created:')
    console.log('   • 5 test users (Alice, Bob, Carol, David, Emma)')
    console.log('   • Multiple test events with different hosts')
    console.log('   • Sub-events for Alice\'s Wedding')
    console.log('   • Event guests with various RSVP statuses')
    console.log('   • Sample messages and communication')
    
    if (currentUser) {
      console.log('\n👤 Your personalized test scenarios:')
      console.log('   • You\'re invited as a GUEST to Alice\'s Wedding and Bob\'s Birthday')
      console.log('   • You\'re the HOST of "My Test Event" with several guests')
      console.log('   • Test different RSVP flows, messaging, and media uploads')
    } else {
      console.log('\n💡 Tip: Log into your app and run this script again to get personalized test data!')
    }
    
    console.log('\n🔗 Next steps:')
    console.log('   1. Open your Unveil app')
    console.log('   2. Navigate to different events to test guest vs host experiences')
    console.log('   3. Try RSVPing, sending messages, uploading media, etc.')
    console.log('   4. Run with --clean flag to reset test data anytime')
  } else {
    console.log('\n❌ Test data seeding failed. Check the errors above.')
    process.exit(1)
  }
}

// Run the script
main().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
}) 