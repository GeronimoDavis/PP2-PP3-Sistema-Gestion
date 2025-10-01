"use client";

import * as React from "react";
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  subYears,
} from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DatePickerWithRangeProps {
  className?: string;
  date: DateRange | undefined;
  setDate: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
}

export function DatePickerWithRange({
  className,
  date,
  setDate,
}: DatePickerWithRangeProps) {
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  const handlePresetSelect = (value: string) => {
    const now = new Date();
    switch (value) {
      case "last-7-days":
        setDate({ from: subDays(now, 6), to: now });
        break;
      case "last-30-days":
        setDate({ from: subDays(now, 29), to: now });
        break;
      case "this-month":
        setDate({ from: startOfMonth(now), to: endOfMonth(now) });
        break;
      case "last-month":
        const lastMonth = subDays(startOfMonth(now), 1);
        setDate({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        break;
      case "last-3-months":
        setDate({ from: subMonths(now, 3), to: now });
        break;
      case "last-6-months":
        setDate({ from: subMonths(now, 6), to: now });
        break;
      case "last-year":
        setDate({ from: subYears(now, 1), to: now });
        break;
      case "last-2-years":
        setDate({ from: subYears(now, 2), to: now });
        break;
      case "last-5-years":
        setDate({ from: subYears(now, 5), to: now });
        break;
      case "all-time":
        setDate({ from: new Date(2020, 0, 1), to: now });
        break;
      default:
        break;
    }
    setPopoverOpen(false);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd/MM/yyyy")} -{" "}
                  {format(date.to, "dd/MM/yyyy")}
                </>
              ) : (
                format(date.from, "dd/MM/yyyy")
              )
            ) : (
              <span>Seleccionar período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col space-y-2 p-4">
            <Select onValueChange={handlePresetSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar un período predefinido" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-7-days">Últimos 7 días</SelectItem>
                <SelectItem value="last-30-days">Últimos 30 días</SelectItem>
                <SelectItem value="this-month">Este mes</SelectItem>
                <SelectItem value="last-month">Mes pasado</SelectItem>
                <SelectItem value="last-3-months">Últimos 3 meses</SelectItem>
                <SelectItem value="last-6-months">Últimos 6 meses</SelectItem>
                <SelectItem value="last-year">Último año</SelectItem>
                <SelectItem value="last-2-years">Últimos 2 años</SelectItem>
                <SelectItem value="last-5-years">Últimos 5 años</SelectItem>
                <SelectItem value="all-time">Desde el inicio</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  O
                </span>
              </div>
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
