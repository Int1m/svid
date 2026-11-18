import scheduleJson from './karo-schedule.json'

export type MovieSession = {
  time: string
  price: string
  route: string
}

export type MovieFormat = {
  format: string
  sessions: MovieSession[]
}

export type Cinema = {
  cinema: string
  address: string
  formats: MovieFormat[]
}

export const karoSchedule = scheduleJson as Record<string, Cinema[]>

export const KARO_FILM_URL = 'https://karofilm.ru/film/16705'

export const VENUES = {
  billiards: {
    name: 'Омерзительная 8',
    address: 'Пятницкая ул., 82/34с1, Москва',
    hint: 'Вход через бар Питчер Паб · этаж −1',
  },
  dinner: {
    name: 'Rusty Rat & Pizza',
    address: 'Большой Черкасский пер., 13с4, Москва',
    hint: 'Кухня принимает заказы до 23:00',
  },
} as const

export const toLocalISODate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const formatFullDate = (value: string) => {
  if (!value) return ''
  const date = new Date(`${value}T12:00:00`)
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
}
