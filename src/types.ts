export enum OutreachStatus {
  INITIAL_OUTREACH = "Initial Outreach",
  IN_DISCUSSION = "In Discussion",
  PROPOSAL_SENT = "Proposal Sent",
  NDA_SIGNED = "NDA Signed",
  WON = "Partnership Won",
  LOST = "Closed / Declined"
}

export interface OutreachItem {
  id: string; // Typically generated UUID or row index
  companyName: string;
  contactPerson: string;
  emailAddress: string;
  phone: string;
  status: OutreachStatus;
  lastContactDate: string; // YYYY-MM-DD
  followUpDate: string; // YYYY-MM-DD
  followUpTemplateId: string; // ID of pre-defined template
  notes: string;
  emailSentStatus: "Pending" | "Sent" | "N/A";
  emailSentDate?: string; // YYYY-MM-DD HH:mm
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export const PREDEFINED_TEMPLATES: EmailTemplate[] = [
  {
    id: "intro-followup",
    name: "Initial Outreach Follow-up",
    subject: "Following up from Ejicode Company - Digital Solutions",
    body: `Hi {ContactPerson},\n\nI hope you're having a great week!\n\nI'm following up on our previous conversation regarding Ejicode's digital and technology software solutions. We'd love to learn more about {CompanyName}'s current challenges and see how our tailored systems and services can assist your team in achieving your digital product milestones.\n\nDo you have 15 minutes for a quick introductory call later this week?\n\nBest regards,\n{SalesPerson}\nSales Team | Ejicode Company\n{SalesEmail}`
  },
  {
    id: "proposal-followup",
    name: "Proposal Review Follow-up",
    subject: "Proposal Status Update - Ejicode Company",
    body: `Hi {ContactPerson},\n\nI hope you are well. I wanted to follow up on the proposal we sent over for {CompanyName}'s upcoming project.\n\nOur team is extremely excited about the opportunity to partner with you. Have you and your team had a chance to review the terms or discuss any initial thoughts?\n\nWe are happy to answer any questions or hop on a brief call to adjust the milestone timeline as needed.\n\nBest regards,\n{SalesPerson}\nSales Team | Ejicode Company\n{SalesEmail}`
  },
  {
    id: "milestone-checkin",
    name: "Milestone Discussion Check-in",
    subject: "Project Milestone Roadmap - Ejicode Company",
    body: `Hi {ContactPerson},\n\nHope all is well at {CompanyName}!\n\nAs we finalize the planning for your engineering milestones, I wanted to schedule a brief touchpoint to align on our NDA requirements and next-step timelines.\n\nPlease let me know your availability for a 10-minute sync this or next week.\n\nBest regards,\n{SalesPerson}\nSales Team | Ejicode Company\n{SalesEmail}`
  },
  {
    id: "reengage",
    name: "Re-engagement outreach",
    subject: "Checking in - Ejicode Company Solutions",
    body: `Hi {ContactPerson},\n\nIt's been a little while since our last touchpoint, so I wanted to re-engage and see how things are going with {CompanyName}'s technology milestones.\n\nWe have recently rolled out some incredible new acceleration frameworks that significantly reduce development timeline costs. I'd love to share some of our recent client success metrics with you.\n\nLet me know if you would be open to re-connecting soon!\n\nBest regards,\n{SalesPerson}\nSales Team | Ejicode Company\n{SalesEmail}`
  }
];
