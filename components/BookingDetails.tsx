import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/utils/price'
import { Calendar, Users, Star } from 'lucide-react'

interface BookingDate {
  id: number | string
  date: Date
  endDate?: Date | null
  price: number
  available_spots: number
  is_open_group: boolean
  is_private_group?: boolean
  name_event?: string
  categoria?: string
  places_total: number
  places_taken: number
  sold_out: boolean
  min_pers?: number
}

interface PrivateGroup {
  id: string
  price: number
  min_pers: number
  etiquetas: string
}

interface BookingDetailsProps {
  selectedBookingDate?: BookingDate
  peopleCount: number
  privateGroups: PrivateGroup[]
  travel: {
    name?: string
    price?: number
  }
}

export const BookingDetails = ({
  selectedBookingDate,
  peopleCount,
  privateGroups,
  travel
}: BookingDetailsProps) => {
  const availablePrivateGroup = privateGroups.find(group => (group.min_pers || 2) === peopleCount)

  // If a date is selected, show selected date details
  if (selectedBookingDate) {
    const totalPrice = selectedBookingDate.price * peopleCount

    return (
      <div className="space-y-4">
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              {selectedBookingDate.name_event}
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {selectedBookingDate.date.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {peopleCount} {peopleCount === 1 ? 'persona' : 'personas'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <Badge variant={selectedBookingDate.is_open_group ? 'default' : 'secondary'} 
                     className={selectedBookingDate.is_open_group ? '' : 'bg-green-600 text-white border-green-700'}>
                {selectedBookingDate.is_open_group ? 'Grupo Abierto' : 'Grupo Privado'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {selectedBookingDate.available_spots} plazas restantes
              </span>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Precio por persona:</span>
            <span className="font-medium">{formatPrice(selectedBookingDate.price)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Número de personas:</span>
            <span className="font-medium">{peopleCount}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center font-bold text-lg">
            <span>Total:</span>
            <span className="text-primary">{formatPrice(totalPrice)}</span>
          </div>
        </div>
      </div>
    )
  }

  // If there's an available private group
  if (availablePrivateGroup) {
    const totalPrice = availablePrivateGroup.price * peopleCount
    const mockDate = new Date()
    mockDate.setDate(mockDate.getDate() + 30)

    return (
      <div className="space-y-4">
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-green-700" />
            <span className="text-sm font-semibold text-green-700">
              Grupo Privado
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                Fecha flexible (aprox. {mockDate.toLocaleDateString('es-ES', {
                  month: 'long',
                  day: 'numeric'
                })})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                {peopleCount} {peopleCount === 1 ? 'persona' : 'personas'}
              </span>
            </div>

            <Badge variant="secondary" className="bg-green-600 text-white border-green-700">
              Grupo Privado
            </Badge>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Precio por persona:</span>
            <span className="font-medium">{formatPrice(availablePrivateGroup.price)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Número de personas:</span>
            <span className="font-medium">{peopleCount}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center font-bold text-lg">
            <span>Total:</span>
            <span className="text-green-700">{formatPrice(totalPrice)}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center text-muted-foreground">
      <p>Selecciona una fecha o configura un grupo privado para ver los detalles</p>
    </div>
  )
}