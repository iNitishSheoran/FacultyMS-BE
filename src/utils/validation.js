// utils/validation.js
const validator = require("validator");

// ✅ Phone number validator (Indian, 10-digit starting with 6–9)
const isValidPhoneNumber = (phone) => /^[6-9]\d{9}$/.test(phone);

// ✅ Email validator (basic RFC 5322 compliant regex)
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ✅ Signup validation
const validateSignUpData = (data) => {
  const requiredFields = [
    "fullName",
    "email",
    "phoneNo",
    "age",
    "gender",
    "department",
    "subjects",
    "password",
  ];

  // Check missing fields
  for (const field of requiredFields) {
    if (!data[field]) {
      return { error: { message: `${field} is required` } };
    }
  }

  // fullName
  if (
    typeof data.fullName !== "string" ||
    data.fullName.trim().length < 3 ||
    data.fullName.trim().length > 50
  ) {
    return {
      error: { message: "Full name must be 3–50 characters long" },
    };
  }

  // phoneNo
  if (!isValidPhoneNumber(data.phoneNo)) {
    return { error: { message: "Invalid phone number format" } };
  }

  // email
  if (!isValidEmail(data.email)) {
    return { error: { message: "Invalid email format" } };
  }

  // age
  if (typeof data.age !== "number" || data.age < 18 || data.age > 100) {
    return { error: { message: "Age must be between 18 and 100" } };
  }

  // gender
  const validGenders = ["male", "female", "others"];
  if (!validGenders.includes(data.gender)) {
    return { error: { message: "Gender must be male, female, or others" } };
  }

  // department
  const validDepartments = ["cse", "it", "ece"];
  if (!validDepartments.includes(data.department)) {
    return { error: { message: "Department must be cse, it, or ece" } };
  }

  // subjects (must be array with at least 1 string)
  if (!Array.isArray(data.subjects) || data.subjects.length === 0) {
    return { error: { message: "At least one subject must be provided" } };
  }
  for (const subject of data.subjects) {
    if (typeof subject !== "string" || subject.trim().length < 2) {
      return { error: { message: "Each subject must be a valid string (min 2 chars)" } };
    }
  }

  // password (using validator.isStrongPassword)
  if (!validator.isStrongPassword(data.password)) {
    return {
      error: {
        message:
          "Password must be strong (min 8 chars, include uppercase, lowercase, number, and symbol)",
      },
    };
  }

  return { error: null }; // ✅ Valid
};

module.exports = { validateSignUpData };
