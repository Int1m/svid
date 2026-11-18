import { useEffect, useMemo, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clapperboard,
  Clock3,
  Copy,
  CircleDot,
  ExternalLink,
  Heart,
  Infinity as InfinityIcon,
  MapPin,
  MoonStar,
  Send,
  Sparkles,
  Utensils,
  type LucideIcon,
} from 'lucide-react'
import { OWNER_EMAIL } from './config'
import {
  formatFullDate,
  karoSchedule,
  KARO_FILM_URL,
  toLocalISODate,
  VENUES,
  type MovieSession,
} from './data'
import './App.css'

type Step = 'welcome' | 'date' | 'activities' | 'cinema' | 'billiards' | 'dinner' | 'everything' | 'final' | 'celebration'
type Activity = 'cinema' | 'billiards' | 'dinner' | 'everything'
type SelectedSession = MovieSession & { format: string }

const ACTIVITIES: { id: Activity; title: string; subtitle: string; icon: LucideIcon }[] = [
  { id: 'cinema', title: 'Кино', subtitle: '«Сумерки. Сага. Затмение»', icon: Clapperboard },
  { id: 'billiards', title: 'Бильярд', subtitle: 'Киноатмосфера и два стола без посторонних', icon: CircleDot },
  { id: 'dinner', title: 'Ужин', subtitle: 'Rusty Rat & Pizza, разговоры и десерт', icon: Utensils },
  { id: 'everything', title: 'Всё, везде и сразу', subtitle: 'Максимальный сюжетный поворот', icon: InfinityIcon },
]

const NO_MESSAGES = [
  'Кажется, кнопка немного стесняется.',
  'Она просто очень быстрая. Попробуй ещё раз.',
  'Почти получилось. Но «Да» всё ещё ждёт.',
  'Ладно, эта кнопка официально ушла в закат.',
]

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    textarea.remove()
  }
}

