/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Star,
  SaveIcon,
  Share2Icon,
  LocateIcon,
  Loader2,
  Copy,
  X,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Search,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import ReviewModal from "@/components/modals/ReviewModal";
import ReviewSubmittedModal from "@/components/modals/ReviewSubmittedModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import AddPhotoModal from "../modal/AddPhotoModal";
import { useMap } from "react-leaflet";
import ReactDOMServer from "react-dom/server";
import { DivIcon } from "leaflet";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import LoginModal from "@/components/business/modal/login-modal";
import ClaimModal from "../modal/claim-modal";
import AddPhotoSuccessModal from "@/components/modals/add-photo-modal";
import BusinessGalleryModal from "../modal/BusinessGalleryModal";
import ServiceType from "./service-type";
import WorkingHours from "./working-hours";
import ContactInfo from "./contact-info";
import Location from "./location";
import Link from "next/link";

interface Reply {
  _id: string;
  text: string;
  repliedBy: string;
  repliedAt: string;
}

interface Review {
  _id: string;
  rating: number;
  feedback: string;
  image: string[];
  status: string;
  user: {
    _id: string;
    name: string;
    email: string;
    imageLink: string;
  } | null;
  userId: string;
  business: string;
  googlePlaceId: string;
  createdAt: string;
  updatedAt: string;
  report: {
    isReported: boolean;
    reportMessage: string;
  };
  reply?: Reply[];
  googleAuthorName: string | null;
  googleAuthorPhoto: string | null;
}

interface MusicLesson {
  newInstrumentName: string;
  pricingType: string;
  price: string;
  minPrice: string;
  maxPrice: string;
  selectedInstrumentsGroupMusic: string;
  instrumentFamily: string;
}

interface BusinessProfileProps {
  singleBusiness: {
    _id: string;
    userId: string;
    businessInfo: {
      name: string;
      image: string[];
      address: string;
      phone: string;
      email: string;
      website: string;
      description: string;
    };
    user: {
      _id: string;
      name: string;
      email: string;
    };
    services: Array<{
      newInstrumentName: string;
      pricingType: string;
      price: string;
      minPrice: string;
      maxPrice: string;
      selectedInstrumentsGroup: string;
      instrumentFamily: string;
    }>;
    selectedInstruments?: Array<{
      instrumentName: string;
      instrumentFamily: string;
    }>;
    musicLessons: MusicLesson[];
    businessHours: Array<{
      day: string;
      startTime: string;
      startMeridiem: string;
      endTime: string;
      endMeridiem: string;
      enabled: boolean;
    }>;
    buyInstruments: boolean;
    sellInstruments: boolean;
    tradeInstruments: boolean;
    offerMusicLessons: boolean;
    rentInstruments: boolean;
    review: Review[];
    isVerified: boolean;
    isClaimed: boolean;
    status: string;
    images: string[];
  };
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  businessId: string;
}

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

