/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState } from "react";
import BusinessHours from "../BusinessHours";
import BusinessInform from "../BusinessInform";
import Service from "../Service";
import { useMutation, useQuery } from "@tanstack/react-query";
import { addBusiness, getAllInstrument, updateBusiness } from "@/lib/api";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useBusinessContext } from "@/lib/business-context";
import axios from "axios";
import LoginModal from "../modal/login-modal";
import BusinessSuccessModal from "../modal/bussiness-success-modal";
import LogOutBusinessSuccessModal from "../modal/log-out-business-success-modal";
import TrackSubmissionModal from "../modal/track-submission-modal";

interface Error {
  businessName?: string;
  addressName?: string;
  description?: string;
  phoneNumber?: string;
  email?: string;
  images?: string;
}

interface ServiceType {
  newInstrumentName: string;
  pricingType: string;
  minPrice: string | null;
  maxPrice: string | null;
  price: string | null;
  selectedInstrumentsGroup?: string;
  instrumentFamily?: string;
  selectedInstrumentsGroupMusic?: string;
}

interface SelectedInstrumentPayload {
  instrumentName: string;
  instrumentFamily: string;
}

type OptionKey = "buy" | "sell" | "trade" | "rent" | "music";

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const defaultTime = {
  startTime: "09:00",
  startMeridiem: "AM",
  endTime: "05:00",
  endMeridiem: "PM",
};

