import { CORE_VERSION } from "@notepad/core";

export const WEB_APP = `Notepad Web (core ${CORE_VERSION})`;
export * from "./components/auth/SignInModal";
export * from "./components/header/AccountMenu";
export * from "./components/tabs/TabStrip";
export * from "./components/tabs/TabItem";
export * from "./stores/tabsStore";
export * from "./auth/googleAuth";
export * from "./auth/pkce";
