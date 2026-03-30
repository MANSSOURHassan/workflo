import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase.from('activities').select('*').limit(1)
  if (error) {
    console.error('Error fetching activities:', error)
  } else {
    console.log('Columns:', data?.[0] ? Object.keys(data[0]) : 'No rows to inspect')
  }
}

test()
