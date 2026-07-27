import { create } from "zustand";

interface TagType {
  label: string;
}

interface IFilterStore {
  familyTag: TagType[];
  setFamilyTag: (value: string) => void;
  removeFamilyTag: (value: string) => void;
  instrumentTag: TagType[];
  setInstrumentTag: (value: string) => void;
  removeInstrumentTag: (value: string) => void;
  serviceTag: TagType[];
  setServiceTag: (value: string) => void;
  removeServiceTag: (value: string) => void;
  offersTag: TagType[];
  setOffersTag: (value: string) => void;
  removeOffersTag: (value: string) => void;
  minPriceRange: string;
  setMinPriceRange: (value: string) => void;
  maxPriceRange: string;
  setMaxPriceRange: (value: string) => void;
  offers: boolean;
  setOffers: (value: boolean) => void;
  open: boolean;
  setOpen: (value: boolean) => void;
  sort: string;
  setSort: (value: string) => void;
  search: string;
  setSearch: (value: string) => void;
  selectInstrument: boolean;
  setSelectInstrument: (value: boolean) => void;
  selectService: boolean;
  setSelectService: (value: boolean) => void;
  instrument: string;
  setInstrument: (value: string) => void;
  service: string;
  setService: (value: string) => void;
}

const initialState: Pick<
  IFilterStore,
  | "familyTag"
  | "instrumentTag"
  | "serviceTag"
  | "offersTag"
  | "minPriceRange"
  | "offers"
  | "maxPriceRange"
  | "open"
  | "sort"
  | "search"
  | "selectInstrument"
  | "selectService"
  | "instrument"
  | "service"
> = {
  familyTag: [],
  instrumentTag: [],
  serviceTag: [],
  offersTag: [],
  minPriceRange: "",
  offers: false,
  maxPriceRange: "",
  open: false,
  sort: "default",
  search: "",
  selectInstrument: false,
  selectService: false,
  instrument: "",
  service: "",
};

export const useFilterStore = create<IFilterStore>((set) => ({
  ...initialState,
  setFamilyTag: (value) =>
    set(() => ({
      familyTag: [{ label: value }],
      instrumentTag: [],
      serviceTag: [],
      offersTag: [],
      selectInstrument: true,
      selectService: false,
      instrument: value,
      service: "",
    })),
  removeFamilyTag: (value) =>
    set((state) => ({
      familyTag: state.familyTag.filter((t) => t.label !== value),
      instrumentTag: [],
      serviceTag: [],
      offersTag: [],
      selectInstrument: false,
      selectService: false,
      instrument: "",
      service: "",
    })),
  setInstrumentTag: (value) =>
    set(() => ({
      instrumentTag: [{ label: value }],
      serviceTag: [],
      offersTag: [],
      selectService: true,
      service: value,
    })),
  removeInstrumentTag: (value) =>
    set((state) => ({
      instrumentTag: state.instrumentTag.filter((t) => t.label !== value),
      serviceTag: [],
      offersTag: [],
      selectService: false,
      service: "",
    })),
  setServiceTag: (value) =>
    set(() => ({
      serviceTag: [{ label: value }],
      offersTag: [],
    })),
  removeServiceTag: (value) =>
    set((state) => ({
      serviceTag: state.serviceTag.filter((t) => t.label !== value),
      offersTag: [],
    })),
  // Updated to support multiple offers tags
  setOffersTag: (value) =>
    set((state) => ({
      offersTag: state.offersTag.some((tag) => tag.label === value)
        ? state.offersTag
        : [...state.offersTag, { label: value }],
    })),
  removeOffersTag: (value) =>
    set((state) => ({
      offersTag: state.offersTag.filter((t) => t.label !== value),
    })),
  setMinPriceRange: (value) => {
    set({ minPriceRange: value });
  },
  setMaxPriceRange: (value) => {
    set({ maxPriceRange: value });
  },
  setOffers: (value) => {
    set({ offers: value });
  },
  setOpen: (value) => {
    set({ open: value });
  },
  setSort: (value) => {
    set({
      sort: value,
    });
  },
  setSearch: (value) => {
    set({
      search: value,
    });
  },
  setSelectInstrument: (value) => {
    set({
      selectInstrument: value,
    });
  },
  setSelectService: (value) => {
    set({
      selectService: value,
    });
  },
  setInstrument: (value) => {
    set({
      instrument: value,
    });
  },
  setService: (value) => {
    set({
      service: value,
    });
  },
}));