function TimePicker({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  return (
    <div className="time-picker">
      <span className="field-label">Во сколько мне ждать тебя?</span>
      <div className="time-options">
        {options.map((option) => (
          <button
            className={`time-chip ${value === option ? 'selected' : ''}`}
            type="button"
            key={option}
            onClick={() => onChange(option)}
            aria-pressed={value === option}
          >
            {option}
          </button>
        ))}
      </div>
      <label className="custom-time">
        <Clock3 size={18} aria-hidden="true" />
        <span>Или своё время</span>
        <input type="time" value={value} onChange={(event) => onChange(event.target.value)} step={900} />
      </label>
    </div>
  )
}

function VenueTimeScreen({
  type,
  date,
  time,
  onTimeChange,
  onBack,
  onConfirm,
}: {
  type: 'billiards' | 'dinner'
  date: string
  time: string
  onTimeChange: (value: string) => void
  onBack: () => void
  onConfirm: () => void
}) {
  const venue = VENUES[type]
  const isDinner = type === 'dinner'
  return (
    <section className={`screen venue-screen ${isDinner ? 'dinner-screen' : 'billiards-screen'}`}>
      <button className="back-button" type="button" onClick={onBack}>
        <ArrowLeft size={18} /> Все варианты
      </button>
      <div className={`venue-card ${isDinner ? 'rusty-card' : 'velvet-card'}`}>
        <div className="venue-visual">
          <img src={`./images/${isDinner ? 'rusty-rat.jpg' : 'billiards.webp'}`} alt={isDinner ? 'Интерьер Rusty Rat & Pizza' : 'Атмосфера бильярдной «Омерзительная 8»'} />
          <div className="venue-visual-caption">
            <span>{isDinner ? 'Rusty Rat & Pizza' : 'Бильярдная · киноатмосфера'}</span>
            <span>Москва</span>
          </div>
        </div>
        <div className="venue-content">
          <div>
            <span className="venue-kicker">{isDinner ? 'Ужин на двоих' : 'Омерзительная 8'}</span>
            <h1>{isDinner ? 'Добавим к свиданию немного перчинки?' : 'Сыграем в красивое кино?'}</h1>
            <p className="venue-description">
              {isDinner
                ? 'Без меню и сложных решений. Просто выбери время — остальное оставь на вечер.'
                : 'Красные кресла, бархатные шторы и игра, в которой победитель получает право выбрать следующий фильм.'}
            </p>
            <div className="venue-address">
              <MapPin size={19} aria-hidden="true" />
              <div>
                <strong>{venue.address}</strong>
                <span>{venue.hint}</span>
              </div>
            </div>
          </div>
          <div className="venue-booking">
            <div className="chosen-date"><span>Наша дата</span><strong>{formatFullDate(date)}</strong></div>
            <TimePicker value={time} onChange={onTimeChange} options={isDinner ? ['18:00', '19:00', '20:00', '21:00', '22:00'] : ['17:00', '18:00', '19:00', '20:00', '21:00', '22:00']} />
            <button className="primary-button venue-confirm" type="button" disabled={!time} onClick={onConfirm}>
              {isDinner ? 'Забронировать этот вечер' : 'Это время мне подходит'}
              <ArrowRight size={19} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function CelebrationScreen({ onRestart }: { onRestart: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const fire = confetti.create(canvas, { resize: true, useWorker: true })
    const colors = ['#ee6a7d', '#f4a6b1', '#edc98f', '#f7eee8']
    let burst = 0

    const launch = () => {
      const fromLeft = burst % 2 === 0
      void fire({
        particleCount: 28,
        angle: fromLeft ? 60 : 120,
        spread: 72,
        startVelocity: 34,
        origin: { x: fromLeft ? 0.12 : 0.88, y: 0.7 },
        colors,
        scalar: 0.72,
        ticks: 170,
        gravity: 0.85,
        drift: fromLeft ? 0.35 : -0.35,
        disableForReducedMotion: true,
      })
      if (burst % 3 === 0) {
        void fire({
          particleCount: 20,
          angle: 90,
          spread: 110,
          startVelocity: 28,
          origin: { x: 0.5, y: 0.58 },
          colors,
          scalar: 0.6,
          ticks: 150,
          disableForReducedMotion: true,
        })
      }
      burst += 1
    }

    launch()
    const interval = window.setInterval(launch, 520)
    const stop = window.setTimeout(() => window.clearInterval(interval), 3600)
    return () => {
      window.clearInterval(interval)
      window.clearTimeout(stop)
      fire.reset()
    }
  }, [])

  return (
    <section className="screen celebration-screen">
      <canvas className="celebration-canvas" ref={canvasRef} aria-hidden="true" />
      <div className="celebration-content">
        <span className="celebration-icon"><Heart size={32} fill="currentColor" strokeWidth={1.4} /></span>
        <span className="eyebrow"><Sparkles size={16} /> Выбор отправлен</span>
        <h1>Ура!</h1>
        <p>Наш план официально принят.<br />До скорого — я уже предвкушаю.</p>
        <button className="primary-button" type="button" onClick={onRestart}>
          Вернуться в начало <ArrowRight size={19} />
        </button>
      </div>
    </section>
  )
}

export default function App() {
  const [step, setStep] = useState<Step>(() => new URLSearchParams(window.location.search).get('sent') === '1' ? 'celebration' : 'welcome')
  const [date, setDate] = useState('')
  const [activity, setActivity] = useState<Activity | null>(null)
  const [cinemaName, setCinemaName] = useState('')
  const [selectedSession, setSelectedSession] = useState<SelectedSession | null>(null)
  const [time, setTime] = useState('')
  const [noAttempts, setNoAttempts] = useState(0)
  const [noPosition, setNoPosition] = useState<{ x: number; y: number } | null>(null)
  const [copied, setCopied] = useState(false)
  const noButtonRef = useRef<HTMLButtonElement>(null)

  const quickDates = useMemo(() => {
    const start = new Date()
    start.setHours(12, 0, 0, 0)
    return Array.from({ length: 7 }, (_, index) => {
      const value = new Date(start)
      value.setDate(start.getDate() + index)
      return value
    })
  }, [])

  const minDate = quickDates[0] ? toLocalISODate(quickDates[0]) : ''
  const maxDate = useMemo(() => {
    const value = new Date()
    value.setDate(value.getDate() + 60)
    return toLocalISODate(value)
  }, [])

  const successUrl = useMemo(() => {
    const url = new URL(window.location.href)
    url.search = ''
    url.hash = ''
    url.searchParams.set('sent', '1')
    return url.toString()
  }, [])

  const cinemas = karoSchedule[date] ?? []
  const currentCinema = cinemas.find((cinema) => cinema.cinema === cinemaName)

  const activityTitle = ACTIVITIES.find((item) => item.id === activity)?.title ?? ''
  const venue = activity === 'billiards' || activity === 'dinner' ? VENUES[activity] : null

  const summaryText = useMemo(() => {
    if (!activity) return ''
    const lines = ['У меня для тебя хорошая новость: она сказала «Да»!', '', `Дата: ${formatFullDate(date)}`, `Выбор: ${activityTitle}`]
    if (activity === 'cinema' && currentCinema && selectedSession) {
      lines.push('Фильм: Сумерки. Сага. Затмение', `Кинотеатр: КАРО ${currentCinema.cinema}`, `Адрес: ${currentCinema.address}`, `Сеанс: ${selectedSession.time} · ${selectedSession.format}`, `Билеты: ${KARO_FILM_URL}`)
    } else if (venue) {
      lines.push(`Место: ${venue.name}`, `Адрес: ${venue.address}`, `Время: ${time}`)
    }
    return lines.join('\n')
  }, [activity, activityTitle, currentCinema, date, selectedSession, time, venue])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  useEffect(() => {
    if (step !== 'final' || !summaryText) return
    try {
      localStorage.setItem('date-invitation-choice', summaryText)
    } catch {
      // Выбор всё равно можно отправить письмом, даже если хранилище недоступно.
    }
  }, [step, summaryText])

  const chooseDate = (value: string) => {
    if (!value) return
    setDate(value)
    setActivity(null)
    setCinemaName('')
    setSelectedSession(null)
    setTime('')
    setStep('activities')
  }

  const chooseActivity = (value: Activity) => {
    setActivity(value)
    setTime('')
    setCopied(false)
    setStep(value)
  }

  const moveNoButton = () => {
    const button = noButtonRef.current
    const width = button?.offsetWidth ?? 120
    const height = button?.offsetHeight ?? 56
    const padding = 18
    const topSafeArea = 82
    const maxX = Math.max(padding, window.innerWidth - width - padding)
    const maxY = Math.max(topSafeArea, window.innerHeight - height - padding)
    const x = padding + Math.random() * Math.max(0, maxX - padding)
    const y = topSafeArea + Math.random() * Math.max(0, maxY - topSafeArea)
    setNoPosition({ x, y })
    setNoAttempts((count) => count + 1)
  }

  const openEmail = () => {
    const subject = encodeURIComponent('Я выбрала наше свидание')
    window.location.href = `mailto:${OWNER_EMAIL}?subject=${subject}&body=${encodeURIComponent(summaryText)}`
  }

  const handleCopy = async () => {
    await copyText(summaryText)
    setCopied(true)
  }

  const showFinal = () => {
    setCopied(false)
    setStep('final')
  }

  const restart = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('sent')
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
    setStep('welcome')
  }

  const stepLabel = step === 'welcome' ? 'один маленький вопрос' : step === 'final' || step === 'celebration' ? 'скоро увидимся' : 'планируем наш вечер'

  return (
    <main className="site-shell">
      <header className="topbar">
        <div className="brand"><Heart size={15} fill="currentColor" aria-hidden="true" /> для тебя</div>
        <span>{stepLabel}</span>
      </header>

      {step === 'welcome' && (
        <section className="screen welcome-screen">
          <div className="welcome-copy">
            <span className="eyebrow"><Sparkles size={16} /> Есть одна идея для нас</span>
            <h1>Пойдём со мной<br />на <em>свидание?</em></h1>
            <p>Обещаю хороший вечер, красивое место и минимум неловких пауз. Максимум — только если это будет мило.</p>
            <div className="welcome-actions">
              <button className="primary-button yes-button" type="button" onClick={() => setStep('date')}>
                Да, пойдём <ArrowRight size={20} />
              </button>
              <button
                ref={noButtonRef}
                className={`secondary-button no-button ${noPosition ? 'is-running' : ''}`}
                type="button"
                style={noPosition ? { left: noPosition.x, top: noPosition.y } : undefined}
                onPointerEnter={(event) => { if (event.pointerType === 'mouse') moveNoButton() }}
                onClick={moveNoButton}
              >
                Нет
              </button>
            </div>
            <div className="no-message" aria-live="polite">
              {noAttempts > 0 ? NO_MESSAGES[Math.min(noAttempts - 1, NO_MESSAGES.length - 1)] : 'Выбирай сердцем. Но лучше — «Да».'}
            </div>
          </div>
          <div className="eclipse-art" aria-hidden="true">
            <div className="orbit orbit-one"><span /></div>
            <div className="orbit orbit-two"><span /></div>
            <div className="eclipse-moon"><MoonStar size={34} /></div>
            <div className="art-note"><span>один вечер</span><strong>только мы</strong></div>
            <Sparkles className="art-spark" size={38} strokeWidth={1.2} />
          </div>
        </section>
      )}

      {step === 'date' && (
        <section className="screen date-screen">
          <button className="back-button" type="button" onClick={() => setStep('welcome')}><ArrowLeft size={18} /> К вопросу</button>
          <div className="section-heading">
            <span className="eyebrow">Отлично. Первый шаг сделан</span>
            <h1>Когда мне<br /><em>ждать тебя?</em></h1>
            <p>Выбери день, который нравится. Дальше будет только проще.</p>
          </div>
          <div className="date-grid">
            {quickDates.map((day) => {
              const value = toLocalISODate(day)
              const weekday = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(day).replace('.', '')
              const month = new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(day).replace('.', '')
              return (
                <button className="date-card" type="button" key={value} onClick={() => chooseDate(value)}>
                  <span>{weekday}</span>
                  <strong>{day.getDate()}</strong>
                  <small>{month}</small>
                  <ArrowUpRight size={18} />
                </button>
              )
            })}
          </div>
          <label className="other-date">
            <span>Нужен другой день?</span>
            <input type="date" min={minDate} max={maxDate} value={date} onChange={(event) => chooseDate(event.target.value)} />
          </label>
        </section>
      )}

      {step === 'activities' && (
        <section className="screen activities-screen">
          <button className="back-button" type="button" onClick={() => setStep('date')}><ArrowLeft size={18} /> Изменить дату</button>
          <div className="activities-intro">
            <span className="eyebrow">{formatFullDate(date)}</span>
            <h1>Что выберешь<br />для <em>нашего вечера?</em></h1>
            <p>Можно романтику, можно азарт. Можно вообще всё.</p>
          </div>
          <div className="activity-list">
            {ACTIVITIES.map(({ id, title, subtitle, icon: Icon }) => (
              <button className={`activity-row activity-${id}`} type="button" key={id} onClick={() => chooseActivity(id)}>
                <span className="activity-icon"><Icon size={26} strokeWidth={1.6} /></span>
                <span className="activity-text"><strong>{title}</strong><small>{subtitle}</small></span>
                <span className="activity-arrow"><ArrowUpRight size={24} /></span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 'cinema' && (
        <section className="screen cinema-screen">
          <button className="back-button" type="button" onClick={() => setStep('activities')}><ArrowLeft size={18} /> Все варианты</button>
          <div className="cinema-layout">
            <div className="movie-poster">
              <img src="./images/twilight-eclipse.jpg" alt="Постер фильма «Сумерки. Сага. Затмение»" />
              <div className="poster-meta"><span>18+</span><span>2 ч 4 мин</span><span>2010</span></div>
            </div>
            <div className="cinema-content">
              <span className="eyebrow">Наш сеанс в КАРО</span>
              <h1>Сумерки. Сага.<br /><em>Затмение</em></h1>
              <p className="cinema-lead">Немного вампиров, немного драмы и один повод сидеть чуть ближе.</p>
              <div className="chosen-date"><span>Наша дата</span><strong>{formatFullDate(date)}</strong></div>

              {cinemas.length > 0 ? (
                <>
                  <label className="select-field">
                    <span className="field-label">Выбери кинотеатр</span>
                    <select value={cinemaName} onChange={(event) => { setCinemaName(event.target.value); setSelectedSession(null) }}>
                      <option value="">Кинотеатр КАРО</option>
                      {cinemas.map((cinema) => <option value={cinema.cinema} key={cinema.cinema}>{cinema.cinema}</option>)}
                    </select>
                  </label>
                  {currentCinema && (
                    <div className="cinema-address"><MapPin size={17} /><span>{currentCinema.address}</span></div>
                  )}
                  {currentCinema && (
                    <div className="sessions-area">
                      <span className="field-label">Теперь выбери сеанс</span>
                      {currentCinema.formats.map((format) => (
                        <div className="session-format" key={format.format}>
                          <span>{format.format}</span>
                          <div className="session-buttons">
                            {format.sessions.map((session) => (
                              <button
                                className={`session-button ${selectedSession?.route === session.route ? 'selected' : ''}`}
                                type="button"
                                key={session.route}
                                onClick={() => setSelectedSession({ ...session, format: format.format })}
                                aria-pressed={selectedSession?.route === session.route}
                              >
                                <strong>{session.time}</strong><small>{session.price}</small>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-schedule">
                  <MoonStar size={28} />
                  <h2>На этот день расписание ещё не сохранено</h2>
                  <p>Проверь актуальные сеансы на сайте КАРО или вернись и выбери другую дату.</p>
                </div>
              )}
              <div className="cinema-actions">
                <button className="primary-button" type="button" disabled={!currentCinema || !selectedSession} onClick={showFinal}>
                  Этот сеанс нам подходит <ArrowRight size={19} />
                </button>
                <a className="source-link" href={KARO_FILM_URL} target="_blank" rel="noreferrer">Актуальное расписание КАРО <ExternalLink size={15} /></a>
              </div>
              <small className="schedule-note">Сеансы сохранены с официального сайта КАРО 19 ноября 2026. Перед покупкой проверь расписание по ссылке.</small>
            </div>
          </div>
        </section>
      )}

      {(step === 'billiards' || step === 'dinner') && (
        <VenueTimeScreen
          type={step}
          date={date}
          time={time}
          onTimeChange={setTime}
          onBack={() => setStep('activities')}
          onConfirm={showFinal}
        />
      )}

      {step === 'everything' && (
        <section className="screen everything-screen">
          <button className="back-button" type="button" onClick={() => setStep('activities')}><ArrowLeft size={18} /> Все варианты</button>
          <div className="everything-star"><InfinityIcon size={72} strokeWidth={1} /></div>
          <span className="eyebrow">Масштаб впечатляет</span>
          <h1>Всё. Везде.<br /><em>И сразу.</em></h1>
          <p>За согласованием обращайся в личные сообщения.<br />И да, мне очень нравится твой настрой.</p>
          <div className="everything-actions">
            <button className="primary-button" type="button" onClick={() => { void copyText('Я выбираю всё, везде и сразу. Давай согласуем в личных сообщениях!'); setCopied(true) }}>
              {copied ? <Check size={19} /> : <Copy size={19} />}{copied ? 'Текст скопирован' : 'Скопировать ответ'}
            </button>
            <button className="text-button" type="button" onClick={() => setStep('activities')}>Выбрать один вариант</button>
          </div>
        </section>
      )}

      {step === 'final' && (
        <section className={`screen final-screen final-${activity}`}>
          <div className="final-ticket">
            <div className="final-main">
              <div className="success-mark"><Check size={30} strokeWidth={1.8} /></div>
              <span className="eyebrow">Ответ принят</span>
              <h1>Это свидание.<br /><em>Официально.</em></h1>
              <p className="final-lead">Я буду ждать. Очень.</p>
              <div className="final-details">
                <div><CalendarIcon /><span><small>Дата</small><strong>{formatFullDate(date)}</strong></span></div>
                <div><Sparkles size={20} /><span><small>План</small><strong>{activityTitle}</strong></span></div>
                {activity === 'cinema' && currentCinema && selectedSession ? (
                  <>
                    <div><Clapperboard size={20} /><span><small>Фильм и сеанс</small><strong>Сумерки. Сага. Затмение · {selectedSession.time}</strong><em>{selectedSession.format} · {selectedSession.price}</em></span></div>
                    <div><MapPin size={20} /><span><small>Место</small><strong>КАРО {currentCinema.cinema}</strong><em>{currentCinema.address}</em></span></div>
                  </>
                ) : venue ? (
                  <>
                    <div><Clock3 size={20} /><span><small>Время</small><strong>{time}</strong></span></div>
                    <div><MapPin size={20} /><span><small>Место</small><strong>{venue.name}</strong><em>{venue.address}</em></span></div>
                  </>
                ) : null}
              </div>
              {activity === 'cinema' && selectedSession && (
                <a className="ticket-link" href={`https://karofilm.ru${selectedSession.route}`} target="_blank" rel="noreferrer">Купить билеты на сайте КАРО <ArrowUpRight size={18} /></a>
              )}
            </div>
            <div className="ticket-stub">
              <Heart size={30} fill="currentColor" strokeWidth={1.2} />
              <span>наше<br />свидание</span>
              <strong>{date ? new Date(`${date}T12:00:00`).getDate() : ''}</strong>
              <small>{date ? new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(new Date(`${date}T12:00:00`)) : ''}</small>
            </div>
          </div>

          {OWNER_EMAIL ? (
            <form
              className="notification-panel"
              method="POST"
              action={`https://formsubmit.co/${OWNER_EMAIL}`}
            >
              <input type="hidden" name="_subject" value="Она выбрала свидание!" />
              <input type="hidden" name="message" value={summaryText} />
              <input type="hidden" name="_template" value="box" />
              <input type="hidden" name="_captcha" value="false" />
              <input type="hidden" name="_next" value={successUrl} />
              <span>Отправь мне наш план, чтобы я всё записал.</span>
              <button className="primary-button" type="submit">
                <Send size={18} /> Отправить выбор
              </button>
              <button className="copy-button" type="button" onClick={() => void handleCopy()}>
                {copied ? <Check size={17} /> : <Copy size={17} />}
                {copied ? 'Детали скопированы' : 'Скопировать детали'}
              </button>
            </form>
          ) : (
            <div className="notification-panel">
              <span>Осталось отправить мне выбор — откроется готовое письмо.</span>
              <button className="primary-button" type="button" onClick={openEmail}>
                <Send size={18} /> Отправить выбор
              </button>
              <button className="copy-button" type="button" onClick={() => void handleCopy()}>
                {copied ? <Check size={17} /> : <Copy size={17} />}
                {copied ? 'Детали скопированы' : 'Скопировать детали'}
              </button>
            </div>
          )}
          <button className="text-button final-back" type="button" onClick={() => setStep('activities')}><ArrowLeft size={16} /> Выбрать другой вариант</button>
        </section>
      )}

      {step === 'celebration' && <CelebrationScreen onRestart={restart} />}

      <footer className="footer">Сделано с симпатией и лёгким волнением.</footer>
    </main>
  )
}

function CalendarIcon() {
  return <MoonStar size={20} />
}
