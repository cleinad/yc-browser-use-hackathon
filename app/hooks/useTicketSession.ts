"use client";

import { useCallback, useRef, useState } from "react";
import type {
  TicketPhase,
  TicketMessage,
  VisionAnalysis,
  TicketContractor,
  ContractorQuote,
  ContractorInbox,
  PurchasePlan,
} from "../types";
import { isPurchasePlan } from "../types";
import {
  getTicketAnalyzeUrl,
  getTicketContractorsUrl,
  getTicketContractorsEventsUrl,
  getTicketSendQuotesUrl,
  getTicketSendQuotesEventsUrl,
  getTicketFindSuppliesUrl,
  getTicketFindSuppliesEventsUrl,
} from "../lib/api";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface SseStreamOpts {
  onLog?: (msg: string) => void;
  onEvent?: (event: string, data: unknown) => void;
}

const SSE_TIMEOUT_MS = 180_000; // 3 minutes

function sseStream(
  eventsUrl: string,
  opts: SseStreamOpts,
): Promise<unknown> {
  let esRef: EventSource | null = null;

  const ssePromise = new Promise((resolve, reject) => {
    const es = new EventSource(eventsUrl);
    esRef = es;
    let done = false;

    es.addEventListener("log", (e) => {
      if (!done) opts.onLog?.((e as MessageEvent<string>).data ?? "");
    });

    es.addEventListener("email_sent", (e) => {
      if (!done) {
        try {
          const data = JSON.parse((e as MessageEvent<string>).data ?? "{}");
          opts.onEvent?.("email_sent", data);
        } catch { /* ignore */ }
      }
    });

    es.addEventListener("quote_received", (e) => {
      if (!done) {
        try {
          const data = JSON.parse((e as MessageEvent<string>).data ?? "{}");
          opts.onEvent?.("quote_received", data);
        } catch { /* ignore */ }
      }
    });

    es.addEventListener("result", (e) => {
      if (done) return;
      done = true;
      es.close();
      try {
        resolve(JSON.parse((e as MessageEvent<string>).data ?? "{}"));
      } catch {
        reject(new Error("Invalid JSON in SSE result"));
      }
    });

    es.addEventListener("error", (e) => {
      if (done) return;
      done = true;
      es.close();
      const msg =
        e instanceof MessageEvent && typeof e.data === "string"
          ? e.data
          : "Stream disconnected";
      reject(new Error(msg));
    });
  });

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => {
      esRef?.close();
      reject(new Error("Request timed out"));
    }, SSE_TIMEOUT_MS);
  });

  return Promise.race([ssePromise, timeout]);
}

