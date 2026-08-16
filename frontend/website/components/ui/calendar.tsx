"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { DayButton, DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      fixedWeeks
      navLayout="around"
      className={cn("w-full bg-transparent text-popover-foreground", className)}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: "w-full",
        months: "flex w-full flex-col",
        month: "relative flex w-full flex-col gap-2",
        nav: "hidden",
        button_previous:
          "absolute left-0 top-0 z-20 inline-flex size-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-primary/10 hover:text-primary-readable aria-disabled:pointer-events-none aria-disabled:opacity-40",
        button_next:
          "absolute right-0 top-0 z-20 inline-flex size-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-primary/10 hover:text-primary-readable aria-disabled:pointer-events-none aria-disabled:opacity-40",
        month_caption:
          "pointer-events-none flex h-8 w-full items-center justify-center px-10",
        caption_label:
          "font-display text-sm font-semibold tracking-tight text-foreground",
        month_grid: "w-full",
        weekdays: "flex w-full",
        weekday:
          "w-[14.285%] select-none py-0.5 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground",
        week: "mt-0.5 flex w-full",
        // No backgrounds on the cell — backgrounds go on the day button only
        day: "relative h-9 w-[14.285%] p-0 text-center",
        today: "",
        outside: "opacity-40",
        disabled: "opacity-35",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({
          className: chevronClassName,
          orientation,
          ...chevronProps
        }) => {
          const Icon =
            orientation === "left"
              ? ChevronLeftIcon
              : orientation === "right"
                ? ChevronRightIcon
                : ChevronDownIcon;
          return (
            <Icon
              className={cn("size-4", chevronClassName)}
              {...chevronProps}
            />
          );
        },
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  const selected =
    modifiers.selected &&
    !modifiers.range_start &&
    !modifiers.range_end &&
    !modifiers.range_middle;

  return (
    <button
      ref={ref}
      type="button"
      data-day={day.date.toLocaleDateString()}
      className={cn(
        "mx-auto flex size-8 items-center justify-center rounded-full text-sm font-medium outline-none transition-colors",
        "text-foreground hover:bg-primary/12 hover:text-primary-readable",
        "focus-visible:ring-2 focus-visible:ring-primary/40",
        modifiers.today &&
          !selected &&
          "bg-primary/15 text-primary-readable hover:bg-primary/20",
        selected &&
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        modifiers.outside && "text-muted-foreground",
        modifiers.disabled &&
          "cursor-not-allowed opacity-40 hover:bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
