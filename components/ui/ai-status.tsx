'use client'

import {
    AnimatePresence,
    motion,
    useReducedMotion,
    type Transition,
    type Variants,
} from 'motion/react'
import React, { useEffect, useState } from 'react'
import useMeasure from 'react-use-measure'

import { cn } from '@/lib/utils'

export type AiStatusState = 'thinking' | 'researching' | 'analyzing' | 'writing' | 'done' | 'error'

const LABELS: Record<AiStatusState, string> = {
    thinking: 'Thinking',
    researching: 'Researching',
    analyzing: 'Analyzing',
    writing: 'Writing',
    done: 'Done',
    error: 'Failed',
}

const PEN_PATH = 'M3.78181 16.3092L3 21L7.69086 20.2182C8.50544 20.0825 9.25725 19.6956 9.84119 19.1116L20.4198 8.53288C21.1934 7.75922 21.1934 6.5049 20.4197 5.73126L18.2687 3.58024C17.495 2.80658 16.2406 2.80659 15.4669 3.58027L4.88841 14.159C4.30447 14.7429 3.91757 15.4947 3.78181 16.3092Z'
const SPARKLE_PATH = 'M11 5Q12 12 19 13Q12 14 11 21Q10 14 3 13Q10 12 11 5Z'
const TWINKLE_PATH = 'M18 2Q18.4 4.6 21 5Q18.4 5.4 18 8Q17.6 5.4 15 5Q17.6 4.6 18 2Z'

const SWAP: Transition = { type: 'spring', duration: 0.5, bounce: 0.15 }
const ICON: Transition = { type: 'spring', duration: 0.55, bounce: 0.35 }
const INSTANT: Transition = { duration: 0 }

const swapVariants: Variants = {
    enter: { y: 8, opacity: 0, filter: 'blur(4px)' },
    center: { y: 0, opacity: 1, filter: 'blur(0px)' },
    exit: { y: -8, opacity: 0, filter: 'blur(4px)' },
}

const iconVariants: Variants = {
    enter: { scale: 0.5, opacity: 0, rotate: -30, filter: 'blur(4px)' },
    center: { scale: 1, opacity: 1, rotate: 0, filter: 'blur(0px)' },
    exit: { scale: 0.5, opacity: 0, rotate: 30, filter: 'blur(4px)' },
}

// the highlight sits mid gradient and the size leaves room either side, so each sweep starts off screen
const SHIMMER = 'linear-gradient(90deg, var(--ai-status-ink) 40%, var(--ai-status-shine) 50%, var(--ai-status-ink) 60%)'

const STROKE = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
} as const

const LOOP = { repeat: Infinity, ease: 'easeInOut' } as const

const isActive = (state: AiStatusState) => state !== 'done' && state !== 'error'

