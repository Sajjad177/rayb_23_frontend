/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import BusinessCard from "../BusinessCard";
import BusinessCardSkeleton from "./BusinessCardSkeleton";
import TagsAndOpenNow from "./tags-open-now";
import ResultsFiltering from "./results-fiiltering";
import Pagination from "./Pagination";
import AddBusinessSection from "@/components/shared/AddBusinessSection";
import { useFilterStore } from "@/zustand/stores/search-store";
import { useSearchStore } from "@/components/home/states/useSearchStore";

interface Review {
  _id: string;
  rating: number;
  status: string;
}

interface BusinessItem {
  email: string;
  name: string;
  image: string[];
  address: string;
  phone: string;
  website: string;
  description: string;
}

interface Service {
  newInstrumentName: string;
  price: string;
  minPrice: string;
  maxPrice: string;
  pricingType: string;
}

interface Business {
  _id: string;
  businessInfo: BusinessItem;
  review: Review[];
  services: Service[];
  images?: string[];
}

const BusinessInfo = () => {
  const [page, setPage] = React.useState(1);
  const limit = 5;

  const {
    familyTag,
    instrumentTag,
    serviceTag,
    offersTag,
    minPriceRange,
    maxPriceRange,
    open,
    sort,
    search,
  } = useFilterStore();

  const { location } = useSearchStore();
  const searchLocation = location || "";

  React.useEffect(() => {
    setPage(1);
  }, [
    familyTag,
    instrumentTag,
    serviceTag,
    offersTag,
    minPriceRange,
    maxPriceRange,
    open,
    sort,
    search,
    searchLocation,
  ]);

  const { data: allBusiness = {}, isLoading } = useQuery({
    // IMPORTANT: Add location to queryKey so it triggers refetch when location changes
    queryKey: [
      "get-all-business",
      page,
      familyTag,
      instrumentTag,
      serviceTag,
      offersTag,
      minPriceRange,
      maxPriceRange,
      open,
      sort,
      search,
      searchLocation,
    ],
    queryFn: async () => {
      console.log("API Call with search:", search, "location:", searchLocation); // Debug log

      const offersParams = offersTag
        .map((tag) => {
          switch (tag.label) {
            case "Buy":
              return "buyInstruments=true";
            case "Sell":
              return "sellInstruments=true";
            case "Trade":
              return "tradeInstruments=true";
            case "Rental":
              return "rentInstruments=true";
            case "Music Lessons":
              return "isMusicLessons=true";
            default:
              return "";
          }
        })
        .filter((param) => param !== "")
        .join("&");

      const now = new Date();
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        instrumentFamily: familyTag[0]?.label || "",
        selectedInstrumentsGroup: instrumentTag[0]?.label || "",
        newInstrumentName: serviceTag[0]?.label || "",
        minPrice: minPriceRange,
        maxPrice: maxPriceRange,
        openNow: String(open),
        sort,
        search,
        searchLocation,
        currentDay: now.toLocaleDateString("en-US", { weekday: "long" }),
        currentMinutes: String(now.getHours() * 60 + now.getMinutes()),
      });

      const url = `${process.env.NEXT_PUBLIC_API_URL}/business?${params.toString()}${
        offersParams ? `&${offersParams}` : ""
      }`;


      const res = await fetch(url);
      const data = await res.json();

      // Ensure review is always an array
      if (data.data) {
        data.data = data.data.map((business: any) => ({
          ...business,
          review: business.review || [],
          images: business.images || business.businessInfo?.image || [],
        }));
      }

      return data;
    },
  });



  const totalPages = Math.ceil((allBusiness?.pagination?.total || 0) / limit);

  return (
    <div>
      <ResultsFiltering allBusiness={allBusiness} />
      <TagsAndOpenNow />

      <div className="space-y-6 mt-8">
        {isLoading ? (
          [...Array(limit)].map((_, i) => <BusinessCardSkeleton key={i} />)
        ) : allBusiness.data && allBusiness.data.length > 0 ? (
          allBusiness.data.map((business: Business) => (
            <BusinessCard business={business} key={business._id} />
          ))
        ) : (
          <div className="text-center text-gray-500 min-h-[450px] flex flex-col items-center justify-center">
            <p className="text-xl">No businesses found.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {allBusiness.data && (
        <Pagination
          totalPages={totalPages}
          currentPage={page}
          onPageChange={(p) => setPage(p)}
        />
      )}

      <AddBusinessSection />
    </div>
  );
};

export default BusinessInfo;
