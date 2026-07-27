"use client";
import { useFilterStore } from "@/zustand/stores/search-store";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useMemo, type MouseEvent } from "react";

interface Review {
  _id: string;
  rating: number;
  status: string;
  googleAuthorName?: string | null;
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
  price: string | number | null;
  minPrice: string | number | null;
  maxPrice: string | number | null;
  pricingType: string;
}

interface Business {
  _id: string;
  businessInfo: BusinessItem;
  review: Review[];
  services: Service[];
  images?: string[];
}

// Helper function to calculate average rating
const calculateAverageRating = (reviews: Review[] = []) => {
  if (!reviews || reviews.length === 0) return null;

  // Only count approved reviews
  const approvedReviews = reviews.filter(
    (review) => review.status === "approved",
  );
  if (approvedReviews.length === 0) return null;

  const totalRating = approvedReviews.reduce((sum, review) => {
    return sum + review.rating;
  }, 0);

  return (totalRating / approvedReviews.length).toFixed(1);
};

// Helper function to check if there are any Google reviews
const hasGoogleReviews = (reviews: Review[] = []) => {
  if (!reviews || reviews.length === 0) return false;

  // Check if any review has a googleAuthorName that is not null, not undefined, and not empty string
  return reviews.some((review) => {
    return (
      review.googleAuthorName &&
      review.googleAuthorName !== null &&
      review.googleAuthorName.trim() !== ""
    );
  });
};

const BusinessCard = ({ business }: { business: Business }) => {
  console.log("all business", business);
  const router = useRouter()  ;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = business?.images || [];

  const { search, serviceTag, minPriceRange, maxPriceRange } = useFilterStore();

  // Check if business has Google reviews
  const hasGoogleReview = useMemo(
    () => hasGoogleReviews(business?.review),
    [business?.review],
  );

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  const handleCardClick = () => {
    router.push(`/search-result/${business._id}`);
  };

  const stopCardNavigation = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Calculate average rating
  const averageRating = calculateAverageRating(business?.review);

  const hasPrice = (value: Service["price"]) =>
    value !== null &&
    value !== undefined &&
    value !== "" &&
    !Number.isNaN(Number(value));

  const isPricedService = (service: Service) => {
    if (service.pricingType === "range") {
      return hasPrice(service.minPrice) && hasPrice(service.maxPrice);
    }

    return hasPrice(service.price);
  };

  const matchesPriceRange = (service: Service) => {
    const hasMinFilter = minPriceRange.trim() !== "";
    const hasMaxFilter = maxPriceRange.trim() !== "";

    if (!hasMinFilter && !hasMaxFilter) return true;

    const filterMin = hasMinFilter ? Number(minPriceRange) : 0;
    const filterMax = hasMaxFilter
      ? Number(maxPriceRange)
      : Number.POSITIVE_INFINITY;

    if (service.pricingType === "range") {
      if (!hasPrice(service.minPrice) || !hasPrice(service.maxPrice))
        return false;

      const serviceMin = Number(service.minPrice);
      const serviceMax = Number(service.maxPrice);

      return serviceMax >= filterMin && serviceMin <= filterMax;
    }

    if (!hasPrice(service.price)) return false;

    const servicePrice = Number(service.price);
    return servicePrice >= filterMin && servicePrice <= filterMax;
  };

  // Price display function
  const getDisplayPrice = (service: Service) => {
    if (service.pricingType === "exact" && hasPrice(service.price)) {
      return `$${service.price}`;
    } else if (
      service.pricingType === "range" &&
      hasPrice(service.minPrice) &&
      hasPrice(service.maxPrice)
    ) {
      return `$${service.minPrice} - $${service.maxPrice}`;
    } else if (hasPrice(service.price)) {
      return `$${service.price}`;
    } else if (hasPrice(service.minPrice) && hasPrice(service.maxPrice)) {
      return `$${service.minPrice} - $${service.maxPrice}`;
    }
  };

  const pricedServices = business?.services?.filter(isPricedService) || [];
  const hasActiveServiceFilter =
    search.trim() !== "" ||
    serviceTag.length > 0 ||
    minPriceRange.trim() !== "" ||
    maxPriceRange.trim() !== "";

  // Filter services based on search, serviceTag, and price range
  const filteredServices = pricedServices.filter((service) => {
    const serviceName = service?.newInstrumentName?.toLowerCase() || "";

    if (search.trim() && !serviceName.includes(search.toLowerCase().trim())) {
      return false;
    }

    if (
      serviceTag.length > 0 &&
      !serviceTag.some((tag) =>
        serviceName.includes(tag.label?.toLowerCase()?.trim()),
      )
    ) {
      return false;
    }

    return matchesPriceRange(service);
  });

  const displayedServices = hasActiveServiceFilter
    ? filteredServices
    : pricedServices;

  return (
    <div>
      <div
        role="link"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;

          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick();
          }
        }}
        className="cursor-pointer bg-white rounded-lg shadow-[0px_2px_12px_0px_#003d3924] p-4 lg:p-6"
      >
        <div className="flex flex-col sm:flex-row items-start gap-4 lg:gap-5">
          <div className="flex-shrink-0 overflow-hidden rounded-lg w-full sm:w-auto relative">
            {/* Image Slider */}
            <div className="relative w-full sm:w-[200px] h-[160px] sm:h-[200px] rounded-lg overflow-hidden">
              <Image
                src={
                  business?.businessInfo?.image[currentImageIndex] ||
                  "/placeholder-image.jpg"
                }
                alt={business?.businessInfo?.name || "Business image"}
                width={200}
                height={200}
                className="rounded-lg object-cover w-full h-full transition-transform duration-300 hover:scale-105"
              />

              {/* Navigation Arrows - Show only if multiple images */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      stopCardNavigation(e);
                      prevImage();
                    }}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-all duration-200"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      stopCardNavigation(e);
                      nextImage();
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-all duration-200"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              {images.length > 1 && (
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                  {currentImageIndex + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Dot Indicators */}
            {images.length > 1 && (
              <div className="flex justify-center mt-3 space-x-1">
                {images.map((_, index) => (
                  <button
                    type="button"
                    key={index}
                    onClick={(e) => {
                      stopCardNavigation(e);
                      goToImage(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentImageIndex
                        ? "bg-primary"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 w-full">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {business.businessInfo?.name}
                </h3>

                <div className="my-3 flex items-center gap-2">
                  {!averageRating ? (
                    <span className="text-sm text-gray-500">No reviews</span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Star className="fill-yellow-400 text-yellow-400 font-bold h-4 w-4" />
                      <span className="text-sm text-gray-700">
                        {averageRating}
                      </span>
                      {/* Show Google icon only if there is at least ONE Google review */}
                      {hasGoogleReview && (
                        <span className="text-xs flex items-center gap-1">
                          <Image
                            src="/images/google.jpeg"
                            alt="google"
                            width={1000}
                            height={1000}
                            className="h-4 w-4"
                          />
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {displayedServices.length > 0 ? (
                      displayedServices.slice(0, 1).map((service, index) => (
                        <button
                          type="button"
                          className="h-[40px] lg:h-[48px] px-4 lg:px-5 rounded-lg bg-[#F8F8F8] text-sm lg:text-base flex items-center gap-5"
                          key={index}
                        >
                          <span>{service.newInstrumentName}</span>
                          <span>{getDisplayPrice(service)}</span>
                        </button>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">
                        No priced services available
                      </span>
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      className="text-primary text-sm lg:text-base"
                    >
                      See More
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;
