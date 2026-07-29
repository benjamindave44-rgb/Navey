import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LegalPage } from "@/components/LegalPage";

export default function TermsPage() {
  return (
    <>
      <Header />
      <main id="main" className="flex-1 px-6 py-12 md:px-12">
        <LegalPage
          title="Terms of Service"
          lastUpdated="July 2026"
          crossLinkHref="/privacy"
          crossLinkLabel="Read our Privacy Policy →"
          sections={[
            {
              heading: "1. Using Navey",
              body: "Navey is a community-driven directory of coffee shops and restaurants across the Philippines. By creating an account or browsing the platform, you agree to these Terms. You must be at least 13 years old to create an account.",
            },
            {
              heading: "2. Your content",
              body: "Reviews, photos, and spots you submit remain yours, but by posting on Navey you grant us a license to display and distribute that content on the platform. You're responsible for making sure what you post is accurate and doesn't violate anyone else's rights.",
            },
            {
              heading: "3. Community guidelines",
              body: "Be honest and respectful. Don't post fake reviews, spam, harassment, or content unrelated to a spot's food, drinks, or atmosphere. We reserve the right to remove content or suspend accounts that violate these guidelines.",
            },
            {
              heading: "4. Business listings & claims",
              body: "If you submit a spot, you're responsible for keeping its details accurate from your Owner Dashboard. Submitted spots and edits are reviewed by our team before they go live, and edits may be flagged for review if they don't follow our content guidelines. We're building a formal verification process for claiming listings that already exist on Navey — until then, contact us if you believe a listing should be reassigned to you as its rightful owner.",
            },
            {
              heading: "5. Disclaimers",
              body: "Navey provides listings information “as is.” Hours, prices, and amenities are submitted by users and businesses and may not always be accurate — we recommend confirming details directly with the business before visiting.",
            },
            {
              heading: "6. Changes to these terms",
              body: "We may update these Terms from time to time. Continued use of Navey after changes take effect means you accept the updated Terms.",
            },
            {
              heading: "7. Contact",
              body: (
                <>
                  Questions about these Terms? Reach us at{" "}
                  <a href="mailto:navey.ph@gmail.com" className="font-bold">
                    navey.ph@gmail.com
                  </a>
                  .
                </>
              ),
            },
          ]}
        />
      </main>
      <Footer />
    </>
  );
}
