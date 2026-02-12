import CampaignDetails from '@/components/compaigns/CampaignDetails';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import React from 'react';

type CampaignPageProps = {
  params: Promise<{ locale: string; name: string }>;
};

export async function generateMetadata({ params }: CampaignPageProps) {
  const { locale, name } = await params;
  const decodedName = decodeURIComponent(name);
  const t = await getTranslations({
    locale,
    namespace: 'Campaigns',
  });

  return {
    title: `${decodedName} - ${t('meta_title')}`,
    description: `Campaign details for ${decodedName}`,
  };
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const { locale, name } = await params;
  setRequestLocale(locale);
  const decodedName = decodeURIComponent(name);

  return <CampaignDetails campaignName={decodedName} />;
}
