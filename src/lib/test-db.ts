import { supabase } from './supabase'

export async function testDatabaseSetup() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test watercraft types
    console.log('Testing watercraft_types table...')
    const { data: watercraftTypes, error: watercraftError } = await supabase
      .from('watercraft_types')
      .select('*')
    
    if (watercraftError) {
      console.error('Watercraft types error:', watercraftError)
      throw watercraftError
    }
    console.log('Watercraft Types:', watercraftTypes)

    // Test daily schedules
    console.log('Testing daily_schedules table...')
    const { data: schedules, error: schedulesError } = await supabase
      .from('daily_schedules')
      .select('*')
    
    if (schedulesError) {
      console.error('Daily schedules error:', schedulesError)
      throw schedulesError
    }
    console.log('Daily Schedules:', schedules)

    // Test reservations
    console.log('Testing reservations table...')
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('*')
    
    if (reservationsError) {
      console.error('Reservations error:', reservationsError)
      throw reservationsError
    }
    console.log('Reservations:', reservations)

    // Test RLS policies
    console.log('Testing RLS policies...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
    
    if (userError) {
      // This should fail due to RLS if not authenticated
      console.log('RLS working as expected:', userError.message)
    }

    return {
      success: true,
      watercraftTypes,
      schedules,
      reservations
    }
  } catch (error) {
    console.error('Database test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
} 