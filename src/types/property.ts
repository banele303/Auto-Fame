export type PropertyType = 'APARTMENT' | 'HOUSE' | 'CONDO' | 'TOWNHOUSE';

export interface Location {
  id: number;
  address: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  coordinates?: {
    longitude: number;
    latitude: number;
  };
}

export interface Property {
  id: number;
  name: string;
  description?: string;
  propertyType: PropertyType;
  photoUrls: string[];
  images?: string[];      // Added images property
  beds: number;
  baths: number;
  squareFeet: number;
  pricePerMonth?: number; // Make this optional
  price?: number;        // Add alternative field name
  priceUnit?: string;
  securityDeposit?: number;
  isPetsAllowed: boolean;
  isParkingIncluded: boolean;
  isNsfassAccredited: boolean;
  amenities?: string[];
  highlights?: string[];
  averageRating?: number;
  numberOfReviews?: number;
  managerCognitoId: string;
  location: Location;
  locationId: number;
  createdAt: string;
  updatedAt: string;
} 