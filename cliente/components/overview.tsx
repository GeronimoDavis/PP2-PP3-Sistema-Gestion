"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

const data = [
  {
    name: "Ene",
    total: 1800000,
  },
  {
    name: "Feb",
    total: 2200000,
  },
  {
    name: "Mar",
    total: 2800000,
  },
  {
    name: "Abr",
    total: 3200000,
  },
  {
    name: "May",
    total: 4200000,
  },
  {
    name: "Jun",
    total: 3800000,
  },
  {
    name: "Jul",
    total: 3500000,
  },
  {
    name: "Ago",
    total: 3900000,
  },
  {
    name: "Sep",
    total: 4100000,
  },
  {
    name: "Oct",
    total: 4500000,
  },
  {
    name: "Nov",
    total: 4300000,
  },
  {
    name: "Dic",
    total: 4800000,
  },
]

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value / 1000000}M`}
        />
        <Bar dataKey="total" fill="#16a34a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
