import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      testId,
      userId,
      attemptId,
      correctAnswers,
      wrongAnswers,
      skipped,
      accuracy,
      timeTaken,
      answers,
    } = body;

    if (!testId || !userId || !attemptId) {
      return NextResponse.json(
        { error: 'Missing required fields: testId, userId, attemptId' },
        { status: 400 }
      );
    }

    // Insert test result
    const { data: result, error: resultError } = await supabase
      .from('test_results')
      .insert({
        test_id: testId,
        user_id: userId,
        attempt_id: attemptId,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        skipped,
        accuracy,
        time_taken: timeTaken,
      })
      .select()
      .single();

    if (resultError) throw resultError;

    // Insert user answers
    if (answers && Object.keys(answers).length > 0) {
      const answersData = Object.entries(answers).map(([questionId, answer]: [string, any]) => ({
        result_id: result.id,
        question_id: questionId,
        selected_answer: answer.answer,
        time_spent: answer.timeTaken || 0,
        marked_for_review: answer.marked || false,
      }));

      const { error: answersError } = await supabase
        .from('user_answers')
        .insert(answersData);

      if (answersError) throw answersError;
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error saving test result:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save test result' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const testId = searchParams.get('testId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    let query = supabase
      .from('test_results')
      .select('*, tests(test_name)')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (testId) {
      query = query.eq('test_id', testId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ results: data });
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch results' },
      { status: 500 }
    );
  }
}
