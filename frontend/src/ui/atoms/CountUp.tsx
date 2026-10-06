import { fmt } from '@/domain/format'
import { useCountUp } from '../hooks/useCountUp'

interface CountUpProps {
  value: number
  duration?: number
  delay?: number
  decimals?: number
  from?: number
}

export function CountUp({ value, duration, delay, decimals = 0, from }: CountUpProps) {
  const v = useCountUp(value, { duration, delay, from })
  return <span className="countup">{decimals ? fmt.dec(v, decimals) : fmt.int(v)}</span>
}
