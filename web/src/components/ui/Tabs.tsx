"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: Tab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, tabs, activeTab, onTabChange, ...props }, ref) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const controlledIndex = activeTab
      ? tabs.findIndex((tab) => tab.id === activeTab)
      : -1;
    const initialIndex = controlledIndex >= 0 ? controlledIndex : 0;
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const [hoverStyle, setHoverStyle] = useState({});
    const [activeStyle, setActiveStyle] = useState({
      left: "0px",
      width: "0px",
    });
    const tabRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
      if (controlledIndex >= 0 && controlledIndex !== activeIndex) {
        setActiveIndex(controlledIndex);
      }
    }, [controlledIndex, activeIndex]);

    useEffect(() => {
      if (hoveredIndex !== null) {
        const hoveredElement = tabRefs.current[hoveredIndex];
        if (hoveredElement) {
          const { offsetLeft, offsetWidth } = hoveredElement;
          setHoverStyle({
            left: `${offsetLeft}px`,
            width: `${offsetWidth}px`,
          });
        }
      }
    }, [hoveredIndex]);

    useEffect(() => {
      const activeElement = tabRefs.current[activeIndex];
      if (activeElement) {
        const { offsetLeft, offsetWidth } = activeElement;
        setActiveStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
        });
      }
    }, [activeIndex]);

    useEffect(() => {
      requestAnimationFrame(() => {
        const firstElement = tabRefs.current[0];
        if (firstElement) {
          const { offsetLeft, offsetWidth } = firstElement;
          setActiveStyle({
            left: `${offsetLeft}px`,
            width: `${offsetWidth}px`,
          });
        }
      });
    }, []);

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex justify-center border-b border-border",
          className,
        )}
        {...props}
      >
        <div
          role="tablist"
          className="relative inline-flex space-x-[6px] items-center"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute h-[30px] transition-all duration-300 ease-out bg-[#0e0f1114] dark:bg-[#ffffff1a] rounded-[6px] flex items-center"
            style={{
              ...hoverStyle,
              opacity: hoveredIndex !== null ? 1 : 0,
            }}
          />

          <div
            aria-hidden
            className="pointer-events-none absolute bottom-[-1px] h-[2px] bg-[#0e0f11] dark:bg-white transition-all duration-300 ease-out"
            style={activeStyle}
          />

          {tabs.map((tab, index) => (
            <div
              key={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              role="tab"
              aria-selected={index === activeIndex}
              tabIndex={0}
              className={cn(
                "relative px-3 py-2 cursor-pointer transition-colors duration-300 h-[30px]",
                index === activeIndex
                  ? "text-[#0e0e10] dark:text-white"
                  : "text-[#0e0f1199] dark:text-[#ffffff99]",
              )}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => {
                setActiveIndex(index);
                onTabChange?.(tab.id);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setActiveIndex(index);
                  onTabChange?.(tab.id);
                }
              }}
            >
              <div className="text-sm font-medium leading-5 whitespace-nowrap flex items-center justify-center h-full">
                {tab.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
);
Tabs.displayName = "Tabs";

export { Tabs };
export type { Tab };
