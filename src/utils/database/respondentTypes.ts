
export type RespondentType = 
  | "Criminal Networks" 
  | "Law Enforcement" 
  | "Community" 
  | "Government" 
  | "NGO" 
  | "Business" 
  | "Security" 
  | "Demand Center";

export const mapRespondentTypeToEnum = (respondentType: string): RespondentType => {
  const mapping: Record<string, RespondentType> = {
    "Criminal Networks": "Criminal Networks",
    "Criminal Networks/Traffickers": "Criminal Networks",
    "Law Enforcement": "Law Enforcement",
    "Law Enforcement Officers": "Law Enforcement",
    "Community": "Community",
    "Community/Vulnerable community": "Community",
    "Digital/Virtual Community": "Community",
    "Government": "Government",
    "NGO": "NGO",
    "Business": "Business",
    "Security": "Security",
    "Demand Center": "Demand Center",
    "Demand Center Operators": "Demand Center",
    "Transporters": "Criminal Networks",
    "Customers": "Demand Center",
    "Financial Networks": "Criminal Networks",
    "Survivors/Families of Survivors": "Community",
    "Lawyers": "Law Enforcement"
  };
  
  return mapping[respondentType] || "Criminal Networks";
};
