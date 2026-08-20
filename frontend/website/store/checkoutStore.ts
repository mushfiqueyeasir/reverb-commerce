import { create } from "zustand";
import { persist } from "zustand/middleware";
import { deliveryZoneForCity, isKnownBangladeshCity } from "@/lib/bangladesh";

export interface CheckoutFormData {
  emailOrPhone: string;
  emailNews: boolean;
  country: string;
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  phoneCode: string;
  phone: string;
  saveInfo: boolean;
  shippingMethod: "inside-dhaka" | "outside-dhaka";
  paymentMethod: "cod" | "bkash";
  billingAddress: "same" | "different";
  billingFullName?: string;
  billingAddressLine?: string;
  billingCity?: string;
  billingPostalCode?: string;
  discountCode: string;
}

export type AppliedPromo = {
  code: string;
  percent: number;
};

interface SavedDeliveryInfo {
  country: string;
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  phoneCode: string;
  phone: string;
}

interface CheckoutStore {
  formData: CheckoutFormData;
  appliedPromo: AppliedPromo | null;
  updateFormData: (data: Partial<CheckoutFormData>) => void;
  setAppliedPromo: (promo: AppliedPromo | null) => void;
  resetFormData: () => void;
  saveDeliveryInfo: () => void;
  loadSavedDeliveryInfo: () => void;
}

const defaultFormData: CheckoutFormData = {
  emailOrPhone: "",
  emailNews: false,
  country: "Bangladesh",
  fullName: "",
  address: "",
  city: "",
  postalCode: "",
  phoneCode: "+880",
  phone: "",
  saveInfo: false,
  shippingMethod: "inside-dhaka",
  paymentMethod: "cod",
  billingAddress: "same",
  discountCode: "",
};

const SAVED_DELIVERY_KEY = "saved-delivery-info";

export const useCheckoutStore = create<CheckoutStore>()(
  persist(
    (set, get) => ({
      formData: defaultFormData,
      appliedPromo: null,

      updateFormData: (data) => {
        set((state) => {
          const next = { ...state.formData, ...data };
          if (data.city) {
            next.shippingMethod = deliveryZoneForCity(data.city);
          }
          return { formData: next };
        });
      },

      setAppliedPromo: (promo) => {
        set((state) => ({
          appliedPromo: promo,
          formData: {
            ...state.formData,
            discountCode: promo?.code ?? state.formData.discountCode,
          },
        }));
      },

      resetFormData: () => {
        set({ formData: defaultFormData, appliedPromo: null });
      },

      saveDeliveryInfo: () => {
        const { formData } = get();
        if (formData.saveInfo) {
          const deliveryInfo: SavedDeliveryInfo = {
            country: formData.country,
            fullName: formData.fullName,
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
            phoneCode: formData.phoneCode,
            phone: formData.phone,
          };
          if (typeof window !== "undefined") {
            localStorage.setItem(
              SAVED_DELIVERY_KEY,
              JSON.stringify(deliveryInfo),
            );
          }
        }
      },

      loadSavedDeliveryInfo: () => {
        if (typeof window !== "undefined") {
          const saved = localStorage.getItem(SAVED_DELIVERY_KEY);
          if (saved) {
            try {
              const deliveryInfo: SavedDeliveryInfo = JSON.parse(saved);
              set((state) => {
                const city = isKnownBangladeshCity(deliveryInfo.city)
                  ? deliveryInfo.city
                  : "";
                return {
                  formData: {
                    ...state.formData,
                    ...deliveryInfo,
                    city,
                    shippingMethod: city
                      ? deliveryZoneForCity(city)
                      : state.formData.shippingMethod,
                    phoneCode: deliveryInfo.phoneCode || "+880",
                    saveInfo: true,
                  },
                };
              });
            } catch {}
          }
        }
      },
    }),
    {
      name: "checkout-storage",
    },
  ),
);