const ShareModal = ({
  isOpen,
  onClose,
  businessName,
  businessId,
}: ShareModalProps) => {
  const [copied, setCopied] = useState(false);

  const shareLink = `${window.location.origin}/search-result/${businessId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg md:text-xl font-semibold">
            Share {businessName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-gray-600 mb-4 text-sm md:text-base">
          Copy the link below to share this business with others
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <Input value={shareLink} readOnly className="flex-1 text-sm" />
          <Button
            onClick={handleCopy}
            variant="outline"
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <Copy className="h-4 w-4" />
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-[#139a8e] hover:bg-[#0d7a70] w-full sm:w-auto"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

type SectionKey = "repair" | "lessons" | "otherService";

// Responsive Image Slider Component
const ImageSlider = ({
  images,
  businessName,
  onImageClick,
}: {
  images: string[];
  businessName: string;
  onImageClick: (imageUrl: string) => void;
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Remove duplicates and filter out empty/null images
  const uniqueImages = useMemo(() => {
    return Array.from(
      new Set(images.filter((img) => img && img.trim() !== "")),
    );
  }, [images]);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % uniqueImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(
      (prev) => (prev - 1 + uniqueImages.length) % uniqueImages.length,
    );
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  if (!uniqueImages || uniqueImages.length === 0) {
    return (
      <div className="flex-shrink-0">
        <div className="rounded-lg bg-gray-200 h-[140px] w-[140px] sm:h-[172px] sm:w-[172px] flex items-center justify-center">
          <span className="text-gray-500 text-sm">No Image</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 relative group">
      <div
        className="relative rounded-lg overflow-hidden h-[140px] w-[140px] sm:h-[172px] sm:w-[172px] cursor-pointer"
        onClick={() => onImageClick(uniqueImages[currentImageIndex])}
      >
        <Image
          src={uniqueImages[currentImageIndex]}
          alt={`${businessName} - Image ${currentImageIndex + 1}`}
          width={172}
          height={172}
          className="rounded-lg object-cover h-full w-full"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/images/placeholder-business.jpg";
          }}
        />

        {/* Navigation Arrows - Show only if multiple images */}
        {uniqueImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
            >
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {uniqueImages.length > 1 && (
          <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded-full z-10">
            {currentImageIndex + 1} / {uniqueImages.length}
          </div>
        )}
      </div>

      {/* Dot Indicators */}
      {uniqueImages.length > 1 && (
        <div className="flex justify-center mt-2 space-x-1">
          {uniqueImages.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                goToImage(index);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${index === currentImageIndex
                ? "bg-[#139a8e]"
                : "bg-gray-300 hover:bg-gray-400"
                }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const BusinessDetails: React.FC<BusinessProfileProps> = ({
  singleBusiness,
}) => {
  const [expandedSections, setExpandedSections] = useState<{
    repair: boolean;
    lessons: boolean;
    otherService: boolean;
  }>({
    repair: true,
    lessons: false,
    otherService: false,
  });

  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<
    string | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddPhoto, setIsAddPhotoOpen] = useState(false);
  const [photoSuccessModal, setPhotoSuccessModal] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("mostRecent");
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);

  const session = useSession();
  const token = session?.data?.user?.accessToken;
  const userId = session?.data?.user?.id;

  const role = session?.data?.user?.userType;
  const isBusinessAccount = role === "businessMan";
  const status = session?.status;
  const router = useRouter();
  const customerFeatureTitle = isBusinessAccount
    ? "As a business account, you cannot use this feature."
    : undefined;

  const address = singleBusiness.businessInfo.address;

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  // Check if business has Google reviews
  const hasGoogleReview = useMemo(
    () => hasGoogleReviews(singleBusiness.review),
    [singleBusiness.review],
  );

  useEffect(() => {
    console.log("📍 Starting geocoding for address:", address);

    if (!address || address.trim() === "") {
      console.warn("❌ Address is empty, skipping geocoding");
      setCoords(null);
      return;
    }

    let isActive = true;

    const geocodeAddress = async (addr: string, attempt = 1): Promise<void> => {
      if (!isActive) return;

      try {
        console.log(`🔄 Geocoding attempt ${attempt} for: ${addr}`);

        // Direct call to Nominatim API
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1&addressdetails=1`,
          {
            headers: {
              "User-Agent": "MusicBusinessFinder",
              Accept: "application/json",
              "Accept-Language": "en",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("📊 Raw OSM response:", data);

        if (!isActive) return;

        if (Array.isArray(data) && data.length > 0) {
          const location = data[0];
          const coords = {
            lat: parseFloat(location.lat),
            lng: parseFloat(location.lon),
          };

          console.log("✅✅✅ SUCCESS - Dynamic coordinates found:", coords);
          console.log("📍 Full location data:", location);

          if (isActive) {
            setCoords(coords);
          }
        } else {
          console.warn(`⚠️ No results found for address: "${addr}"`);
          console.log("Response was:", data);

          // Try different variations
          if (attempt === 1) {
            // Try adding city if not present
            if (
              !addr.toLowerCase().includes("dhaka") &&
              !addr.toLowerCase().includes("bangladesh")
            ) {
              setTimeout(() => geocodeAddress(`${addr}, Dhaka`, 2), 1000);
            } else if (
              addr.toLowerCase().includes("dhaka") &&
              !addr.toLowerCase().includes("bangladesh")
            ) {
              setTimeout(() => geocodeAddress(`${addr}, Bangladesh`, 2), 1000);
            } else {
              if (isActive) setCoords(null);
            }
          } else if (attempt === 2) {
            // Try just the first part of address
            const firstPart = addr.split(",")[0].trim();
            if (firstPart && firstPart !== addr) {
              setTimeout(() => geocodeAddress(firstPart, 3), 1000);
            } else {
              if (isActive) setCoords(null);
            }
          } else {
            if (isActive) setCoords(null);
          }
        }
      } catch (error) {
        console.error(`❌ Geocoding error (attempt ${attempt}):`, error);

        if (attempt < 3) {
          setTimeout(() => geocodeAddress(addr, attempt + 1), 1000 * attempt);
        } else {
          if (isActive) setCoords(null);
        }
      }
    };

    // Start geocoding
    geocodeAddress(address);

    return () => {
      isActive = false;
    };
  }, [address]);

  // Calculate star distribution
  const calculateStarDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    singleBusiness.review.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating as keyof typeof distribution]++;
      }
    });

    return distribution;
  };

  const starDistribution = calculateStarDistribution();

  // Filter and sort reviews
  useEffect(() => {
    let reviews = singleBusiness.review.filter(
      (review) =>
        review.status === "approved" &&
        review.feedback.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    // Apply sorting
    switch (sortBy) {
      case "mostRecent":
        reviews = reviews.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case "highestRated":
        reviews = reviews.sort((a, b) => b.rating - a.rating);
        break;
      case "lowestRated":
        reviews = reviews.sort((a, b) => a.rating - b.rating);
        break;
      default:
        break;
    }

    setFilteredReviews(reviews);
  }, [singleBusiness.review, searchQuery, sortBy]);

  // Custom icon
  const customMarker = new DivIcon({
    html: ReactDOMServer.renderToString(
      <MapPin fill="#139a8e" className="text-white w-8 h-8" />,
    ),
    className: "", // remove default styles
    iconSize: [24, 24],
    iconAnchor: [12, 24], // bottom center
  });

  // Optional: auto-fit map view to coordinates
  const SetMapView = ({
    coords,
    zoom,
  }: {
    coords: { lat: number; lng: number };
    zoom: number;
  }) => {
    const map = useMap();
    if (coords) {
      map.setView([coords.lat, coords.lng], zoom);
    }
    return null;
  };

  const toggleSection = (section: SectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatPrice = (service: any) => {
    const hasPrice = (value: unknown) =>
      value !== null &&
      value !== undefined &&
      value !== "" &&
      !Number.isNaN(Number(value));

    if (service.pricingType === "exact") {
      if (!hasPrice(service.price)) return "Contact for pricing";
      return `$${service.price}`;
    } else if (service.pricingType === "range") {
      if (!hasPrice(service.minPrice) || !hasPrice(service.maxPrice)) {
        return "Contact for pricing";
      }
      return `$${service.minPrice} - $${service.maxPrice}`;
    } else if (service.pricingType === "hourly") {
      if (!hasPrice(service.price)) return "Contact for pricing";
      return `$${service.price}/hr`;
    }
    return "Contact for pricing";
  };

  const formatTime = (time: string, meridiem: string) => {
    return `${time} ${meridiem}`;
  };

  const getTodayBusinessHours = () => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    const todayHours = singleBusiness.businessHours?.find(
      (hour) => hour.day?.toLowerCase() === today.toLowerCase(),
    );

    if (!todayHours) return "Hours unavailable";
    if (todayHours.enabled === false) return "Closed today";

    return `${formatTime(
      todayHours.startTime,
      todayHours.startMeridiem,
    )} - ${formatTime(todayHours.endTime, todayHours.endMeridiem)}`;
  };

  const handleSaveBusiness = async () => {
    if (status === "unauthenticated") {
      return setIsLoginModalOpen(true);
    }

    if (isBusinessAccount) {
      toast.error("Business accounts cannot save businesses.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/saved-business/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            savedBusiness: singleBusiness._id,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save business");
      }

      toast.success(data.message || "Business saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save business");
      console.error("Error saving business:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate average rating
  const calculateAverageRating = () => {
    if (singleBusiness.review.length === 0) return "0.0";

    const totalRating = singleBusiness.review.reduce((sum, review) => {
      return sum + review.rating;
    }, 0);

    return (totalRating / singleBusiness.review.length).toFixed(1);
  };

  const averageRating = calculateAverageRating();

  // Group services by instrument family
  const groupedServices = singleBusiness.services.reduce(
    (acc: any, service) => {
      const family = service.instrumentFamily;
      if (!acc[family]) {
        acc[family] = [];
      }
      acc[family].push(service);
      return acc;
    },
    {},
  );

  // Format date function for replies
  const formatReplyDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  // ReviewItem component with reply display
  const ReviewItem = ({ review }: { review: Review }) => {
    const [expanded, setExpanded] = useState(false);
    const needsTruncation = review.feedback.length > 150;

    // Get reviewer name (prefer user name, fallback to googleAuthorName)
    const reviewerName =
      review.user?.name || review?.googleAuthorName || "Anonymous User";

    // Get reviewer avatar (prefer user image, fallback to googleAuthorPhoto)
    const reviewerAvatar = review.user?.imageLink || review?.googleAuthorPhoto;

    // Get first letter for fallback avatar
    const firstLetter =
      reviewerName !== "Anonymous User" ? reviewerName[0]?.toUpperCase() : "U";

    return (
      <div className="border shadow-md rounded-lg p-4 border-gray-200 py-4 md:py-6">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-teal-100 rounded-full flex items-center justify-center overflow-hidden">
              {reviewerAvatar ? (
                <Image
                  src={reviewerAvatar}
                  alt={reviewerName}
                  width={1000}
                  height={1000}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-teal-800 font-semibold text-xs">
                  {firstLetter}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <h1 className="text-sm font-medium text-gray-900 mb-1 truncate">
                {reviewerName}
              </h1>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 md:w-4 md:h-4 ${star <= review.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                      }`}
                  />
                ))}
              </div>
            </div>

            <div className="text-xs md:text-sm text-gray-500 mb-2">
              {new Date(review.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>

            <p className="text-gray-700 text-sm md:text-base">
              {needsTruncation && !expanded
                ? `${review.feedback.substring(0, 150)}...`
                : review.feedback}
              {needsTruncation && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-teal-600 hover:text-teal-800 ml-1 font-medium text-sm"
                >
                  {expanded ? "Show less" : "Read more"}
                </button>
              )}
            </p>

            {/* Review Images */}
            {review.image && review.image.length > 0 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {review.image.map((img, index) => (
                  <div
                    key={index}
                    className="w-16 h-16 md:w-20 md:h-20 relative flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      // You can add image lightbox functionality here
                      console.log("Open image lightbox");
                    }}
                  >
                    <Image
                      src={img}
                      alt={`Review image ${index + 1}`}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Business Replies Section */}
            {review.reply && review.reply.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="h-4 w-4 text-teal-500" />
                  <h4 className="text-sm font-semibold text-gray-700">
                    Business Responses
                  </h4>
                </div>

                {review.reply.map((reply, index) => (
                  <div
                    key={reply._id}
                    className="pl-4 border-l-2 border-teal-200"
                  >
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-teal-600">
                            {reply.repliedBy === singleBusiness.userId
                              ? "Business Owner"
                              : "Staff"}
                          </span>
                          <span className="text-xs text-gray-400">
                            • {formatReplyDate(reply.repliedAt)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{reply.text}</p>
                    </div>

                    {/* Add separator between multiple replies */}
                    {review.reply && index < review.reply.length - 1 && (
                      <div className="my-2 ml-2 w-0.5 h-4 bg-gray-200"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const { mutateAsync: chatCreation } = useMutation({
    mutationKey: ["create-chat"],
    mutationFn: async (data: {
      participants: { userId: string; role: string }[];
      businessId?: string;
    }) => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/chat/create`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create chat");
        }

        const result = await response.json();
        console.log("✅ Server response:", result);
        return result;
      } catch (error) {
        console.error("❌ Error creating chat:", error);
        throw error;
      }
    },
  });

  const handleReview = () => {
    if (status === "unauthenticated") {
      return setIsLoginModalOpen(true);
    }

    if (isBusinessAccount) {
      toast.error("Business accounts cannot write reviews.");
      return;
    }

    setIsOpen(true);
  };

  const handleAddPhoto = () => {
    if (status === "unauthenticated") {
      return setIsLoginModalOpen(true);
    }

    if (isBusinessAccount) {
      toast.error("Business accounts cannot add photos.");
      return;
    }

    setIsAddPhotoOpen(true);
  };

  const handleMessage = async () => {
    if (!userId || !role) {
      toast.error("You must be logged in to send a message.");
      return;
    }

    const data = {
      participants: [
        {
          userId: userId,
          role: role,
        },
        {
          userId: singleBusiness.userId,
          role: "businessMan",
        },
      ],
      businessId: singleBusiness._id,
    };

    try {
      await chatCreation(data);
    } catch (error) {
      console.log(error);
    } finally {
      if (role === "user") {
        router.push("/customer-dashboard/messages");
      }
      if (role === "businessMan") {
        router.push("/business-dashboard/messages");
      }
      if (role === "admin") {
        router.push("/admin-dashboard/messages");
      }
    }
  };

  console.log("singleBusiness", singleBusiness);

  // Combine all images from businessInfo.image and images array with deduplication
  const allBusinessImages = useMemo(() => {
    const combined = [
      ...singleBusiness.businessInfo.image,
      ...(singleBusiness.images || []),
    ];
    // Remove duplicates and empty strings
    return Array.from(
      new Set(combined.filter((img) => img && img.trim() !== "")),
    );
  }, [singleBusiness.businessInfo.image, singleBusiness.images]);

  return (
    <div>
      {/* Business Header - Made responsive */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6 border-b border-gray-200 pb-6 lg:pb-8">
        {/* Business Image Slider */}
        <div className="self-center lg:self-auto">
          <ImageSlider
            images={allBusinessImages}
            businessName={singleBusiness.businessInfo.name}
            onImageClick={(imageUrl) => {
              setSelectedGalleryImage(imageUrl);
              setIsGalleryModalOpen(true);
            }}
          />
        </div>

        <BusinessGalleryModal
          isOpen={isGalleryModalOpen}
          onClose={() => setIsGalleryModalOpen(false)}
          businessImages={allBusinessImages}
          initialImageUrl={selectedGalleryImage}
        />

        {/* Business Info */}
        <div className="flex-1 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5 mb-2">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 break-words">
              {singleBusiness.businessInfo.name}
            </h1>
            <span className="text-teal-500 font-medium text-sm lg:text-base">
              {singleBusiness.isClaimed ? (
                <button>Claimed</button>
              ) : (
                <button
                  onClick={() => {
                    if (status === "unauthenticated") {
                      return setIsLoginModalOpen(true);
                    }
                    setIsClaimModalOpen(true);
                  }}
                >
                  Unclaimed
                </button>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-gray-600 font-medium text-sm lg:text-base">
              {averageRating}
            </span>
            <span className="text-gray-500 flex items-center space-x-2 text-sm">
              (
              <Link href={"#rating-review"}>
                <span>{singleBusiness.review.length} Reviews</span>
              </Link>
              {/* Show Google icon only if there is at least ONE Google review */}
              {hasGoogleReview && (
                <span>
                  <Image
                    src="/images/google.jpeg"
                    alt="google"
                    width={1000}
                    height={1000}
                    className="h-3 w-3 lg:h-4 lg:w-4"
                  />
                </span>
              )}
              )
            </span>
          </div>
          <div className="text-gray-600 mb-1 text-sm lg:text-base break-words">
            {singleBusiness.businessInfo.address}
          </div>
          <div className="text-gray-600 text-sm lg:text-base">
            {getTodayBusinessHours()}
          </div>
        </div>

        {/* Action Buttons - Made responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 lg:gap-5 w-full lg:w-auto mt-4 lg:mt-0">
          <button
            onClick={handleReview}
            disabled={isBusinessAccount}
            title={customerFeatureTitle}
            className="bg-[#e0f2f1] hover:bg-[#139a8e] flex items-center justify-center gap-1 lg:gap-2 px-3 lg:px-5 py-2 lg:py-3 rounded-lg text-[#139a8e] hover:text-white font-semibold text-sm lg:text-base disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#e0f2f1] disabled:hover:text-[#139a8e]"
          >
            <Star className="w-3 h-3 lg:w-4 lg:h-4" />
            <span className="truncate">Write a Review</span>
          </button>
          <button
            onClick={handleAddPhoto}
            disabled={isBusinessAccount}
            title={customerFeatureTitle}
            className="bg-[#e0f2f1] hover:bg-[#139a8e] flex items-center justify-center gap-1 lg:gap-2 px-3 lg:px-5 py-2 lg:py-3 rounded-lg text-[#139a8e] hover:text-white font-semibold text-sm lg:text-base disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#e0f2f1] disabled:hover:text-[#139a8e]"
          >
            <LocateIcon className="w-3 h-3 lg:w-4 lg:h-4" />
            <span className="truncate">Add Photo</span>
          </button>
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="bg-[#e0f2f1] hover:bg-[#139a8e] flex items-center justify-center gap-1 lg:gap-2 px-3 lg:px-5 py-2 lg:py-3 rounded-lg text-[#139a8e] hover:text-white font-semibold text-sm lg:text-base"
          >
            <Share2Icon className="w-3 h-3 lg:w-4 lg:h-4" />
            <span className="truncate">Share</span>
          </button>
          <button
            onClick={handleSaveBusiness}
            disabled={isSaving || isBusinessAccount}
            title={customerFeatureTitle}
            className="bg-[#e0f2f1] hover:bg-[#139a8e] flex items-center justify-center gap-1 lg:gap-2 px-3 lg:px-5 py-2 lg:py-3 rounded-lg text-[#139a8e] hover:text-white font-semibold text-sm lg:text-base disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#e0f2f1] disabled:hover:text-[#139a8e]"
          >
            {isSaving ? (
              <Loader2 className="w-3 h-3 lg:w-4 lg:h-4 animate-spin" />
            ) : (
              <SaveIcon className="w-3 h-3 lg:w-4 lg:h-4" />
            )}
            <span className="truncate">Save</span>
          </button>
        </div>
      </div>

      {isOpen && (
        <ReviewModal
          businessID={singleBusiness?._id}
          setIsModalOpen={setIsModalOpen}
          setIsOpen={setIsOpen}
        />
      )}

      {isModalOpen && <ReviewSubmittedModal setIsModalOpen={setIsModalOpen} />}

      {isAddPhoto && (
        <AddPhotoModal
          setIsAddPhotoOpen={setIsAddPhotoOpen}
          businessID={singleBusiness?._id}
          setPhotoSuccessModal={setPhotoSuccessModal}
        />
      )}

      {photoSuccessModal && (
        <AddPhotoSuccessModal setIsModalOpen={setPhotoSuccessModal} />
      )}

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        businessName={singleBusiness.businessInfo.name}
        businessId={singleBusiness._id}
      />

      <div className="flex flex-col lg:flex-row pt-6 lg:pt-8 pb-8 lg:pb-16 gap-8 lg:gap-0">
        {/* Left Column */}
        <div className="flex-1 lg:border-r lg:border-gray-200 lg:pr-8">
          {/* About this Business */}
          <div className="border-b border-gray-200 pb-6 lg:pb-8">
            <h2 className="text-lg lg:text-xl font-semibold mb-3 lg:mb-4">
              About this Business
            </h2>
            <p className="text-gray-700 leading-relaxed text-sm lg:text-base">
              {singleBusiness.businessInfo.description}
            </p>
          </div>

          {/* Service Type */}
          <ServiceType
            expandedSections={expandedSections}
            formatPrice={formatPrice}
            groupedServices={groupedServices}
            singleBusiness={singleBusiness}
            toggleSection={toggleSection}
          />

          {/* Rating & Reviews */}
          <section id="rating-review" className="pt-6 lg:pt-8">
            <h2 className="text-lg lg:text-xl font-semibold mb-4">
              Rating & Reviews
            </h2>

            {/* Overall Rating */}
            <div className="flex items-center gap-2 mb-4 lg:mb-6">
              <div className="text-3xl lg:text-4xl font-bold">
                <Image
                  src={"/images/Star.png"}
                  alt="star.png"
                  width={1000}
                  height={1000}
                  className="w-10 h-10 lg:w-12 lg:h-12"
                />
              </div>
              <div>
                <div>
                  <h1 className="font-bold text-xl lg:text-2xl">
                    {averageRating}
                  </h1>
                </div>
                <div className="text-xs lg:text-sm text-gray-600">
                  {singleBusiness.review.length} Reviews
                </div>
              </div>
            </div>

            {/* Star Distribution - Made responsive */}
            <div className="mb-6 lg:mb-8">
              {[5, 4, 3, 2, 1].map((star) => {
                const count =
                  starDistribution[star as keyof typeof starDistribution];
                const percentage =
                  singleBusiness.review.length > 0
                    ? (count / singleBusiness.review.length) * 100
                    : 0;

                return (
                  <div
                    key={star}
                    className="flex items-center gap-2 lg:gap-5 mb-2"
                  >
                    <div className="text-xs lg:text-sm font-medium w-12 lg:w-auto">
                      {star} Star
                    </div>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden min-w-[60px]">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs lg:text-sm text-gray-600 w-8 lg:w-12 text-right">
                      ({count})
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Search and Sort Controls - Made responsive */}
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 mb-4 lg:mb-6">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search reviews"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full text-sm lg:text-base"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="mb-1">
                <div className="text-xs lg:text-sm text-gray-600 whitespace-nowrap">
                  Sort by
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs lg:text-sm focus:outline-none bg-transparent border-none w-full sm:w-auto"
                >
                  <option value="mostRecent">Most Recent</option>
                  <option value="highestRated">Highest Rated</option>
                  <option value="lowestRated">Lowest Rated</option>
                </select>
              </div>
            </div>

            {/* Reviews List */}
            {filteredReviews.length === 0 ? (
              <div className="text-center py-6 lg:py-8 text-gray-500 text-sm lg:text-base">
                {searchQuery
                  ? "No reviews match your search."
                  : "No reviews yet. Be the first to leave a review!"}
              </div>
            ) : (
              <div className="space-y-3 lg:space-y-4">
                {filteredReviews.map((review) => (
                  <ReviewItem key={review._id} review={review} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column - Made responsive */}
        <div className="space-y-6 lg:space-y-8 lg:w-[400px] xl:w-[450px] lg:pl-8">
          {/* Contact Info */}
          <ContactInfo
            singleBusiness={singleBusiness}
            handleMessage={handleMessage}
          />

          {/* Working Hours */}
          <WorkingHours
            singleBusiness={singleBusiness}
            formatTime={formatTime}
          />

          {/* location */}
          <Location
            singleBusiness={singleBusiness}
            SetMapView={SetMapView}
            coords={coords}
            customMarker={customMarker}
          />
        </div>

        {isLoginModalOpen && (
          <LoginModal
            isLoginModalOpen={isLoginModalOpen}
            setIsLoginModalOpen={setIsLoginModalOpen}
          />
        )}

        {isClaimModalOpen && (
          <ClaimModal
            isClaimModalOpen={isClaimModalOpen}
            setIsClaimModalOpen={setIsClaimModalOpen}
            id={singleBusiness?._id}
          />
        )}
      </div>
    </div>
  );
};

export default BusinessDetails;
