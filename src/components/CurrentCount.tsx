import { getCounterById } from '@/libs/DB';
import { getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';

export const CurrentCount = async () => {
  const t = await getTranslations('CurrentCount');

  // `x-e2e-random-id` is used for end-to-end testing to make isolated requests
  // The default value is 0 when there is no `x-e2e-random-id` header
  const id = Number((await headers()).get('x-e2e-random-id')) ?? 0;
  const count = await getCounterById(id);

  return (
    <div>
      {t('count', { count })}
    </div>
  );
};
