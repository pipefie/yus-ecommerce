"use client"
import CookieConsent from "react-cookie-consent"

export default function CookieBanner() {
  return (
    <CookieConsent
      location="bottom"
      buttonText="Accept"
      declineButtonText="Decline"
      enableDeclineButton
      onAccept={() => {
        if (typeof window !== "undefined") {
          localStorage.setItem("cookieConsent", "true")
        }
      }}
      onDecline={() => {
        if (typeof window !== "undefined") {
          localStorage.setItem("cookieConsent", "false")
        }
      }}
      style={{ background: "#000" }}
      buttonStyle={{ background: "#39ff14", color: "#000", fontFamily: "monospace" }}
      declineButtonStyle={{ background: "#555", color: "#fff", fontFamily: "monospace" }}
    >
      We use cookies for analytics. Read our {" "}
      <a href="/cookie-policy" className="underline">Cookie Policy</a>.
    </CookieConsent>
  )
}