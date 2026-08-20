import type { DeliveryZone } from "./delivery";

export const BANGLADESH_CITIES: string[] = [
  "Dhaka",
  "Faridpur",
  "Gazipur",
  "Gopalganj",
  "Kishoreganj",
  "Madaripur",
  "Manikganj",
  "Munshiganj",
  "Narayanganj",
  "Narsingdi",
  "Rajbari",
  "Shariatpur",
  "Tangail",
  "Bandarban",
  "Brahmanbaria",
  "Chandpur",
  "Chattogram",
  "Cumilla",
  "Cox's Bazar",
  "Feni",
  "Khagrachhari",
  "Lakshmipur",
  "Noakhali",
  "Rangamati",
  "Bogura",
  "Chapai Nawabganj",
  "Joypurhat",
  "Naogaon",
  "Natore",
  "Pabna",
  "Rajshahi",
  "Sirajganj",
  "Bagerhat",
  "Chuadanga",
  "Jashore",
  "Jhenaidah",
  "Khulna",
  "Kushtia",
  "Magura",
  "Meherpur",
  "Narail",
  "Satkhira",
  "Barguna",
  "Barishal",
  "Bhola",
  "Jhalokati",
  "Patuakhali",
  "Pirojpur",
  "Dinajpur",
  "Gaibandha",
  "Kurigram",
  "Lalmonirhat",
  "Nilphamari",
  "Panchagarh",
  "Rangpur",
  "Thakurgaon",
  "Habiganj",
  "Moulvibazar",
  "Sunamganj",
  "Sylhet",
  "Jamalpur",
  "Mymensingh",
  "Netrokona",
  "Sherpur",
];

const CITY_SET = new Set(BANGLADESH_CITIES.map((city) => city.toLowerCase()));

export function isKnownBangladeshCity(value: string): boolean {
  return CITY_SET.has(value.trim().toLowerCase());
}

export function deliveryZoneForCity(city: string): DeliveryZone {
  return city.trim().toLowerCase() === "dhaka"
    ? "inside-dhaka"
    : "outside-dhaka";
}
