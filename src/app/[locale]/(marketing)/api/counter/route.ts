import { incrementCounter } from '@/libs/DB';
import { CounterValidation } from '@/validations/CounterValidation';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export const PUT = async (request: Request) => {
  const json = await request.json();
  const parse = CounterValidation.safeParse(json);

  if (!parse.success) {
    return NextResponse.json(parse.error.format(), { status: 422 });
  }

  // `x-e2e-random-id` is used for end-to-end testing to make isolated requests
  // The default value is 0 when there is no `x-e2e-random-id` header
  const id = Number((await headers()).get('x-e2e-random-id')) ?? 0;

  const count = await incrementCounter(id, parse.data.increment);

  return NextResponse.json({
    count,
  });
};
