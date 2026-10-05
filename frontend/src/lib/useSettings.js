import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL, FB_LINK } from "./site";

export const DEFAULT_SETTINGS = {
  studio_address: "Narra St. Victoria Pelayo, Brgy Centro Agdao, Davao City",
  service_area: "Davao City studio & doorstep — all over the Philippines",
  instagram: "https://instagram.com/irsmakup",
  pinterest: "https://pinterest.com/irsmakup",
  youtube: "https://youtube.com/@irsmakup",
  facebook: FB_LINK,
};

export const mapEmbedUrl = (address) =>
  `https://www.google.com/maps?q=${encodeURIComponent(address)}&z=16&output=embed`;

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/settings`)
      .then(({ data }) => setSettings({ ...DEFAULT_SETTINGS, ...data }))
      .catch(() => {});
  }, []);

  return settings;
}
