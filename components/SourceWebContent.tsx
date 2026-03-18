import { HTMLContent } from "@/components/HTMLContent";
import { SourceWeb } from "@/hooks/useSourceWebs";
import { slugify } from "@/utils/slugify";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";

const TABLE_OF_CONTENTS_DISABLED_IDS = [21, 22, 23];

interface SourceWebContentProps {
  sourceWeb: SourceWeb;
  className?: string;
  extraImages?: {
    image1?: string;
    image2?: string;
    image3?: string;
    image4?: string;
    image5?: string;
    image6?: string;
  };
  language?: string; 
}

export const SourceWebContent = ({ 
  sourceWeb, 
  className, 
  extraImages,
  language = 'ES' // Valor por defecto
}: SourceWebContentProps) => {
  const getExtraImageForSection = (sectionNumber: number): string | undefined => {
    if (!extraImages) return undefined;
    
    const imageKey = `image${sectionNumber}` as keyof typeof extraImages;
    const image = extraImages[imageKey];
    
    if (image && image.trim() !== '' && image !== 'false') {
      try {
        new URL(image);
        return image;
      } catch {
        return undefined;
      }
    }
    return undefined;
  };

  const getGalleryImages = () => {
    const images: string[] = [];
    
    if (!extraImages) return images;
    
    for (let i = 1; i <= 6; i++) {
      const imageKey = `image${i}` as keyof typeof extraImages;
      const image = extraImages[imageKey];
      if (image && image.trim() !== '') {
        images.push(image);
      }
    }
    
    return images;
  };

  const getSections = (sourceWeb: SourceWeb) => {
    const sections = [];
    for (let i = 1; i <= 6; i++) {
      const header = sourceWeb[`section_header_${i}` as keyof SourceWeb] as string;
      const text = sourceWeb[`section_text_${i}` as keyof SourceWeb] as string;
      const image = sourceWeb[`image_section_${i}` as keyof SourceWeb] as string;
      const video = sourceWeb[`link_video_section_${i}` as keyof SourceWeb] as string;
      const imageMetaTitle = sourceWeb[`metatitle_section_image_${i}` as keyof SourceWeb] as string;
      const imageMetaDescription = sourceWeb[`metadescription_section_image_${i}` as keyof SourceWeb] as string;
      
      const extraImage = getExtraImageForSection(i);
      
      if ((header && header !== 'false') || (text && text !== 'false') || (image && image !== 'false') || (video && video !== 'false') || extraImage) {
        sections.push({
          number: i,
          header: header && header !== 'false' ? header : `Sección ${i}`,
          text: text && text !== 'false' ? text : '',
          image: image && image !== 'false' ? image : '',
          extraImage: extraImage,
          video: video && video !== 'false' ? video : '',
          imageMetaTitle: imageMetaTitle && imageMetaTitle !== 'false' ? imageMetaTitle : '',
          imageMetaDescription: imageMetaDescription && imageMetaDescription !== 'false' ? imageMetaDescription : '',
          anchor: slugify((header && header !== 'false' ? header : `seccion-${i}`))
        });
      }
    }
    return sections;
  };

  const sections = getSections(sourceWeb);
  const sourceId = sourceWeb.id_odoo ?? sourceWeb.id ?? 0;
  const shouldShowTableOfContents = sections.length > 0 && !TABLE_OF_CONTENTS_DISABLED_IDS.includes(sourceId);
  const galleryImages = getGalleryImages();

  return (
    <div className={className}>
      {/* Initial content */}
      {sourceWeb.description && sourceWeb.description !== 'false' && (
        <HTMLContent 
          content={sourceWeb.description}
          className="mb-8"
        />
      )}
      
      {sourceWeb.subtitle_1 && sourceWeb.subtitle_1 !== 'false' && (
        <HTMLContent 
          content={`<h2>${sourceWeb.subtitle_1}</h2>`}
          className="mb-6"
        />
      )}

      {/* Table of contents */}
      {shouldShowTableOfContents && (
        <div className="mb-12 p-6 bg-muted/50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">
            {language === 'ES' ? 'Índice de contenidos' : 'Table of contents'}
          </h2>
          <ul className="space-y-2">
            {sections.map((section, index) => (
              <li key={section.number}>
                <a 
                  href={`#${section.anchor}`}
                  className="text-primary hover:text-primary/80 transition-colors duration-200 flex items-center"
                 title={"Jump to section"}>
                  <span className="mr-2 text-sm text-muted-foreground">
                    {index + 1}.
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: section.header }} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sections */}
      {sections.map((section) => (
        <section 
          key={section.number}
          id={section.anchor}
          className="mb-12 scroll-mt-20"
        >
          <HTMLContent
            content={`<a style="font-size: 40px;" class="font-bold text-foreground">${section.header}</a>`}
            className="mb-6"
          />
          
          {section.extraImage && (
            <div className="mb-6">
              <img 
                src={section.extraImage}
                alt={section.imageMetaDescription || section.imageMetaTitle || section.header}
                title={section.imageMetaTitle || section.header}
                className="w-full h-auto object-cover rounded-lg shadow-lg"
                loading="lazy"
                onError={(e) => {
                  console.error(`Image ${section.number} failed to load:`, section.extraImage);

                  if (section.image) {
                    e.currentTarget.src = section.image;
                  } else {
                    e.currentTarget.style.display = 'none';
                  }
                }}
              />
            </div>
          )}
          
          {section.image && !section.extraImage && section.text && section.text.includes('<table') && (
            <div className="mb-6">
              <img 
                src={section.image}
                alt={section.imageMetaDescription || section.imageMetaTitle || section.header}
                title={section.imageMetaTitle || section.header}
                className="w-full aspect-video object-cover rounded-lg shadow-lg"
                loading="lazy"
              />
            </div>
          )}
          
          <div className={section.image && !section.extraImage && !section.text?.includes('<table') ? "flex gap-6 items-start mb-6" : "mb-6"}>
            {section.text && (
              <div className={section.image && !section.extraImage && !section.text?.includes('<table') ? "flex-1" : ""}>
                <HTMLContent 
                  content={section.text}
                  variant="details"
                />
              </div>
            )}
            
            {section.image && !section.extraImage && !section.text?.includes('<table') && (
              <div className="w-1/3 flex-shrink-0">
                <img 
                  src={section.image}
                  alt={section.imageMetaDescription || section.imageMetaTitle || section.header}
                  title={section.imageMetaTitle || section.header}
                  className="w-full rounded-lg shadow-lg"
                  loading="lazy"
                />
              </div>
            )}
          </div>
          
          {section.video && (
            <YouTubeEmbed 
              url={section.video}
              title={section.header}
              className="mb-6"
            />
          )}
        </section>
      ))}

    </div>
  );
};