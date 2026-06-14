import React, { useState } from "react";
import { OutreachItem, OutreachStatus, PREDEFINED_TEMPLATES } from "../types";
import { X } from "lucide-react";

interface OutreachFormProps {
  onClose: () => void;
  onSave: (item: Omit<OutreachItem, "id" | "emailSentStatus">) => void;
  initialItem?: OutreachItem;
}

export const OutreachForm: React.FC<OutreachFormProps> = ({
  onClose,
  onSave,
  initialItem,
}) => {
  const [companyName, setCompanyName] = useState(initialItem?.companyName || "");
  const [contactPerson, setContactPerson] = useState(initialItem?.contactPerson || "");
  const [emailAddress, setEmailAddress] = useState(initialItem?.emailAddress || "");
  const [phone, setPhone] = useState(initialItem?.phone || "");
  const [status, setStatus] = useState<OutreachStatus>(initialItem?.status || OutreachStatus.INITIAL_OUTREACH);
  const [lastContactDate, setLastContactDate] = useState(
    initialItem?.lastContactDate || new Date().toISOString().split("T")[0]
  );
  const [followUpDate, setFollowUpDate] = useState(initialItem?.followUpDate || "");
  const [followUpTemplateId, setFollowUpTemplateId] = useState(
    initialItem?.followUpTemplateId || PREDEFINED_TEMPLATES[0].id
  );
  const [notes, setNotes] = useState(initialItem?.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !contactPerson.trim() || !emailAddress.trim()) {
      alert("Please fill in Company Name, Contact Person, and Email Address.");
      return;
    }
    
    onSave({
      companyName: companyName.trim(),
      contactPerson: contactPerson.trim(),
      emailAddress: emailAddress.trim(),
      phone: phone.trim(),
      status,
      lastContactDate,
      followUpDate,
      followUpTemplateId,
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#161B22] border border-white/5 rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative max-h-[92vh] overflow-y-auto text-[#E2E8F0]">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <h3 className="text-xl font-bold text-[#E2E8F0] mb-1">
          {initialItem ? "Edit Outreach Entry" : "Log New Client Outreach"}
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          {initialItem ? "Update information in Google Sheets" : "Enter client details and schedule follow-ups"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm text-[#E2E8F0]">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Company Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Acme Tech Labs"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1C212A] border border-white/5 rounded-xl focus:outline-none focus:border-indigo-500 text-[#E2E8F0] placeholder-slate-600 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Contact Person *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1C212A] border border-white/5 rounded-xl focus:outline-none focus:border-indigo-500 text-[#E2E8F0] placeholder-slate-600 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. john@acme.com"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1C212A] border border-white/5 rounded-xl focus:outline-none focus:border-indigo-500 text-[#E2E8F0] placeholder-slate-600 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="e.g. +1 (555) 0192"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1C212A] border border-white/5 rounded-xl focus:outline-none focus:border-indigo-500 text-[#E2E8F0] placeholder-slate-600 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Outreach Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OutreachStatus)}
                className="w-full px-4 py-2.5 bg-[#1C212A] border border-white/5 rounded-xl focus:outline-none focus:border-indigo-500 text-[#E2E8F0] cursor-pointer font-medium"
              >
                {Object.values(OutreachStatus).map((st) => (
                  <option key={st} value={st} className="bg-[#1C212A]">
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Last Contact Date *
              </label>
              <input
                type="date"
                required
                value={lastContactDate}
                onChange={(e) => setLastContactDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1C212A] border border-white/5 rounded-xl focus:outline-none focus:border-indigo-500 text-[#E2E8F0] cursor-pointer font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1.5">
                Follow-up Date
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1C212A] border border-white/5 rounded-xl focus:outline-none focus:border-indigo-500 text-[#E2E8F0] cursor-pointer font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Scheduled Email Template
            </label>
            <select
              value={followUpTemplateId}
              onChange={(e) => setFollowUpTemplateId(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1C212A] border border-white/5 rounded-xl focus:outline-none focus:border-indigo-500 text-[#E2E8F0] cursor-pointer font-medium"
            >
              {PREDEFINED_TEMPLATES.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id} className="bg-[#1C212A]">
                  {tmpl.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Project Milestones & Description (Notes)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Met at TechConf. Interested in scaling their checkout pipelines. Scheduled demo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1C212A] border border-white/5 rounded-xl focus:outline-none focus:border-indigo-500 text-[#E2E8F0] placeholder-slate-600 resize-none font-medium leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-white/5 text-slate-400 hover:bg-white/5 font-semibold transition-colors select-none cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-lg shadow-indigo-600/10 select-none cursor-pointer text-xs"
            >
              {initialItem ? "Save Changes" : "Log Outreach"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
