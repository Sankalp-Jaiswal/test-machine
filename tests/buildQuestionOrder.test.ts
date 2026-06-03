import { describe, it, expect } from 'vitest';
import { buildQuestionOrder } from '../store/orderUtils';

const makeBank = (n = 5) => ({
  id: 'b1',
  testName: 'T',
  duration: 30,
  createdAt: Date.now(),
  questions: Array.from({ length: n }).map((_, i) => ({
    id: i + 1,
    section: i % 2 === 0 ? 'A' : 'B',
    difficulty: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard',
    question: `q${i + 1}`,
    options: { A: 'a', B: 'b', C: 'c', D: 'd' },
    correctAnswer: 'A' as const,
    explanation: '',
  })),
});

describe('buildQuestionOrder', () => {
  it('returns earliest (original) order when shuffle disabled and earliest mode', () => {
    const bank = makeBank(5);
    const order = buildQuestionOrder(bank as any, [], [], [], false, 'earliest');
    expect(order).toEqual([1, 2, 3, 4, 5]);
  });

  it('returns latest (reversed) order when shuffle disabled and latest mode', () => {
    const bank = makeBank(5);
    const order = buildQuestionOrder(bank as any, [], [], [], false, 'latest');
    expect(order).toEqual([5, 4, 3, 2, 1]);
  });

  it('returns filtered ids when sections/difficulties applied', () => {
    const bank = makeBank(6);
    // select only section A
    const order = buildQuestionOrder(bank as any, ['A'], [], [], false, 'earliest');
    const expected = bank.questions.filter((q: any) => q.section === 'A').map((q: any) => q.id);
    expect(order).toEqual(expected);
  });

  it('random mode returns same set but possibly different order', () => {
    const bank = makeBank(10);
    const order = buildQuestionOrder(bank as any, [], [], [], true, 'random');
    expect(order.sort((a: number, b: number) => a - b)).toEqual(bank.questions.map((q: any) => q.id));
    expect(order.length).toBe(bank.questions.length);
  });
});
