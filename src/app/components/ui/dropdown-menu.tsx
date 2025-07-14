"use client";

import { useState } from "react";
import { Button } from "./button";
import { cn } from "./utils";

export function DropdownMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  return (
    <div className="relative inline-block">
      {/* Trigger Button */}
      <Button
        onClick={toggleDropdown}
        className="flex items-center gap-1"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        Menu <ChevronDown className={cn("h-4 w-4 transition", isOpen && "rotate-180")} />
      </Button>

      {/* Dropdown Content */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white border z-50"
          onMouseLeave={closeDropdown}
        >
          <div className="py-1">
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              onClick={closeDropdown}
            >
              Option 1
            </button>
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              onClick={closeDropdown}
            >
              Option 2
            </button>
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              onClick={closeDropdown}
            >
              Option 3
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}