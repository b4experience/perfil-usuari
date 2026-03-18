
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import type { Course } from "@/types/course"
import { useT } from "@/i18n/useT"
import { useLanguage } from "@/context/LanguageContext"
import type { Language } from "@/context/LanguageContext"

const TYPE_LABELS: Record<string, Record<Language, string>> = {
    senderismo: { ES: "Senderismo", EN: "Hiking", FR: "Randonnee" },
    alpinismo: { ES: "Alpinismo", EN: "Mountaineering", FR: "Alpinisme" },
    "trail running": { ES: "Trail Running", EN: "Trail Running", FR: "Trail running" },
}

const getTypeLabel = (type: string | null | undefined, lang: Language): string => {
    if (!type) return ""
    const normalized = type.trim().toLowerCase()
    const label = TYPE_LABELS[normalized]
    if (!label) return type
    return label[lang] ?? type
}

const formatPrice = (price: string | null | undefined, lang: Language): string => {
    if (!price) return ""
    if (lang !== "FR") return price
    return price
        .replace(/\bGRATIS\b/gi, "GRATUIT")
        .replace(/\bo\b/g, "ou")
        .replace(/\/mes\b/gi, "/mois")
}

interface CourseCardProps {
    course: Course
    aspectRatio?: string
}

export function CourseCard({ course, aspectRatio = '1/1' }: CourseCardProps) {
    const { t } = useT()
    const { language } = useLanguage()
    const currentLanguage: Language = language ?? 'EN'
    const fallbackLanguage: Language = currentLanguage === 'FR' ? 'EN' : currentLanguage
    const localized =
        course.translations?.[currentLanguage] ??
        course.translations?.[fallbackLanguage]
    
    // <-- CAMBIADO: Ahora obtenemos el título, tipo y link de las traducciones
    const displayTitle = localized?.title?.trim() ? localized.title : course.title
    const displayType = localized?.type?.trim()
        ? localized.type
        : getTypeLabel(course.type, currentLanguage)
    // <-- NUEVO: El link ahora viene de las traducciones
    const courseLink = localized?.link || course.link
    
    const imageSrc =
        course.thumbnails?.[currentLanguage] ??
        (currentLanguage === 'FR' ? course.thumbnails?.EN : undefined) ??
        course.thumbnail ??
        "/placeholder.svg"
    const displayPrice = formatPrice(course.price, currentLanguage)

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="group"
        >
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden rounded-2xl relative focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 bg-white border border-gray-200">
                <a
                    href={courseLink} // <-- CAMBIADO: Usamos courseLink en lugar de course.link
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="block focus:outline-none"
                    aria-label={`${displayTitle} - external link`}
                    title={displayTitle}
                >
                    <div className="relative overflow-hidden" style={{ aspectRatio }}>
                        {course.is_online && (
                            <div
                                className="absolute top-2 left-2 bg-black text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10"
                                role="status"
                                aria-label={t("courses.online.title")}
                            >
                                {t("courses.online.title")}
                            </div>
                        )}

                        <img
                            src={imageSrc}
                            alt={displayTitle}
                            title={displayTitle}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                    </div>

                    <CardContent className="p-4 space-y-2">
                        <h3 className="font-semibold text-card-foreground line-clamp-2 text-sm leading-tight">
                            {displayTitle}
                        </h3>

                        <div className="text-xs text-muted-foreground min-h-4 flex items-center">
                            {displayType}
                        </div>

                        <div className="flex items-center gap-1">
                            <span className={`text-lg font-bold ${/(free|gratis|gratuit)/i.test(displayPrice || '') ? 'text-green-600' : 'text-primary'}`}>
                                {displayPrice}
                            </span>
                            {course.duration && (
                                <>
                                    <span className="text-muted-foreground" aria-hidden="true">|</span>
                                    <span className="text-muted-foreground text-sm">{course.duration}</span>
                                </>
                            )}
                        </div>
                    </CardContent>
                </a>
            </Card>
        </motion.div>
    )
}

export default CourseCard
