import React, { useMemo, useState, useEffect } from "react";
import { Mail, Clock, CheckCircle2, AlertCircle, RefreshCw, Send, ChevronRight, ToggleLeft, ToggleRight } from "lucide-react";
import { OutreachItem, PREDEFINED_TEMPLATES, EmailTemplate } from "../types";
import { sendGmailEmail } from "../googleApi";

interface FollowUpSchedulerProps {
  items: OutreachItem[];
  userEmail: string;
  userName: string;
  onSendDone: (updatedItem: OutreachItem) => void;
  isProcessingExternal: boolean;
}

export const FollowUpScheduler: React.FC<FollowUpSchedulerProps> = ({
  items,
  userEmail,
  userName,
  onSendDone,
  isProcessingExternal,
}) => {
  const [autoSweep, setAutoSweep] = useState<boolean>(() => {
    return localStorage.getItem("ejicode_auto_sweep") === "true";
  });
  const [sendingAll, setSendingAll] = useState<string | null>(null);
  const [selectedItemForPreview, setSelectedItemForPreview] = useState<OutreachItem | null>(null);

  // Filter items that have followUpDate and are still Pending
  const pendingFollowUps = useMemo(() => {
    return items.filter((item) => item.followUpDate && item.emailSentStatus === "Pending");
  }, [items]);

  // Determine items "Due Today" or "Overdue" (on or before current local date)
  const dueItems = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return pendingFollowUps.filter((item) => item.followUpDate <= todayStr);
  }, [pendingFollowUps]);

  // List of Sent follow-ups
  const sentItems = useMemo(() => {
    return items.filter((item) => item.emailSentStatus === "Sent");
  }, [items]);

  // Construct customized email preview
  const emailPreview = useMemo(() => {
    if (!selectedItemForPreview) return null;

    const template = PREDEFINED_TEMPLATES.find((t) => t.id === selectedItemForPreview.followUpTemplateId) || PREDEFINED_TEMPLATES[0];
    let body = template.body
      .replace(/{ContactPerson}/g, selectedItemForPreview.contactPerson)
      .replace(/{CompanyName}/g, selectedItemForPreview.companyName)
      .replace(/{SalesPerson}/g, userName || "Outreach Specialist")
      .replace(/{SalesEmail}/g, userEmail || "sales@ejicode.com");

    return {
      to: selectedItemForPreview.emailAddress,
      subject: template.subject.replace(/{CompanyName}/g, selectedItemForPreview.companyName),
      body,
    };
  }, [selectedItemForPreview, userName, userEmail]);

  // Set default preview to first due item if available
  useEffect(() => {
    if (dueItems.length > 0 && !selectedItemForPreview) {
      setSelectedItemForPreview(dueItems[0]);
    } else if (pendingFollowUps.length > 0 && !selectedItemForPreview) {
      setSelectedItemForPreview(pendingFollowUps[0]);
    }
  }, [dueItems, pendingFollowUps, selectedItemForPreview]);

  // Auto Sweep function: runs automatically when autoSweep is enabled and there are due items
  const executeSweep = async (targetItems: OutreachItem[], isAuto: boolean) => {
    if (targetItems.length === 0) return;

    if (!isAuto) {
      const confirmSend = window.confirm(
        `Are you sure you want to trigger sending these ${targetItems.length} scheduled email templates through your Gmail account immediately?`
      );
      if (!confirmSend) return;
    }

    setSendingAll(isAuto ? "Auto-pilot sweep..." : "Sending queue...");
    
    try {
      const accessToken = localStorage.getItem("ejicode_google_token");
      if (!accessToken) {
        throw new Error("Credentials out of date. Please sign out and sign in again.");
      }

      for (const item of targetItems) {
        const template = PREDEFINED_TEMPLATES.find((t) => t.id === item.followUpTemplateId) || PREDEFINED_TEMPLATES[0];
        const subjectHtml = template.subject.replace(/{CompanyName}/g, item.companyName);
        const bodyContent = template.body
          .replace(/{ContactPerson}/g, item.contactPerson)
          .replace(/{CompanyName}/g, item.companyName)
          .replace(/{SalesPerson}/g, userName || "Outreach Specialist")
          .replace(/{SalesEmail}/g, userEmail || "sales@ejicode.com");

        try {
          // Trigger actual Gmail Send!
          await sendGmailEmail(accessToken, item.emailAddress, subjectHtml, bodyContent);
          
          // Construct updated copy of the item and pass it back
          const updated: OutreachItem = {
            ...item,
            emailSentStatus: "Sent",
            emailSentDate: new Date().toLocaleString(),
          };
          onSendDone(updated);
        } catch (innerErr) {
          console.error(`Failed to send follow-up to ${item.contactPerson}:`, innerErr);
        }
      }
    } catch (e: any) {
      alert(e.message || "Sweep execution encountered error.");
    } finally {
      setSendingAll(null);
    }
  };

  // Run auto-sweep on load if activated
  useEffect(() => {
    if (autoSweep && dueItems.length > 0 && !sendingAll && !isProcessingExternal) {
      executeSweep(dueItems, true);
    }
  }, [autoSweep, dueItems, sendingAll, isProcessingExternal]);

  const toggleAutoSweep = () => {
    const nextVal = !autoSweep;
    setAutoSweep(nextVal);
    localStorage.setItem("ejicode_auto_sweep", String(nextVal));
  };

  return (
    <div id="followup-scheduler-module" className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      
      {/* Reminders List Column */}
      <div className="lg:col-span-2 space-y-4">
        {/* Auto pilot setup card */}
        <div className="bg-gradient-to-br from-[#121620] to-[#1A1835] border border-indigo-500/15 text-white rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">Gmail Auto-Sweep</span>
            <button onClick={toggleAutoSweep} className="text-white hover:text-indigo-250 transition-colors cursor-pointer">
              {autoSweep ? <ToggleRight size={38} className="text-emerald-400" /> : <ToggleLeft size={38} className="text-slate-500" />}
            </button>
          </div>
          <h4 className="text-sm font-bold text-[#E2E8F0]">Auto-send Due Follow-ups</h4>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            When enabled, Ejicode Outreach Scheduler will automatically email clients that hit their follow-up date as soon as the tracker is opened!
          </p>
          
          {dueItems.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-indigo-300 font-semibold">{dueItems.length} pending emails due</span>
              <button
                onClick={() => executeSweep(dueItems, false)}
                disabled={!!sendingAll || isProcessingExternal}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer select-none"
              >
                {sendingAll ? <RefreshCw className="animate-spin" size={12} /> : <Send size={11} />}
                <span>Send All Due</span>
              </button>
            </div>
          )}
        </div>

        {/* Due Lists */}
        <div className="bg-[#161B22] border border-white/5 rounded-2xl p-5 shadow-xl">
          <h4 className="text-sm font-bold text-[#E2E8F0] flex items-center gap-1.5 mb-3">
            <Clock size={16} className="text-amber-500" />
            <span>Upcoming Schedules ({pendingFollowUps.length})</span>
          </h4>

          {pendingFollowUps.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              <CheckCircle2 className="mx-auto text-emerald-500/50 mb-1.5" size={24} />
              <p className="font-semibold text-slate-400">Follow-up schedule empty</p>
              <p className="text-[10px] text-slate-500">Log new outreaches with a Follow-Up Date to queue drafts.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {pendingFollowUps.map((item) => {
                const isSelected = selectedItemForPreview?.id === item.id;
                const todayStr = new Date().toISOString().split("T")[0];
                const isOverdue = item.followUpDate <= todayStr;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItemForPreview(item)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-500/10 text-[#E2E8F0]"
                        : "border-white/5 bg-[#1C212A] hover:bg-[#242B35] text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#E2E8F0] truncate max-w-[120px]">{item.companyName}</span>
                      <span
                        className={`font-semibold text-[10px] px-1.5 py-0.5 rounded ${
                          isOverdue ? "bg-rose-500/10 text-rose-400 font-bold" : "bg-white/5 text-slate-400"
                        }`}
                      >
                        {isOverdue ? "Due Now" : item.followUpDate}
                      </span>
                    </div>
                    <p className="text-slate-450 text-[10px] truncate">{item.contactPerson} &bull; {item.emailAddress}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dispatch History */}
        <div className="bg-[#161B22] border border-white/5 rounded-2xl p-5 shadow-xl">
          <h4 className="text-sm font-bold text-[#E2E8F0] flex items-center gap-1.5 mb-3">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span>Dispatched Reminders ({sentItems.length})</span>
          </h4>
          {sentItems.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-500 leading-normal">
              No emails sent yet from this workstation sessions.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              {sentItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 px-3 border border-white/5 bg-[#1C212A] rounded-lg text-[10px]">
                  <div>
                    <p className="font-bold text-slate-300">{item.companyName}</p>
                    <p className="text-slate-550 font-medium">To: {item.contactPerson}</p>
                  </div>
                  <span className="font-medium text-slate-500">Sent ✓</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Draft Preview Column */}
      <div className="lg:col-span-3">
        <div className="bg-[#161B22] border border-white/5 rounded-2xl p-6 shadow-xl h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
              <div>
                <h4 className="text-sm font-bold text-[#E2E8F0]">Follow-up Template Draft Preview</h4>
                <p className="text-[10px] text-slate-500">Dynamic email generator template values</p>
              </div>
              <Mail className="text-indigo-400" size={18} />
            </div>

            {selectedItemForPreview && emailPreview ? (
              <div className="space-y-3.5 text-xs text-[#E2E8F0] bg-[#1C212A] p-4 rounded-xl border border-white/5">
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wide text-[9px] block mb-0.5">Recipients</span>
                  <p className="font-semibold text-[#E2E8F0] bg-[#0D1117] border border-white/5 px-3 py-1.5 rounded-lg">
                    {selectedItemForPreview.contactPerson} &lt;{emailPreview.to}&gt;
                  </p>
                </div>

                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wide text-[9px] block mb-0.5">Subject</span>
                  <p className="font-semibold text-[#E2E8F0] bg-[#0D1117] border border-white/5 px-3 py-1.5 rounded-lg">
                    {emailPreview.subject}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wide text-[9px] block mb-0.5">Body</span>
                  <div className="whitespace-pre-line font-medium bg-[#0D1117] border border-white/5 p-4 rounded-lg text-slate-350 leading-relaxed max-h-[220px] overflow-y-auto">
                    {emailPreview.body}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center text-slate-500">
                <AlertCircle className="mb-2 text-slate-600" size={32} />
                <p className="font-semibold text-slate-400">Select a schedule path to preview</p>
                <p className="text-[11px] text-slate-500 leading-normal max-w-xs mt-1">
                  Once a lead with a follow-up date and template is highlighted, you will see a complete live mockup of the email.
                </p>
              </div>
            )}
          </div>

          {selectedItemForPreview && emailPreview && (
            <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
              <button
                onClick={() => executeSweep([selectedItemForPreview], false)}
                disabled={!!sendingAll || isProcessingExternal}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl shadow-lg shadow-indigo-600/10 text-xs transition-transform transform active:scale-95 disabled:opacity-50 select-none cursor-pointer"
              >
                {sendingAll ? <RefreshCw className="animate-spin" size={14} /> : <Send size={13} />}
                <span>Send via Gmail on behalf of Ejicode</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
