"use client";

import { useTicketSession } from "@/app/hooks/useTicketSession";
import TicketChatInput from "@/app/components/ticket/TicketChatInput";
import TicketMessageList from "@/app/components/ticket/TicketMessageList";
import TicketCardFlow from "@/app/components/ticket/TicketCardFlow";

interface TicketTabProps {
  propertyAddress: string | null;
}

export default function TicketTab({ propertyAddress }: TicketTabProps) {
  const {
    phase,
    imageUrl,
    messages,
    analysis,
    userDescription,
    contractors,
    inboxes,
    quotes,
    purchasePlan,
    selectedContractorEmail,
    loading,
    waitingForFollowUp,
    error,
    supplyLoading,
    uploadImage,
    uploadCsv,
    submitFollowUp,
    selectContractor,
    retry,
  } = useTicketSession(propertyAddress);

  const showChat = phase === "idle" || phase === "uploading" || phase === "analyzing";
  const showCards = !showChat && (analysis !== null || phase === "finding_supplies" || phase === "complete");

  const handleSubmit = (text: string) => {
    if (waitingForFollowUp || phase === "analyzing") {
      submitFollowUp(text);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {showChat && (
          <TicketMessageList messages={messages} />
        )}
        {showCards && (
          <TicketCardFlow
            phase={phase}
            imageUrl={imageUrl}
            analysis={analysis}
            userDescription={userDescription}
            contractors={contractors}
            inboxes={inboxes}
            quotes={quotes}
            purchasePlan={purchasePlan}
            selectedContractorEmail={selectedContractorEmail}
            onSelectContractor={selectContractor}
            error={error}
            onRetry={retry}
            supplyLoading={supplyLoading}
          />
        )}
      </div>

      {/* Input — only shown in chat phases */}
      {showChat && (
        <div className="border-t border-[var(--border-default)] bg-[var(--bg-surface)]">
          <TicketChatInput
            onSubmit={handleSubmit}
            onImageUpload={uploadImage}
            onCsvUpload={uploadCsv}
            disabled={loading}
            showImageUpload={phase === "idle"}
            showCsvUpload={phase === "idle"}
            placeholder={
              phase === "idle"
                ? "Upload a photo to get started..."
                : waitingForFollowUp
                  ? "Answer the question above..."
                  : "Processing..."
            }
          />
        </div>
      )}
    </div>
  );
}
