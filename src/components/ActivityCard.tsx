import Link from "next/link";
import type { Activity } from "@/data/activities";

export default function ActivityCard({
  activity,
}: {
  activity: Activity;
}) {
  return (
    <Link
      href={`/aktivitas#${activity.id}`}
      className="group flex h-full flex-col rounded-3xl border border-[#DCEBF0] bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-[#9FD3E3] hover:shadow-lg"
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${activity.color}`}
      >
        <i
          className={`bi ${activity.icon} text-2xl ${activity.iconColor}`}
          aria-hidden="true"
        />
      </div>

      <div className="mt-5 flex items-start justify-between gap-3">
        <h3 className="text-xl font-bold text-[#173B46]">
          {activity.title}
        </h3>

        <span className="text-sm font-medium text-[#9AB0B7]">
          {activity.number}
        </span>
      </div>

      <p className="mt-2 text-sm font-semibold text-[#2A7387]">
        {activity.subtitle}
      </p>

      <p className="mt-3 flex-1 text-sm leading-6 text-[#65828B]">
        {activity.description}
      </p>

      <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0C3846]">
        Lihat aktivitas
        <i
          className="bi bi-arrow-right transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}