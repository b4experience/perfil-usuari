import { notFound } from "next/navigation";

import ActivityDetailPageClient from "@/components/ActivityDetailPageClient";
import type { Language } from "@/context/LanguageContext";
import { fetchActivityBySlug } from "@/services/activityDetailService";
import {
  DEFAULT_FILTERS,
  fetchActivities,
  fetchCountries,
  fetchTravelsPage,
} from "@/services/travelService";
import { buildActivityBreadcrumbStructuredData } from "@/lib/structuredData";

interface ActivityDetailPageServerProps {
  slug: string;
  language: Language;
}

const ActivityDetailPageServer = async ({
  slug,
  language,
}: ActivityDetailPageServerProps) => {
  const initialActivity = await fetchActivityBySlug({ slug, language }).catch(
    () => null,
  );
  if (!initialActivity) {
    notFound();
  }

  const [travelsResult, countriesResult, activitiesResult] =
    await Promise.allSettled([
      fetchTravelsPage({
        searchQuery: "",
        filters: DEFAULT_FILTERS,
        pageParam: 0,
        language,
      }),
      fetchCountries(language),
      fetchActivities(language),
    ]);

  const initialTravels =
    travelsResult.status === "fulfilled"
      ? travelsResult.value
      : { travels: [], hasMore: false };
  const initialCountries =
    countriesResult.status === "fulfilled" ? countriesResult.value : [];
  const initialActivities =
    activitiesResult.status === "fulfilled" ? activitiesResult.value : [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildActivityBreadcrumbStructuredData({
              language,
              slug,
              name: initialActivity.name,
            }),
          ),
        }}
      />
      <ActivityDetailPageClient
        slug={slug}
        language={language}
        initialActivity={initialActivity}
        initialTravels={initialTravels}
        initialCountries={initialCountries}
        initialActivities={initialActivities}
      />
    </>
  );
};

export default ActivityDetailPageServer;
