import { Map, Image, Users, User } from 'lucide-react'

type Tab = 'map' | 'photo' | 'friends' | 'profile'

type Props = {
  active: Tab
  onChange: (tab: Tab) => void
}

const TABS: { key: Tab; label: string; Icon: typeof Map }[] = [
  { key: 'map', label: 'Map', Icon: Map },
  { key: 'photo', label: 'Photo', Icon: Image },
  { key: 'friends', label: 'Friends', Icon: Users },
  { key: 'profile', label: 'Profile', Icon: User },
]

export default function TabBar({ active, onChange }: Props) {
  return (
    <div
      className="absolute left-0 right-0 z-20"
      style={{ bottom: 0, paddingLeft: 16, paddingRight: 16, paddingBottom: 24, paddingTop: 6 }}
    >
      <div
        className="flex"
        style={{
          background: '#1E1E1E',
          borderRadius: 36,
          paddingLeft: 6,
          paddingRight: 6,
          paddingTop: 6,
          paddingBottom: 6,
          height: 66,
        }}
      >
        {TABS.map(({ key, label, Icon }) => {
          const isActive = active === key
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className="flex flex-col items-center justify-center"
              style={{
                flex: 1,
                borderRadius: 30,
                gap: 3,
                paddingTop: 4,
                paddingBottom: 4,
                background: isActive ? '#3C3C3C' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              <Icon
                size={22}
                color={isActive ? '#F2C94C' : 'rgba(255,255,255,0.55)'}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? '#F2C94C' : 'rgba(255,255,255,0.55)',
                  letterSpacing: 0.1,
                }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
