import { sendSurveyResponse } from "../services/api";

// Example usage inside your form submission handler
const handleSubmit = async (formData: any) => {
  sendSurveyResponse(formData).then((res) => {
    console.log("Response saved:", res);
  });
};