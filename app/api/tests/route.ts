import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Database not configured. Please add Supabase environment variables.' },
        { status: 503 }
      );
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tests')
      .select('*, questions(count)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ tests: data });
  } catch (error) {
    console.error('Error fetching tests:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testName, duration, description, questions, userId, isPublic } = body;

    if (!testName || !duration || !questions || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: testName, duration, questions, userId' },
        { status: 400 }
      );
    }

    // Insert test
    const { data: test, error: testError } = await supabase
      .from('tests')
      .insert({
        test_name: testName,
        duration,
        description,
        user_id: userId,
        is_public: isPublic || false,
      })
      .select()
      .single();

    if (testError) throw testError;

    // Insert questions
    const questionsData = questions.map((q: any, index: number) => ({
      test_id: test.id,
      question_text: q.question || q.questionText,
      section: q.section || 'General',
      difficulty: q.difficulty || 'medium',
      option_a: q.options?.A || q.optionA,
      option_b: q.options?.B || q.optionB,
      option_c: q.options?.C || q.optionC,
      option_d: q.options?.D || q.optionD,
      correct_answer: q.correctAnswer,
      explanation: q.explanation || '',
      question_order: index,
    }));

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsData);

    if (questionsError) throw questionsError;

    return NextResponse.json({ success: true, test });
  } catch (error) {
    console.error('Error creating test:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create test' },
      { status: 500 }
    );
  }
}
