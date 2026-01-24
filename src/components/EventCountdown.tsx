"use client";

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
        <div className="flex gap-3 text-white animate-fadeIn">
            <TimeUnit value={timeLeft.days} label="Days" />
            <TimeUnit value={timeLeft.hours} label="Hrs" />
            <TimeUnit value={timeLeft.minutes} label="Mins" />
            <TimeUnit value={timeLeft.seconds} label="Secs" />
        </div>
    );
}

const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg py-2 px-3 min-w-[60px] flex flex-col items-center justify-center shadow-sm">
        <span className="text-2xl font-bold leading-none mb-1">{value.toString().padStart(2, '0')}</span>
        <span className="text-[10px] uppercase font-medium tracking-wider opacity-80">{label}</span>
    </div>
);