const formatElapsed = (seconds: number) =>
    seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`

export type AiStatusProps = Omit<React.ComponentProps<'div'>, 'children'> & {
    state?: AiStatusState
    label?: string
    detail?: string
    favicon?: string
    timer?: boolean
}

function AiStatus({ state = 'thinking', label, detail, favicon, timer = true, className, ...props }: AiStatusProps) {
    const reduced = !!useReducedMotion()
    const active = isActive(state)
    const [elapsed, setElapsed] = useState(0)
    const [wasActive, setWasActive] = useState(active)

    // a new run starts from zero; switching between working states keeps counting
    if (active !== wasActive) {
        setWasActive(active)
        if (active) {
            setElapsed(0)
        }
    }

    useEffect(() => {
        if (!active || !timer) {
            return
        }
        const start = Date.now()
        const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
        return () => window.clearInterval(id)
    }, [active, timer])

    const [measureRef, bounds] = useMeasure()
    const swap = reduced ? INSTANT : SWAP

    const text =
        label ??
        (timer && state === 'done'
            ? `Worked for ${formatElapsed(elapsed)}`
            : timer && state === 'error'
              ? `Failed after ${formatElapsed(elapsed)}`
              : LABELS[state])

    return (
        <div
            data-slot="ai-status"
            data-state={state}
            role="status"
            className={cn('flex h-8 w-fit items-center gap-2 font-runde text-[14px] text-black dark:text-white', className)}
            {...props}
        >
            <span className="relative flex size-5 shrink-0 items-center justify-center">
                <AnimatePresence initial={false} mode="popLayout">
                    <motion.span
                        key={state}
                        aria-hidden
                        variants={iconVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={reduced ? INSTANT : ICON}
                        className="flex items-center justify-center"
                    >
                        <StateIcon state={state} reduced={reduced} />
                    </motion.span>
                </AnimatePresence>
            </span>

            {/* the row springs between widths, so the detail and timer glide instead of jumping */}
            <motion.div
                className="relative overflow-x-clip"
                initial={false}
                animate={{ width: bounds.width || 'auto' }}
                transition={swap}
            >
                <div ref={measureRef} className="flex w-max items-center gap-1.5 whitespace-nowrap">
                    <span className="relative grid">
                        <AnimatePresence initial={false} mode="popLayout">
                            <motion.span
                                key={text}
                                variants={swapVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={swap}
                                className={cn('font-semibold', !active && 'text-[#868593]')}
                            >
                                {active ? <Shimmer reduced={reduced}>{text}</Shimmer> : text}
                            </motion.span>
                        </AnimatePresence>
                    </span>
                    <AnimatePresence initial={false} mode="popLayout">
                        {detail && (
                            <motion.span
                                key={`${favicon}-${detail}`}
                                variants={swapVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={swap}
                                className="flex min-w-0 items-center gap-1.5 font-medium text-[#868593]/70"
                            >
                                {favicon && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={favicon}
                                        alt=""
                                        draggable={false}
                                        className="size-3.5 shrink-0 rounded-[3px] object-contain"
                                    />
                                )}
                                <span className="max-w-56 truncate">{detail}</span>
                            </motion.span>
                        )}
                    </AnimatePresence>
                    {timer && active && (
                        <span data-slot="ai-status-timer" aria-hidden className="font-medium tabular-nums text-[#868593]/70">
                            {formatElapsed(elapsed)}
                        </span>
                    )}
                </div>
            </motion.div>
        </div>
    )
}

function StateIcon({ state, reduced }: { state: AiStatusState; reduced: boolean }) {
    const loop = (transition: Transition) => (reduced ? INSTANT : transition)

    switch (state) {
        case 'thinking':
            return (
                <svg viewBox="0 0 24 24" width={18} height={18} className="text-[#868593]">
                    <motion.path
                        d={SPARKLE_PATH}
                        fill="currentColor"
                        animate={reduced ? undefined : { rotate: [0, 90], scale: [1, 0.8, 1] }}
                        transition={loop({ duration: 2.4, ...LOOP })}
                    />
                    <motion.path
                        d={TWINKLE_PATH}
                        fill="currentColor"
                        animate={reduced ? undefined : { scale: [0.4, 1, 0.4], opacity: [0.3, 1, 0.3] }}
                        transition={loop({ duration: 1.2, ...LOOP })}
                    />
                </svg>
            )
        case 'researching':
            return (
                <svg viewBox="0 0 24 24" width={18} height={18} className="text-[#868593]">
                    <motion.g
                        animate={reduced ? undefined : { x: [0, 2, 0, -2, 0], y: [-2, 0, 2, 0, -2] }}
                        transition={loop({ duration: 2, repeat: Infinity, ease: 'linear' })}
                    >
                        <circle {...STROKE} cx={10.5} cy={10.5} r={5.5} strokeWidth={2.25} />
                        <path {...STROKE} d="M14.75 14.75L19 19" strokeWidth={2.5} />
                    </motion.g>
                </svg>
            )
        case 'analyzing':
            return (
                <svg viewBox="0 0 24 24" width={18} height={18} className="text-[#868593]">
                    {[6, 12, 18].map((x, i) => (
                        <motion.line
                            key={x}
                            {...STROKE}
                            x1={x}
                            x2={x}
                            y1={10}
                            y2={19}
                            strokeWidth={3}
                            animate={reduced ? undefined : { y1: [15, 5, 15] }}
                            transition={loop({ duration: 0.9, delay: i * 0.15, ...LOOP })}
                        />
                    ))}
                </svg>
            )
        case 'writing':
            return (
                <svg viewBox="0 0 24 24" width={18} height={18} className="text-[#868593]">
                    <motion.path
                        {...STROKE}
                        d="M3 21H11"
                        strokeWidth={2}
                        animate={reduced ? undefined : { pathLength: [0, 1, 1], opacity: [1, 1, 0] }}
                        transition={loop({ duration: 1.4, repeat: Infinity, ease: 'easeOut' })}
                    />
                    <motion.g
                        animate={reduced ? undefined : { x: [-2, 1, -2], y: [0, -1, 0], rotate: [-4, 4, -4] }}
                        transition={loop({ duration: 1.4, ...LOOP })}
                    >
                        <g transform="translate(6 -1) scale(0.75)">
                            <path d={PEN_PATH} fill="currentColor" />
                            <path d="M14 6L18 10" fill="none" strokeWidth={1.5} strokeLinecap="round" className="stroke-[#F4F4F9] dark:stroke-[#262626]" />
                        </g>
                    </motion.g>
                </svg>
            )
        case 'done':
            return (
                <svg viewBox="0 0 24 24" width={18} height={18} className="text-[#868593]">
                    <motion.path
                        {...STROKE}
                        d="M5 12.5L10 17.5L19 7"
                        strokeWidth={2.5}
                        initial={{ pathLength: reduced ? 1 : 0 }}
                        animate={{ pathLength: 1 }}
                        transition={reduced ? INSTANT : { type: 'spring', duration: 0.6, bounce: 0, delay: 0.1 }}
                    />
                </svg>
            )
        case 'error':
            return (
                <svg viewBox="0 0 24 24" width={18} height={18} className="text-[#FF3B30]">
                    <motion.path
                        {...STROKE}
                        d="M7 7L17 17M17 7L7 17"
                        strokeWidth={2.5}
                        animate={reduced ? undefined : { x: [0, -3, 3, -2, 2, 0] }}
                        transition={{ duration: 0.45, delay: 0.1 }}
                    />
                </svg>
            )
    }
}

function Shimmer({ reduced, children }: { reduced: boolean; children: React.ReactNode }) {
    if (reduced) {
        return <span className="text-[#868593]">{children}</span>
    }
    return (
        <motion.span
            className="bg-clip-text text-transparent [--ai-status-ink:#868593] [--ai-status-shine:#000] dark:[--ai-status-shine:#fff]"
            style={{ backgroundImage: SHIMMER, backgroundSize: '250% 100%' }}
            initial={{ backgroundPosition: '100% 0' }}
            animate={{ backgroundPosition: '0% 0' }}
            transition={{ duration: 1.6, ease: 'linear', repeat: Infinity }}
        >
            {children}
        </motion.span>
    )
}

export { AiStatus }
export default AiStatus
