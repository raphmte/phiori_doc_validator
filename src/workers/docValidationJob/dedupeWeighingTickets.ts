import {
  DocValidationExtractedDocument,
  TicketExtractedFields,
} from "../../modules/docValidation/types";

export function dedupeWeighingTicketsByTicketNumber(
  weighingTickets: DocValidationExtractedDocument<TicketExtractedFields>[],
): DocValidationExtractedDocument<TicketExtractedFields>[] {
  const seenTicketNumbers = new Set<string>();

  return weighingTickets.filter((ticket) => {
    if (!ticket.present || !ticket.ticketNumber) return true;
    if (seenTicketNumbers.has(ticket.ticketNumber)) return false;
    seenTicketNumbers.add(ticket.ticketNumber);
    return true;
  });
}
