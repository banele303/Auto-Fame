import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface FiltersState {
  location?: string;
  make?: string;
  model?: string;
  year?: string;
  carType?: string;
  fuelType?: string;
  transmission?: string;
  condition?: string;
  features?: string[];
  priceRange?: string;
  mileageRange?: [number, number] | [null, null];
  coordinates?: [number, number];
  searchQuery?: string;
}

interface InitialStateTypes {
  filters: FiltersState;
  isFiltersFullOpen: boolean;
  viewMode: "grid" | "list";
}

export const initialState: InitialStateTypes = {
  filters: {
    location: "johannesburg",
    make: "",
    model: "",
    year: "",
    carType: "",
    fuelType: "",
    transmission: "",
    condition: "",
    features: [],
    priceRange: "",
    mileageRange: [null, null],
    coordinates: [28.0473, -26.2041], // Johannesburg coordinates
  },
  isFiltersFullOpen: false,
  viewMode: "grid",
};

export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<FiltersState>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    toggleFiltersFullOpen: (state) => {
      state.isFiltersFullOpen = !state.isFiltersFullOpen;
    },
    setViewMode: (state, action: PayloadAction<"grid" | "list">) => {
      state.viewMode = action.payload;
    },
  },
});

export const { setFilters, toggleFiltersFullOpen, setViewMode } =
  globalSlice.actions;

export default globalSlice.reducer;
