/*
  # Create Profiles Table for Interview Platform

  ## Overview
  This migration creates the core profiles table for storing user data, resume information, and interview history.

  ## New Tables
  - `profiles`
    - `id` (uuid, primary key) - References auth.users(id)
    - `full_name` (text, not null) - User's full name
    - `email` (text, unique, not null) - User's email address
    - `skills` (text[], default empty array) - Array of skills extracted from resume
    - `projects` (jsonb, default empty array) - Projects from resume in JSON format
    - `resume_metadata` (jsonb, default empty object) - Metadata about the uploaded resume
    - `interview_history` (jsonb, default empty array) - Array of interview sessions (max 10)
    - `created_at` (timestamptz, default now()) - Account creation timestamp
    - `updated_at` (timestamptz, default now()) - Last update timestamp

  ## Security
  - Enable Row Level Security (RLS) on `profiles` table
  - Users can read their own profile
  - Users can update their own profile
  - Users can insert their own profile (on signup)

  ## Important Notes
  1. interview_history stores up to 10 sessions; oldest entries removed when exceeded
  2. resume_metadata stores extracted resume text and parsing info
  3. projects field stores array of project objects with name, description, tech stack
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  skills text[] DEFAULT '{}',
  projects jsonb DEFAULT '[]'::jsonb,
  resume_metadata jsonb DEFAULT '{}'::jsonb,
  interview_history jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);

-- Create index on user id for faster lookups
CREATE INDEX IF NOT EXISTS profiles_id_idx ON profiles(id);
