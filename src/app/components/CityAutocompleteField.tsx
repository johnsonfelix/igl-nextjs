'use client';

import { useState, useEffect, useRef } from 'react';

type CityAutocompleteFieldProps = {
    value: string;
    onChange: (value: string) => void;
    label: string;
    placeholder?: string;
};

const CityAutocompleteField = ({ value, onChange, label, placeholder }: CityAutocompleteFieldProps) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const apiKey = "613b9f155fbb4d35ad580f50b55ea9fa"; // Your Geoapify API key

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsFocused(false);
                setSuggestions([]);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const fetchSuggestions = async (input: string) => {
        onChange(input);
        if (input.trim().length < 2) {
            setSuggestions([]);
            return;
        }

        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${input}&type=city&format=json&apiKey=${apiKey}`;
        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                const results = (data.results as any[]).map(item => 
                    `${item.city || item.name || ''}${item.country ? `, ${item.country}` : ''}`
                ).filter(name => name.trim().length > 0);
                
                setSuggestions([...new Set(results)]); // Remove duplicates
            }
        } catch (error) {
            console.error("Failed to fetch city suggestions:", error);
            setSuggestions([]);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label} <span className="text-red-500">*</span></label>
            <input
                type="text"
                value={value}
                onChange={(e) => fetchSuggestions(e.target.value)}
                onFocus={() => setIsFocused(true)}
                placeholder={placeholder || `Enter ${label.toLowerCase()}`}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                required
            />
            {isFocused && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                        <div
                            key={index}
                            className="p-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                                onChange(suggestion);
                                setSuggestions([]);
                                setIsFocused(false);
                            }}
                        >
                            {suggestion}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CityAutocompleteField;
