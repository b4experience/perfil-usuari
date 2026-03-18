import { useLanguage } from '@/context/LanguageContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useT } from '@/i18n/useT'
import { useRouteTranslator } from '@/hooks/useRouteTranslator'

export const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage()
  const { t } = useT()
  const navigate = useNavigate()
  const location = useLocation()
  const { translatePath } = useRouteTranslator()

  const switchLanguage = (newLang: 'ES' | 'EN' | 'FR') => {
    if (newLang === language) return
    setLanguage(newLang)
    const translatedPath = translatePath(location.pathname || '/', newLang)
    navigate(translatedPath, { replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="flex items-center gap-1.5">
            <img 
              src={
                language === 'EN'
                  ? 'https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/lang/gb.svg'
                  : language === 'FR'
                    ? 'https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/lang/fr.svg'
                    : 'https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/lang/es.svg'
              }
              alt={language}
              className="h-4 w-4"
            />
            {language}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem 
          onClick={() => switchLanguage('FR')}
          className={`cursor-pointer ${language === 'FR' ? 'bg-muted' : ''}`}
        >
          <img 
            src="https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/lang/fr.svg" 
            alt="FR"
            className="h-4 w-4 mr-2"
          />
          {t("lang.french")}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => switchLanguage('ES')}
          className={`cursor-pointer ${language === 'ES' ? 'bg-muted' : ''}`}
        >
          <img 
            src="https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/lang/es.svg" 
            alt="ES"
            className="h-4 w-4 mr-2"
          />
          {t("lang.spanish")}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => switchLanguage('EN')}
          className={`cursor-pointer ${language === 'EN' ? 'bg-muted' : ''}`}
        >
          <img 
            src="https://aqfvdnnmeywvzivkvlhi.supabase.co/storage/v1/object/public/lang/gb.svg" 
            alt="EN"
            className="h-4 w-4 mr-2"
          />
          {t("lang.english")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
