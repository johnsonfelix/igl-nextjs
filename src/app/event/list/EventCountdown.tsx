'use client';

import { useEffect, useState } from 'react';
import { differenceInSeconds, parseISO } from 'date-fns';

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

export default function EventCountdown({ targetDate }: { targetDate: string }) {
    const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const target = parseISO(targetDate);
            const difference = differenceInSeconds(target, now);

            if (difference <= 0) {
                return { days: 0, hours: 0, minutes: 0, seconds: 0 };
            }

            const days = Math.floor(difference / (3600 * 24));
            const hours = Math.floor((difference % (3600 * 24)) / 3600);
            const minutes = Math.floor((difference % 3600) / 60);
            const seconds = Math.floor(difference % 60);

            return { days, hours, minutes, seconds };
        };

        // Initial calculation
        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (!timeLeft) return null;

    // If even passed
    if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
        return null;
    }

    return (
        <div className="flex gap-1.5 text-white animate-fadeIn">
            <TimeUnit value={timeLeft.days} label="Days" />
            <TimeUnit value={timeLeft.hours} label="Hrs" />
            <TimeUnit value={timeLeft.minutes} label="Mins" />
            <TimeUnit value={timeLeft.seconds} label="Secs" />
        </div>
    );
}

const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-md py-1.5 px-2 min-w-[36px] flex flex-col items-center justify-center shadow-sm">
        <span className="text-sm font-bold leading-none mb-0.5">{value.toString().padStart(2, '0')}</span>
        <span className="text-[8px] uppercase font-medium tracking-tight opacity-90">{label}</span>
    </div>
);