export function useTicketSession(propertyAddress: string | null) {
  const [phase, setPhase] = useState<TicketPhase>("idle");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [analysis, setAnalysis] = useState<VisionAnalysis | null>(null);
  const [userDescription, setUserDescription] = useState<string | null>(null);
  const [contractors, setContractors] = useState<TicketContractor[]>([]);
  const [inboxes, setInboxes] = useState<ContractorInbox[]>([]);
  const [quotes, setQuotes] = useState<ContractorQuote[]>([]);
  const [purchasePlan, setPurchasePlan] = useState<PurchasePlan | null>(null);
  const [selectedContractorEmail, setSelectedContractorEmail] = useState<string | null>(null);
  const [followUpAnswers, setFollowUpAnswers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retryFn, setRetryFn] = useState<(() => void) | null>(null);
  const [logs, setLogs] = useState<Record<string, string[]>>({});
  const [supplyLoading, setSupplyLoading] = useState(false);

  // Ref to track latest analysis for closures
  const analysisRef = useRef<VisionAnalysis | null>(null);

  const addLog = useCallback((phase: string, msg: string) => {
    setLogs((prev) => ({
      ...prev,
      [phase]: [...(prev[phase] || []), msg],
    }));
  }, []);

  const addMessage = useCallback((msg: TicketMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const loading =
    phase !== "idle" && phase !== "complete" && phase !== "analyzing";
  const waitingForFollowUp =
    phase === "analyzing" && analysis !== null && followUpAnswers.length < (analysis.follow_up_questions?.length ?? 0);

  // Step 5: Find supplies via existing pipeline
  const findSupplies = useCallback(
    async (csvData: string) => {
      setPhase("finding_supplies");
      setSupplyLoading(true);
      setError(null);
      setRetryFn(null);
      try {
        const resp = await fetch(getTicketFindSuppliesUrl(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            csv_data: csvData,
            location: propertyAddress,
          }),
        });

        if (!resp.ok) throw new Error(`Supply search failed (${resp.status})`);

        const { request_id } = (await resp.json()) as { request_id: string };

        const result = await sseStream(
          getTicketFindSuppliesEventsUrl(request_id),
          { onLog: (msg) => addLog("finding_supplies", msg) },
        );

        if (isPurchasePlan(result)) {
          setPurchasePlan(result as PurchasePlan);
        }

        setPhase("complete");
        setSupplyLoading(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Supply search failed";
        setError(msg);
        setRetryFn(() => () => findSupplies(csvData));
        setSupplyLoading(false);
      }
    },
    [propertyAddress, addLog],
  );

  // Step 4: Send quotes via AgentMail
  const sendQuotes = useCallback(
    async (contractorList: TicketContractor[], issueDesc: string) => {
      setPhase("sending_quotes");
      setError(null);
      setRetryFn(null);
      try {
        const resp = await fetch(getTicketSendQuotesUrl(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contractors: contractorList.map((c) => ({
              name: c.name,
              email: c.email,
              trade: c.trade_category,
            })),
            issue_description: issueDesc,
          }),
        });

        if (!resp.ok) throw new Error(`Quote request failed (${resp.status})`);

        const { request_id } = (await resp.json()) as { request_id: string };
        setPhase("receiving_quotes");

        const result = (await sseStream(
          getTicketSendQuotesEventsUrl(request_id),
          {
            onLog: (msg) => addLog("sending_quotes", msg),
            onEvent: (event, data) => {
              if (event === "email_sent") {
                setInboxes((prev) => [...prev, data as ContractorInbox]);
              }
              if (event === "quote_received") {
                setQuotes((prev) => [...prev, data as ContractorQuote]);
              }
            },
          },
        )) as { quotes: ContractorQuote[]; inboxes: ContractorInbox[] };

        const receivedQuotes = result.quotes || [];
        setQuotes(receivedQuotes);
        setInboxes(result.inboxes || []);

        if (receivedQuotes.length > 0) {
          const cheapest = receivedQuotes.reduce((a, b) =>
            a.total_price <= b.total_price ? a : b,
          );
          setSelectedContractorEmail(cheapest.contractor_email);
          await findSupplies(cheapest.csv_data);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Quote request failed";
        setError(msg);
        setRetryFn(() => () => sendQuotes(contractorList, issueDesc));
      }
    },
    [addLog, findSupplies],
  );

  // Step 3: Find contractors
  const findContractors = useCallback(
    async (data: VisionAnalysis) => {
      setPhase("finding_contractors");
      setError(null);
      setRetryFn(null);
      try {
        const resp = await fetch(getTicketContractorsUrl(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trade: data.trade,
            issue_description: data.issue_description,
            location: propertyAddress || "San Francisco, CA",
          }),
        });

        if (!resp.ok) throw new Error(`Contractor search failed (${resp.status})`);

        const { request_id } = (await resp.json()) as { request_id: string };

        const result = (await sseStream(
          getTicketContractorsEventsUrl(request_id),
          { onLog: (msg) => addLog("finding_contractors", msg) },
        )) as { contractors: TicketContractor[] };

        const found = result.contractors || [];
        setContractors(found);

        // Auto-proceed to send quotes
        await sendQuotes(found, data.issue_description);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Contractor search failed";
        setError(msg);
        setRetryFn(() => () => findContractors(data));
      }
    },
    [propertyAddress, addLog, sendQuotes],
  );

  // Step 1: Upload image
  const uploadImage = useCallback(
    async (file: File) => {
      if (phase !== "idle") return;
      setError(null);
      setRetryFn(null);
      setPhase("uploading");

      const url = URL.createObjectURL(file);
      setImageUrl(url);
      addMessage({ role: "user", text: "", imageUrl: url });
      addMessage({ role: "agent", text: "Analyzing your photo..." });

      try {
        const base64 = await fileToBase64(file);
        setPhase("analyzing");

        const resp = await fetch(getTicketAnalyzeUrl(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_base64: base64,
            property_address: propertyAddress,
          }),
        });

        if (!resp.ok) throw new Error(`Analysis failed (${resp.status})`);

        const data = (await resp.json()) as VisionAnalysis;
        setAnalysis(data);
        analysisRef.current = data;

        addMessage({
          role: "agent",
          text: `**Issue detected:** ${data.issue_description}\n**Trade:** ${data.trade.replace("_", " ")}\n**Severity:** ${data.severity}`,
        });

        if (data.follow_up_questions.length > 0) {
          addMessage({
            role: "agent",
            text: data.follow_up_questions[0],
          });
        } else {
          await findContractors(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setPhase("idle");
      }
    },
    [phase, propertyAddress, addMessage, findContractors],
  );

  // Step 2: Handle follow-up answer
  const submitFollowUp = useCallback(
    async (text: string) => {
      if (!analysis) return;

      addMessage({ role: "user", text });
      setUserDescription(text);
      const newAnswers = [...followUpAnswers, text];
      setFollowUpAnswers(newAnswers);

      if (newAnswers.length >= analysis.follow_up_questions.length) {
        await findContractors(analysis);
      } else {
        const nextQ = analysis.follow_up_questions[newAnswers.length];
        if (nextQ) {
          addMessage({ role: "agent", text: nextQ });
        }
      }
    },
    [analysis, followUpAnswers, addMessage, findContractors],
  );

  // Select a different contractor (re-run supply search)
  const selectContractor = useCallback(
    (email: string) => {
      setSelectedContractorEmail(email);
      if (phase === "complete" || phase === "finding_supplies") {
        const quote = quotes.find((q) => q.contractor_email === email);
        if (quote) {
          setSupplyLoading(true);
          findSupplies(quote.csv_data);
        }
      }
    },
    [phase, quotes, findSupplies],
  );

  // Upload CSV directly → skip to supply search
  const uploadCsv = useCallback(
    async (file: File) => {
      if (phase !== "idle") return;
      setError(null);
      setRetryFn(null);
      addMessage({ role: "user", text: `Uploaded ${file.name}` });
      const csvData = await file.text();
      await findSupplies(csvData);
    },
    [phase, addMessage, findSupplies],
  );

  // Retry the current failed step
  const retry = useCallback(() => {
    if (retryFn) {
      setError(null);
      retryFn();
    }
  }, [retryFn]);

  return {
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
    logs,
    supplyLoading,
    uploadImage,
    uploadCsv,
    submitFollowUp,
    selectContractor,
    retry,
  };
}
