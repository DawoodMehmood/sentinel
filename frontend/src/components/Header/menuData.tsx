import { Menu } from "@/types/menu";

const menuData: Menu[] = [
  {
    id: 1,
    title: "Home",
    path: "/",
    newTab: false,
  },
  {
    id: 2,
    title: "About",
    path: "/about",
    newTab: false,
  },
  {
    id: 3,
    title: "Pricing",
    path: "/pricing",
    newTab: false,
  },
  {
    id: 5,
    title: "Contact",
    path: "/contact",
    newTab: false,
  },
  {
    id: 5,
    title: "Blog",
    path: "/blogs",
    newTab: false,
  },
  {
    id: 6,
    title: "Downloads",
    newTab: false,
    submenu: [
      { id: 61, title: "Windows", path: "/installers/windows.exe", newTab: false },
      { id: 62, title: "macOS",   path: "/installers/macos.dmg", newTab: false },
      { id: 63, title: "Linux", path: "/installers/linux.AppImage", newTab: false },
    ],
  },
];
export default menuData;
