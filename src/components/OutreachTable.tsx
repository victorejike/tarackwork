import React, { useState, useMemo } from "react";
import { Search, Filter, Edit, Mail, Trash2, Calendar, FileSpreadsheet, Milestone, ChevronRight } from "lucide-react";
import { OutreachItem, OutreachStatus } from "../types";

interface OutreachTableProps {
  items: OutreachItem[];
  onEdit: (item: OutreachItem) => void;
  onDelete: (item: OutreachItem) => void;
  onSendImmediate: (item: OutreachItem) => void;
  onUpgradeStatus: (item: OutreachItem, nextStatus: OutreachStatus) => void;
}

const STAGES = ["All Stages", ...Object.values(OutreachStatus)];

export const OutreachTable: React.FC<OutreachTableProps> = ({
  items,
  onEdit,
  onDelete,
  onSendImmediate,
  onUpgradeStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState("All Stages");

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.emailAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStage = selectedStage === "All Stages" || item.status === selectedStage;

      return matchSearch && matchStage;
    });
  }, [items, searchQuery, selectedStage]);

  // Assist with advancing deal stage directly in 1 click
  const getNextStage = (current: OutreachStatus): OutreachStatus | null => {
    switch (current) {
      case OutreachStatus.INITIAL_OUTREACH:
        return OutreachStatus.IN_DISCUSSION;
      case OutreachStatus.IN_DISCUSSION:
        return OutreachStatus.PROPOSAL_SENT;
      case OutreachStatus.PROPOSAL_SENT:
        return OutreachStatus.NDA_SIGNED;
      case OutreachStatus.NDA_SIGNED:
        return OutreachStatus.WON;
      default:
        return null;
    }
  };

  const getStatusBadgeStyles = (status: OutreachStatus) => {
    switch (status) {
      case OutreachStatus.INITIAL_OUTREACH:
        return "bg-sky-500/10 text-sky-450 border-sky-500/20";
      case OutreachStatus.IN_DISCUSSION:
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case OutreachStatus.PROPOSAL_SENT:
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case OutreachStatus.NDA_SIGNED:
        return "bg-teal-500/10 text-teal-400 border-teal-500/20";
      case OutreachStatus.WON:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case OutreachStatus.LOST:
        return "bg-rose-500/10 text-rose-450 border-rose-500/20";
    }
  };

  const getEmailStatusBadgeStyles = (status: "Pending" | "Sent" | "N/A") => {
    switch (status) {
      case "Pending":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Sent":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
      case "N/A":
        return "bg-white/5 text-slate-400 border-white/5";
    }
  };

  return (
    <div id="outreach-data-table" className="space-y-4">
      {/* Search and filtering toolbars */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
          <input
            type="text"
            placeholder="Search company, contact person, milestones, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#1C212A] border border-white/5 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-200 placeholder-slate-500 font-medium"
          />
        </div>
        
        <div className="flex gap-2">
          <div className="relative shrink-0">
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="pl-4 pr-10 py-2.5 bg-[#1C212A] border border-white/5 text-sm font-semibold rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none text-slate-200"
            >
              {STAGES.map((st) => (
                <option key={st} value={st} className="bg-[#1C212A]">
                  {st}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
          </div>
        </div>
      </div>

      {/* Responsive Spreadsheet Grid */}
      <div className="bg-[#161B22] border border-white/5 rounded-2xl shadow-2xl overflow-x-auto text-[#E2E8F0]">
        <table className="w-full text-left border-collapse text-xs md:text-sm">
          <thead>
            <tr className="bg-[#0D1117] border-b border-white/5 text-slate-400 font-bold uppercase tracking-wider text-[10px] select-none">
              <th className="py-3.5 px-5">Lead / Company</th>
              <th className="py-3.5 px-4">Contact Details</th>
              <th className="py-3.5 px-4">Outreach Stage</th>
              <th className="py-3.5 px-4">Milestones & Notes</th>
              <th className="py-3.5 px-4">Email Reminder</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-350">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                  {items.length === 0
                    ? "Welcome! Click 'Add Outreach' or 'Import Spreadsheet' above to get started."
                    : "No matches found. Refine your query or choose a different Stage Filter."}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const nextStage = getNextStage(item.status);
                return (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                    {/* Company Column */}
                    <td className="py-4 px-5">
                      <p className="font-bold text-[#E2E8F0] group-hover:text-indigo-400 transition-colors">
                        {item.companyName}
                      </p>
                      {item.phone && <p className="text-slate-500 text-[10px] mt-0.5">{item.phone}</p>}
                    </td>

                    {/* Contact Details */}
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-200">{item.contactPerson}</p>
                      <p className="text-slate-500 text-[10px] mt-0.5">{item.emailAddress}</p>
                    </td>

                    {/* Outreach Status & Milestone Pipeline */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getStatusBadgeStyles(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                        {nextStage && (
                          <button
                            onClick={() => onUpgradeStatus(item, nextStage)}
                            className="flex items-center gap-0.5 text-[9px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                            title={`Advance Stage to ${nextStage}`}
                          >
                            <Milestone size={10} />
                            <span>Advance Deal</span>
                            <ChevronRight size={10} />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Notes & Milestones description */}
                    <td className="py-4 px-4 max-w-[280px]">
                      <p className="text-slate-300 line-clamp-2 leading-relaxed text-xs" title={item.notes}>
                        {item.notes || <span className="italic text-slate-600">No milestone details specified.</span>}
                      </p>
                    </td>

                    {/* Automated Follow-Up Email Reminder Status */}
                    <td className="py-4 px-4">
                      {item.followUpDate ? (
                        <div className="flex flex-col gap-1 items-start">
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-450">
                            <Calendar size={11} className="text-amber-500" />
                            {item.followUpDate}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 text-[9px] rounded font-bold border ${getEmailStatusBadgeStyles(
                              item.emailSentStatus
                            )}`}
                          >
                            {item.emailSentStatus === "Sent" ? "✓ Sent" : `⏳ ${item.emailSentStatus}`}
                          </span>
                          {item.emailSentDate && (
                            <span className="text-[8px] text-slate-500 leading-none">
                              {item.emailSentDate.split(" ")[0]}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-[11px] italic">Not scheduled</span>
                      )}
                    </td>

                    {/* Custom Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                        {item.emailSentStatus === "Pending" && item.followUpDate && (
                          <button
                            onClick={() => onSendImmediate(item)}
                            className="p-1 px-2 text-indigo-400 hover:bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                            title="Send follow-up email immediately via Gmail"
                          >
                            <Mail size={12} />
                            <span>Send Follow-up</span>
                          </button>
                        )}
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-[#E2E8F0] hover:bg-white/5 rounded-lg cursor-pointer"
                          title="Edit Outreach Info"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(item)}
                          className="p-1.5 text-rose-400 hover:text-rose-350 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                          title="Delete Outreach row"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
