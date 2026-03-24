export type DailyTrigger = {
  type: 'daily'
  hour: number
  minute: number
}

export type WeeklyTrigger = {
  type: 'weekly'
  weekday: number
  hour: number
  minute: number
}

export type MonthlyTrigger = {
  type: 'monthly'
  day: number
  hour: number
  minute: number
}

export type RepeatTrigger = DailyTrigger | WeeklyTrigger | MonthlyTrigger
