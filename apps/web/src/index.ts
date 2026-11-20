import { CORE_VERSION } from "@notepad/core";

export const WEB_APP = `Notepad Web (core ${CORE_VERSION})`;
export * from "./components/auth/SignInModal";
export * from "./auth/googleAuth";
export * from "./auth/pkce";