const AddBusiness = () => {
  const session = useSession();
  const isLoggedIn = session?.status;
  const userEmail = session?.data?.user?.email;
  const pathName = usePathname();

  const { selectedBusinessId } = useBusinessContext();

  // modal control
  const [serviceModal, setServiceModal] = useState(false);
  const [instrumentFamily, setInstrumentFamily] = useState<string>("");
  const [ServiceModalMusic, setServiceModalMusic] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isBusinessSuccessModalOpen, setIsBusinessSuccessModalOpen] =
    useState(false);
  const [
    isLogoutBusinessSuccessModalOpen,
    setIsLogoutBusinessSuccessModalOpen,
  ] = useState(false);
  const [isTrackSubmissionModalOpen, setIsTrackSubmissionModalOpen] =
    useState(false);

  const [logOutEmail, setLogOutEmail] = useState("");

  // control instrument family
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [selectedInstrumentsMusic, setSelectedInstrumentsMusic] = useState<
    string[]
  >([]);

  //control selected instrument group
  const [selectedInstrumentsGroup, setSelectedInstrumentsGroup] = useState("");
  const [selectedInstrumentsGroupMusic, setSelectedInstrumentsGroupMusic] =
    useState<string>("");

  //service Modal related
  const [newInstrumentName, setNewInstrumentName] = useState("");
  const [pricingType, setPricingType] = useState("exact");
  const [price, setPrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selected, setSelected] = useState<ServiceType[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<ServiceType[]>([]);

  const [error, setError] = useState<Error>({
    businessName: "",
    addressName: "",
    description: "",
    phoneNumber: "",
    email: "",
  });

  const handleAddInstrument = () => {
    setSelected((prev) => [
      ...prev,
      {
        newInstrumentName: newInstrumentName,
        pricingType: pricingType,
        price: price,
        minPrice: minPrice,
        maxPrice: maxPrice,
        selectedInstrumentsGroup: selectedInstrumentsGroup,
        instrumentFamily: instrumentFamily,
      },
    ]);
    setNewInstrumentName("");
    setPricingType("");
    setPrice("");
    setMinPrice("");
    setMaxPrice("");

    setServiceModal(false);
  };

  const handleAddInstrumentMusic = () => {
    setSelectedMusic((prev) => [
      ...prev,
      {
        newInstrumentName: newInstrumentName,
        pricingType: pricingType,
        price: price,
        minPrice: minPrice,
        maxPrice: maxPrice,
        selectedInstrumentsGroupMusic: selectedInstrumentsGroupMusic,
        instrumentFamily: instrumentFamily,
      },
    ]);
    setNewInstrumentName("");
    setPricingType("");
    setPrice("");
    setMinPrice("");
    setMaxPrice("");

    setServiceModalMusic(false);
  };

  const { data: allInstrument } = useQuery({
    queryKey: ["get-all-instrument"],
    queryFn: async () => {
      const res = await getAllInstrument();
      return res?.data;
    },
  });

  const getInstrumentFamilyByName = (instrumentName?: string) => {
    if (!instrumentName) return "";

    return (
      allInstrument?.find((group: any) =>
        group.instrumentTypes?.some(
          (instrument: any) => instrument.type === instrumentName,
        ),
      )?.instrumentFamily || ""
    );
  };

  const buildServicesPayload = () => {
    const activeInstruments = new Set(selectedInstruments);
    const servicesPayload: ServiceType[] = selected
      .filter((service) => {
        const group = service.selectedInstrumentsGroup;
        return group && activeInstruments.has(group);
      })
      .map((service) => ({
        ...service,
        instrumentFamily:
          service.instrumentFamily ||
          getInstrumentFamilyByName(service.selectedInstrumentsGroup),
      }));

    return servicesPayload.map((service) => ({
      newInstrumentName: service.newInstrumentName,
      pricingType: service.pricingType,
      price: service.price,
      minPrice: service.minPrice,
      maxPrice: service.maxPrice,
      selectedInstrumentsGroup: service.selectedInstrumentsGroup,
      instrumentFamily: service.instrumentFamily,
    }));
  };

  const buildSelectedInstrumentsPayload = (): SelectedInstrumentPayload[] =>
    selectedInstruments.map((instrument) => ({
      instrumentName: instrument,
      instrumentFamily: getInstrumentFamilyByName(instrument),
    }));

  const buildMusicLessonsPayload = () => {
    const lessonsByGroup = new Map(
      selectedMusic
        .filter((lesson) => lesson.selectedInstrumentsGroupMusic)
        .map((lesson) => [
          lesson.selectedInstrumentsGroupMusic as string,
          lesson,
        ]),
    );

    return selectedInstrumentsMusic.map((instrument) => {
      const existingLesson = lessonsByGroup.get(instrument);

      return {
        newInstrumentName:
          existingLesson?.newInstrumentName || `${instrument} Lessons`,
        pricingType: existingLesson?.pricingType || "hourly",
        price: existingLesson?.price ?? "",
        minPrice: existingLesson?.minPrice ?? "",
        maxPrice: existingLesson?.maxPrice ?? "",
        selectedInstrumentsGroupMusic: instrument,
        instrumentFamily:
          existingLesson?.instrumentFamily ||
          getInstrumentFamilyByName(instrument),
      };
    });
  };

  // buy / cell/ trade / rent related state
  const [selectedOptions, setSelectedOptions] = useState<
    Record<OptionKey, boolean>
  >({
    buy: false,
    sell: false,
    trade: false,
    rent: false,
    music: false,
  });

  //business hour
  const [businessHours, setBusinessHours] = React.useState(
    daysOfWeek.map((day) => ({
      day,
      enabled: false,
      ...defaultTime,
    })),
  );

  //get single Business by selected ID
  const {
    data: singleBusiness = {},
    // isLoading,
    refetch,
  } = useQuery({
    queryKey: ["get-single-business", selectedBusinessId],
    queryFn: async () => {
      const res = await axios(
        `${process.env.NEXT_PUBLIC_API_URL}/business/${selectedBusinessId}`,
      );
      return res?.data?.data;
    },
  });

  //all services here
  const allServices = singleBusiness?.services;
  const musicLessons = singleBusiness?.musicLessons;
  const businessHoursEnables = singleBusiness?.businessHours;

  //business information related
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]); // ✅ NEW: Store actual File objects
  const [businessName, setBusinessName] = useState("");
  const [addressName, setAddressName] = useState("");
  const [description, setDescription] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  // ✅ FIXED: Handle file change to accumulate files
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Convert FileList to array
    const newFiles = Array.from(files);

    // Create preview URLs for new images
    const newImageUrls = newFiles.map((file) => URL.createObjectURL(file));

    // ✅ Append new images to existing ones
    setImages((prev) => [...prev, ...newImageUrls]);

    // ✅ Store actual file objects
    setImageFiles((prev) => [...prev, ...newFiles]);

    // Clear any existing image error
    setError((prev) => ({ ...prev, images: "" }));

    // Reset input value to allow uploading the same files again
    e.target.value = "";
  };

  const handleUploadImage = () => {
    const input = document.getElementById("image_input");
    if (input) {
      input.click();
    }
  };

  // ✅ FIXED: Remove image properly
  const handleRemoveImage = (index: number) => {
    // Clean up object URL to prevent memory leaks
    URL.revokeObjectURL(images[index]);

    // Remove from preview
    setImages((prev) => prev.filter((_, i) => i !== index));

    // Remove from file storage
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handelOkay = () => {
    setIsTrackSubmissionModalOpen(true);
    setIsLogoutBusinessSuccessModalOpen(false);
  };

  //post form data
  const { mutateAsync: addBusinessData, isPending } = useMutation({
    mutationKey: ["add-business"],
    mutationFn: async (data: FormData) => {
      const addMyBusinessPaths = [
        "/add-my-business",
        "/business-dashboard/add-my-business",
      ];
      const queryType = addMyBusinessPaths.includes(pathName)
        ? "myBusiness"
        : "addABusiness";

      const res = await addBusiness(data, queryType);
      if (!res.success) {
        throw new Error(
          res.response.data.message || "Business creation failed",
        );
      }
      return res;
    },
    onSuccess: () => {
      return pathName === "/add-my-business" ||
        pathName === "/business-dashboard/add-my-business"
        ? setIsBusinessSuccessModalOpen(true)
        : pathName === "/add-a-business" && isLoggedIn === "authenticated"
          ? setIsBusinessSuccessModalOpen(true)
          : setIsLogoutBusinessSuccessModalOpen(false);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(error?.message || "Failed to add business!");
    },
  });

  const validateForm = () => {
    const newErrors: Error = {};

    if (!businessName.trim()) {
      newErrors.businessName = "Business name is required";
    }

    if (!addressName.trim()) {
      newErrors.addressName = "Address is required";
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    }

    if (imageFiles.length === 0) {
      newErrors.images = "At least one business photo is required";
    }

    setError(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ✅ Helper function to prepare FormData with images
  const prepareFormData = (additionalData: any = {}) => {
    const formData = new FormData();

    // ✅ Append all accumulated image files
    imageFiles.forEach((file) => {
      formData.append("image", file);
    });

    const businessData = {
      businessInfo: {
        name: businessName,
        address: addressName,
        description,
        phone: phoneNumber,
        email,
        website,
        image: images, // Store preview URLs for display
      },
      selectedInstruments: buildSelectedInstrumentsPayload(),
      services: buildServicesPayload(),
      musicLessons: buildMusicLessonsPayload(),
      businessHours: businessHours.map((hour) => ({
        day: hour.day,
        startTime: hour.startTime,
        startMeridiem: hour.startMeridiem,
        endTime: hour.endTime,
        endMeridiem: hour.endMeridiem,
        enabled: hour.enabled,
      })),
      buyInstruments: selectedOptions.buy,
      sellInstruments: selectedOptions.sell,
      tradeInstruments: selectedOptions?.trade,
      rentInstruments: selectedOptions?.rent,
      isMusicLessons: selectedOptions?.music,
      offerMusicLessons: selectedInstrumentsMusic.length > 0,
      status: "pending",
      isVerified: false,
      ...additionalData,
    };

    formData.append("data", JSON.stringify(businessData));
    return formData;
  };

  //post form data - ✅ FIXED
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoggedIn === "unauthenticated") {
      return setIsLoginModalOpen(true);
    }

    const isValid = validateForm();
    if (!isValid) return;

    const formData = prepareFormData();
    await addBusinessData(formData);
  };

  // ✅ FIXED: Add a business submission
  const handleAddABusinessSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    console.log("clicked when add a business");
    e.preventDefault();

    const isValid = validateForm();
    if (!isValid) return;

    const formData = prepareFormData({ email: userEmail || "" });
    await addBusinessData(formData);
  };

  // ✅ FIXED: Log out submission
  const handleLogOutSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    console.log("clicked when log out");
    e.preventDefault();

    const isValid = validateForm();
    if (!isValid) return;

    const formData = prepareFormData({ email: logOutEmail });
    await addBusinessData(formData);
  };

  const handleLogOutSubmitModalOpen = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const isValid = validateForm();
    if (!isValid) return;
    setIsLogoutBusinessSuccessModalOpen(true);
  };

  //update form data - ✅ FIXED
  const { mutateAsync: updateBusinessData, isPending: isUpdating } =
    useMutation({
      mutationKey: ["update-business"],
      mutationFn: async ({
        id,
        formData,
      }: {
        id: string;
        formData: FormData;
      }) => {
        const res = await updateBusiness(id, formData);
        if (!res.success) {
          throw new Error(res.error || "Business update failed");
        }
        return res;
      },
      onSuccess: () => {
        toast.success("Business updated successfully!");
        refetch();
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (error: any) => {
        toast.error(error?.message || "Failed to update business!");
      },
    });

  // ✅ FIXED: Handle update with accumulated images
  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedBusinessId) return toast.error("Business ID missing!");

    const formData = new FormData();

    // ✅ Append all accumulated image files
    imageFiles.forEach((file) => {
      formData.append("image", file);
    });

    const businessData = {
      businessInfo: {
        name: businessName,
        address: addressName,
        description,
        phone: phoneNumber,
        email,
        website,
        image: images, // Store preview URLs
      },
      selectedInstruments: buildSelectedInstrumentsPayload(),
      services: buildServicesPayload(),
      musicLessons: buildMusicLessonsPayload(),
      businessHours: businessHours.map((hour) => ({
        day: hour.day,
        startTime: hour.startTime,
        startMeridiem: hour.startMeridiem,
        endTime: hour.endTime,
        endMeridiem: hour.endMeridiem,
        enabled: hour.enabled,
      })),
      buyInstruments: selectedOptions.buy,
      sellInstruments: selectedOptions.sell,
      tradeInstruments: selectedOptions.trade,
      rentInstruments: selectedOptions.rent,
      isMusicLessons: selectedOptions.music,
      offerMusicLessons: selectedInstrumentsMusic.length > 0,
    };

    formData.append("data", JSON.stringify(businessData));

    await updateBusinessData({ id: selectedBusinessId, formData });
  };

  // show all data initially
  useEffect(() => {
    if (
      pathName === "/business-dashboard/profile" &&
      singleBusiness?.businessInfo
    ) {
      //business info
      setBusinessName(singleBusiness.businessInfo.name || "");
      setAddressName(singleBusiness.businessInfo.address || "");
      setDescription(singleBusiness.businessInfo.description || "");
      setPhoneNumber(singleBusiness.businessInfo.phone || "");
      setEmail(singleBusiness.businessInfo.email || "");
      setWebsite(singleBusiness.businessInfo.website || "");
      if (singleBusiness.businessInfo.image) {
        setImages(singleBusiness.businessInfo.image);
        // Note: For existing images, we don't have File objects, only URLs
        // This is fine for display, but new uploads will be handled separately
      }

      // Set selected instruments from the dedicated field, with old data fallback.
      const selectedGroups =
        singleBusiness.selectedInstruments?.length > 0
          ? singleBusiness.selectedInstruments
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((item: any) => item?.instrumentName)
              .filter(Boolean)
          : allServices
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((item: any) => item?.selectedInstrumentsGroup)
              .filter(Boolean);

      setSelectedInstruments(selectedGroups);

      const selectedMusicGroups = musicLessons
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((item: any) => item?.selectedInstrumentsGroupMusic)
        .filter(Boolean);
      setSelectedInstrumentsMusic(selectedMusicGroups);

      if (businessHoursEnables && Array.isArray(businessHoursEnables)) {
        const updatedHours = daysOfWeek.map((day) => {
          const found = businessHoursEnables.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (item: any) => item.day === day,
          );
          return found
            ? {
                day: found.day,
                enabled: found.enabled,
                startTime: found.startTime || defaultTime.startTime,
                startMeridiem: found.startMeridiem || defaultTime.startMeridiem,
                endTime: found.endTime || defaultTime.endTime,
                endMeridiem: found.endMeridiem || defaultTime.endMeridiem,
              }
            : {
                day,
                enabled: false,
                ...defaultTime,
              };
        });

        setBusinessHours(updatedHours);
      }

      if (singleBusiness) {
        setSelectedOptions({
          buy: singleBusiness?.buyInstruments || false,
          sell: singleBusiness?.sellInstruments || false,
          trade: singleBusiness?.tradeInstruments || false,
          rent: singleBusiness?.rentInstruments || false,
          music: singleBusiness?.isMusicLessons || false,
        });
      }

      // Set services for instrument pricing list
      if (singleBusiness?.services?.length > 0) {
        setSelected(singleBusiness.services);

        // Extract all unique instrument group names from services
        const instrumentGroups = singleBusiness.services.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (s: any) => s.selectedInstrumentsGroup,
        );

        // Prefill selected instruments for old businesses that do not have the
        // dedicated selectedInstruments field yet.
        if (!singleBusiness.selectedInstruments?.length) {
          setSelectedInstruments(instrumentGroups);
        }

        // Set the first instrument group as selected for pricing list view
        setSelectedInstrumentsGroup(instrumentGroups[0]);
      }

      if (singleBusiness?.musicLessons?.length > 0) {
        setSelectedMusic(singleBusiness.musicLessons);

        const musicGroups = singleBusiness.musicLessons.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (s: any) => s.selectedInstrumentsGroupMusic,
        );

        setSelectedInstrumentsMusic(musicGroups);
        setSelectedInstrumentsGroupMusic(musicGroups[0]);
      }
    }
  }, [
    singleBusiness,
    pathName,
    allServices,
    musicLessons,
    businessHoursEnables,
  ]);

  return (
    <div>
      <form
        onSubmit={
          pathName === "/business-dashboard/profile"
            ? handleUpdate
            : pathName === "/add-my-business" ||
                pathName === "/business-dashboard/add-my-business"
              ? handleSubmit
              : isLoggedIn === "authenticated" && pathName === "/add-a-business"
                ? handleAddABusinessSubmit
                : handleLogOutSubmitModalOpen
        }
      >
        {/* business information */}
        <div>
          <div>
            <h1 className="text-[28px] font-semibold">
              1. Business Information
            </h1>
            <p className="text-[#485150] text-[16px]">
              Complete the following fields to provide key details about the
              business
            </p>
          </div>

          <BusinessInform
            website={website}
            email={email}
            phoneNumber={phoneNumber}
            description={description}
            addressName={addressName}
            businessName={businessName}
            handleFileChange={handleFileChange}
            handleUploadImage={handleUploadImage}
            images={images}
            handleRemoveImage={handleRemoveImage}
            setAddressName={setAddressName}
            setBusinessName={setBusinessName}
            setDescription={setDescription}
            setEmail={setEmail}
            setPhoneNumber={setPhoneNumber}
            setWebsite={setWebsite}
            error={error}
            setError={setError}
          />
        </div>

        {/* divider */}
        <div className=" border-b border-gray-200 pt-12"></div>

        {/* services offered */}
        <div className="pt-10">
          <Service
            allInstrument={allInstrument}
            serviceModal={serviceModal}
            setServiceModal={setServiceModal}
            serviceModalMusic={ServiceModalMusic}
            setServiceModalMusic={setServiceModalMusic}
            selectedInstruments={selectedInstruments}
            setSelectedInstruments={setSelectedInstruments}
            selectedInstrumentsMusic={selectedInstrumentsMusic}
            setSelectedInstrumentsMusic={setSelectedInstrumentsMusic}
            selectedInstrumentsGroup={selectedInstrumentsGroup}
            setSelectedInstrumentsGroup={setSelectedInstrumentsGroup}
            selectedInstrumentsGroupMusic={selectedInstrumentsGroupMusic}
            setSelectedInstrumentsGroupMusic={setSelectedInstrumentsGroupMusic}
            newInstrumentName={newInstrumentName}
            setNewInstrumentName={setNewInstrumentName}
            pricingType={pricingType}
            setPricingType={setPricingType}
            price={price}
            setPrice={setPrice}
            handleAddInstrument={handleAddInstrument}
            handleAddInstrumentMusic={handleAddInstrumentMusic}
            minPrice={minPrice}
            setMinPrice={setMinPrice}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            selected={selected}
            setSelected={setSelected}
            selectedMusic={selectedMusic}
            setSelectedMusic={setSelectedMusic}
            selectedOptions={selectedOptions}
            setSelectedOptions={setSelectedOptions}
            setInstrumentFamily={setInstrumentFamily}
          />
        </div>

        {/* divider */}
        <div className=" border-b border-gray-200 pt-12"></div>

        {/* Business Hours */}
        <div className="pt-10">
          <div>
            <h1 className="text-[28px] font-semibold">3. Business Hours</h1>
            <p className="text-[#485150] text-[16px]">
              Let your customers know when your shop is open throughout the week
            </p>
          </div>

          <div>
            <BusinessHours
              businessHours={businessHours}
              setBusinessHours={setBusinessHours}
            />
          </div>
        </div>

        {/* divider */}
        <div className=" border-b border-gray-200 pt-12"></div>

        {/* Submit for Verification */}
        <div className="pt-10">
          <div>
            <h1 className="text-[28px] font-semibold">
              4. Submit for Verification
            </h1>
            <p className="text-[#485150] text-[16px]">
              Once you’ve filled out all the information (business details,
              instrument families, services, and pricing), click{" "}
              <strong>Submit</strong> to send the business details for
              verification.
            </p>

            <ul className=" list-disc text-[#485150] text-[16px] ml-5">
              <li>
                Your submission will be reviewed by the admin team for accuracy
                and completeness.
              </li>
              <li>
                You’ll receive an email notification once the business is
                approved and listed on the website.
              </li>
            </ul>
          </div>
        </div>

        {/* submit button */}
        <div className="pt-10 text-center">
          {pathName === "/business-dashboard/profile" ? (
            <button
              type="submit"
              className={`flex-1 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition w-[228px] h-[48px] ${
                isUpdating && "opacity-70"
              }`}
            >
              {isUpdating ? (
                <span className="flex items-center justify-center">
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </span>
              ) : (
                "Update"
              )}
            </button>
          ) : (
            <button
              type="submit"
              className={`flex-1 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition w-[228px] h-[48px] ${
                isPending && "opacity-70"
              }`}
            >
              {isLoggedIn === "authenticated" && isPending ? (
                <span className="flex items-center justify-center">
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </span>
              ) : (
                "Submit"
              )}
            </button>
          )}
        </div>
      </form>

      {isLoginModalOpen && (
        <LoginModal
          isLoginModalOpen={isLoginModalOpen}
          setIsLoginModalOpen={setIsLoginModalOpen}
        />
      )}

      {isBusinessSuccessModalOpen && (
        <BusinessSuccessModal
          isBusinessSuccessModalOpen={isBusinessSuccessModalOpen}
          setIsBusinessSuccessModalOpen={setIsBusinessSuccessModalOpen}
        />
      )}

      {isLogoutBusinessSuccessModalOpen && (
        <LogOutBusinessSuccessModal
          isLogoutBusinessSuccessModalOpen={isLogoutBusinessSuccessModalOpen}
          setIsLogoutBusinessSuccessModalOpen={
            setIsLogoutBusinessSuccessModalOpen
          }
          handelOkay={handelOkay}
          handleLogOutSubmit={handleLogOutSubmit}
          setLogOutEmail={setLogOutEmail}
          logOutEmail={logOutEmail}
          isPending={isPending}
        />
      )}

      {isTrackSubmissionModalOpen && (
        <TrackSubmissionModal
          isModalOpen={isTrackSubmissionModalOpen}
          setIsModalOpen={setIsTrackSubmissionModalOpen}
        />
      )}
    </div>
  );
};

export default AddBusiness;
