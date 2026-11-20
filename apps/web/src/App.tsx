import React, { useState } from "react";
import { SignInModal } from "./components/auth/SignInModal";

export const App: React.FC = () => {
  const [showSignIn, setShowSignIn] = useState(true);

  return (
    <div className="notepad-app" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <SignInModal
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
      />
    </div>
  );
};
