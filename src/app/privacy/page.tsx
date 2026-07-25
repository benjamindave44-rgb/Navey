import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LegalPage } from "@/components/LegalPage";

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="flex-1 px-6 py-12 md:px-12">
        <LegalPage
          title="Privacy Policy"
          lastUpdated="July 2026"
          crossLinkHref="/terms"
          crossLinkLabel="Read our Terms of Service →"
          sections={[
            {
              heading: "1. Information we collect",
              body: "When you create a Navey account, we collect your name, email address, and password. We also store the spots you save, the reviews and photos you post, and any spots you submit to the directory.",
            },
            {
              heading: "2. How we use your information",
              body: "We use this information to run core features — saved lists, reviews, and your Owner Dashboard for spots you've submitted — and to keep the directory accurate and safe. We may also email you about your account, such as confirming your address or helping you reset your password.",
            },
            {
              heading: "3. What's public",
              body: "Your display name, public reviews (including any photos you attach), and spots you submit are visible to other Navey users. Whether a submission is pending, approved, or flagged for review is visible only to you and Navey's moderators.",
            },
            {
              heading: "4. Photos you upload",
              body: "Photos you add to a spot, review, or menu are stored with our hosting provider and displayed publicly on the relevant spot or review page. Only you, as the spot's submitter or the review's author, or a Navey admin can remove them.",
            },
            {
              heading: "5. Business listings",
              body: (
                <>
                  If you submit a spot, you can manage its details afterward
                  from your Owner Dashboard. We&apos;re building a formal process
                  for business owners to claim and verify listings that
                  someone else originally submitted — until then, email us if
                  a listing needs to be corrected or handed over to its
                  rightful owner.
                </>
              ),
            },
            {
              heading: "6. Your choices",
              body: (
                <>
                  To update your account details, remove content, or delete
                  your account entirely, email us at{" "}
                  <a href="mailto:navey.ph@gmail.com" className="font-bold">
                    navey.ph@gmail.com
                  </a>{" "}
                  and we&apos;ll take care of it. Self-service account settings
                  are on our roadmap.
                </>
              ),
            },
            {
              heading: "7. Contact",
              body: (
                <>
                  Questions about your data? Reach us at{" "}
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
