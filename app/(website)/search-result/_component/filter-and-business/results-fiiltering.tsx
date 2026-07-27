"use client";

import { useSearchStore } from "@/components/home/states/useSearchStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useFilterStore } from "@/zustand/stores/search-store";
import React, { useEffect, useState } from "react";

type ResultsFilteringProps = {
  allBusiness?: {
    searchCount?: number;
    pagination?: {
      total?: number;
    };
    [key: string]: unknown;
  } | null;
};

const ResultsFiltering = ({
  allBusiness = { searchCount: 0 },
}: ResultsFilteringProps) => {
  const { setSort, sort } = useFilterStore();
  const { location } = useSearchStore();
  const [hydrated, setHydrated] = useState(false);
  const resultLocation = location ? `"${location}"` : "";

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-6 w-48" />
        </div>

        <div className="flex flex-col items-end">
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-gray-500">
          {allBusiness?.pagination?.total ?? allBusiness?.searchCount ?? 0}{" "}
          Results for
        </h1>
        <h1 className="text-xl font-bold">{resultLocation}</h1>
      </div>

      <div>
        <h1 className="text-gray-500">Sort by</h1>
        <Select
          value={sort || "default"}
          onValueChange={(value) => setSort(value)}
        >
          <SelectTrigger className="border-none focus:ring-offset-0 p-0 h-5 focus:ring-0 shadow-none justify-normal gap-2 focus:border-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="rating-high-to-low">
              Rated High to Low
            </SelectItem>
            <SelectItem value="rating-low-to-high">
              Rated Low to High
            </SelectItem>
            <SelectItem value="high-to-low">Price Low to High</SelectItem>
            <SelectItem value="low-to-high">Price High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ResultsFiltering;
