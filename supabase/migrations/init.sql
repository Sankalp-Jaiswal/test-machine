-- Create tests table
CREATE TABLE IF NOT EXISTS tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name VARCHAR(255) NOT NULL,
  duration INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  section VARCHAR(100) NOT NULL,
  difficulty VARCHAR(50) DEFAULT 'medium',
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer VARCHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT,
  question_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create test results table
CREATE TABLE IF NOT EXISTS test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_id VARCHAR(255) NOT NULL,
  correct_answers INTEGER NOT NULL,
  wrong_answers INTEGER NOT NULL,
  skipped INTEGER NOT NULL,
  accuracy NUMERIC(5, 2) NOT NULL,
  time_taken INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user answers table
CREATE TABLE IF NOT EXISTS user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id UUID NOT NULL REFERENCES test_results(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer VARCHAR(1),
  time_spent INTEGER,
  marked_for_review BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_tests_user_id ON tests(user_id);
CREATE INDEX idx_tests_created_at ON tests(created_at);
CREATE INDEX idx_questions_test_id ON questions(test_id);
CREATE INDEX idx_test_results_test_id ON test_results(test_id);
CREATE INDEX idx_test_results_user_id ON test_results(user_id);
CREATE INDEX idx_test_results_completed_at ON test_results(completed_at);
CREATE INDEX idx_user_answers_result_id ON user_answers(result_id);
CREATE INDEX idx_user_answers_question_id ON user_answers(question_id);

-- Enable Row Level Security
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;

-- Create policies for tests table
CREATE POLICY "Anyone can view public tests" ON tests
  FOR SELECT USING (is_public = TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can create tests" ON tests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tests" ON tests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tests" ON tests
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for questions table
CREATE POLICY "Anyone can view questions of public tests" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tests WHERE tests.id = questions.test_id 
      AND (tests.is_public = TRUE OR auth.uid() = tests.user_id)
    )
  );

CREATE POLICY "Users can manage questions in own tests" ON questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tests WHERE tests.id = questions.test_id 
      AND auth.uid() = tests.user_id
    )
  );

-- Create policies for test_results table
CREATE POLICY "Users can view own results" ON test_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create results" ON test_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for user_answers table
CREATE POLICY "Users can view own answers" ON user_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM test_results 
      WHERE test_results.id = user_answers.result_id 
      AND auth.uid() = test_results.user_id
    )
  );

CREATE POLICY "Users can create answers" ON user_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM test_results 
      WHERE test_results.id = user_answers.result_id 
      AND auth.uid() = test_results.user_id
    )
  );
