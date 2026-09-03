import { Pool, types } from 'pg';

// Parse Postgres DATE type (1082) directly as string "YYYY-MM-DD"
types.setTypeParser(1082, (val: string) => val);

const connectionString = process.env.DATABASE_URL || 'postgres://hypnara:hypnara@localhost:5432/hypnara';

const pool = new Pool({ connectionString });

pool.on('error', (err) => {
  console.error('Postgres pool idle client error:', err.message);
});

let schemaInitialized = false;

export async function getDbPool() {
  if (!schemaInitialized) {
    try {
      await initSchema();
      schemaInitialized = true;
    } catch (err) {
      console.error('Error initializing schema:', err);
    }
  }
  return pool;
}

export async function initSchema(retriesLeft = 10) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS habits (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL REFERENCES users(username),
        date DATE NOT NULL,
        sleep_hours TEXT,
        screen_time TEXT,
        game_time TEXT,
        exercise_minutes TEXT,
        mood TEXT,
        schedule TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (username, date)
      );

      ALTER TABLE habits ADD COLUMN IF NOT EXISTS phone_cutoff_mins INTEGER;
      ALTER TABLE habits ADD COLUMN IF NOT EXISTS phone_pickups INTEGER;
      ALTER TABLE habits ADD COLUMN IF NOT EXISTS top_app TEXT;
      ALTER TABLE habits ADD COLUMN IF NOT EXISTS mood_score INTEGER;
      ALTER TABLE habits ADD COLUMN IF NOT EXISTS mood_note TEXT;

      CREATE TABLE IF NOT EXISTS action_commitments (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL REFERENCES users(username),
        title TEXT NOT NULL,
        target_date DATE NOT NULL,
        completed BOOLEAN DEFAULT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS user_profiles (
        username TEXT PRIMARY KEY REFERENCES users(username),
        primary_goal TEXT,
        reminder_time TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS reminders JSONB DEFAULT '[]'::jsonb;
    `);
  } catch (err: any) {
    if (retriesLeft <= 0) {
      console.error('Postgres connection failed:', err.message);
      throw err;
    }
    await new Promise((r) => setTimeout(r, 1000));
    return initSchema(retriesLeft - 1);
  }
}

export function habitRowToJSON(row: any) {
  return {
    id: row.id,
    username: row.username,
    date: row.date,
    sleepHours: row.sleep_hours,
    screenTime: row.screen_time,
    gameTime: row.game_time,
    exerciseMinutes: row.exercise_minutes,
    mood: row.mood,
    schedule: row.schedule,
    phoneCutoffMins: row.phone_cutoff_mins !== null && row.phone_cutoff_mins !== undefined ? Number(row.phone_cutoff_mins) : null,
    phonePickups: row.phone_pickups !== null && row.phone_pickups !== undefined ? Number(row.phone_pickups) : null,
    topApp: row.top_app || '',
    moodScore: row.mood_score !== null && row.mood_score !== undefined ? Number(row.mood_score) : null,
    moodNote: row.mood_note || '',
    createdAt: row.created_at,
  };
}

export default pool;
