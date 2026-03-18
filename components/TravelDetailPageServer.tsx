import { notFound } from "next/navigation";
import TravelDetailPageClient from "@/components/TravelDetailPageClient";
import { fetchTravelDetail } from "@/services/travelDetailService";
import type { Language } from "@/context/LanguageContext";
import { buildTravelStructuredData } from "@/lib/structuredData";

interface TravelDetailPageProps {
  slug?: string;
  language?: Language;
}

const TravelDetailPage = async ({ slug, language = "EN" }: TravelDetailPageProps) => {
  try {
    const travel = await fetchTravelDetail({ slug, language });
    if (!travel) {
      return notFound();
    }
    const travelSchemas = buildTravelStructuredData({
      language,
      slug: slug || "",
      title: travel.title,
      description: travel.details?.descript_250 || travel.metadescription || travel.description,
      image: travel.imgUrl || travel.additionalImages?.[0],
      price: typeof travel.price === "number" ? travel.price : null,
    });
    return (
      <>
        {travelSchemas.map((schema, index) => (
          <script
            key={`travel-schema-${index}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
        <TravelDetailPageClient travel={travel} slug={slug} />
      </>
    );
  } catch (error) {
    console.error("Error loading travel detail:", error);
    notFound();
  }
};

export default TravelDetailPage;
