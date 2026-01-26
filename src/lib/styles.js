/**
 * Common reusable styles using CSS variables
 * Import and use these to avoid hardcoded colors
 */

export const buttonStyles = {
  primary: {
    background:
      "linear-gradient(135deg, var(--accent-primary), var(--accent-hover))",
    color: "white",
    border: "none",
    borderRadius: "14px",
    padding: "16px 24px",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow:
      "0 10px 30px color-mix(in srgb, var(--accent-primary) 40%, transparent)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },

  secondary: {
    background: "rgba(255, 255, 255, 0.1)",
    color: "var(--text-primary)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "14px",
    padding: "16px 24px",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  },
};

export const inputStyles = {
  base: {
    width: "100%",
    padding: "16px",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    border: "1.5px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "14px",
    color: "#F8FAFC",
    fontSize: "15px",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
  },

  withIcon: {
    paddingLeft: "52px",
  },
};

export const cardStyles = {
  glass: {
    background: "rgba(30, 41, 59, 0.8)",
    backdropFilter: "blur(20px)",
    borderRadius: "24px",
    padding: "32px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.3)",
  },

  solid: {
    background: "var(--bg-surface)",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid var(--border-color)",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
};

export const gradientStyles = {
  primary:
    "linear-gradient(135deg, var(--accent-primary), var(--accent-hover))",
  text: "linear-gradient(135deg, #F8FAFC 0%, #94A3B8 100%)",
  background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
};

export const iconContainerStyles = {
  primary: {
    padding: "16px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, var(--accent-primary), var(--accent-hover))",
    boxShadow:
      "0 20px 40px color-mix(in srgb, var(--accent-primary) 40%, transparent)",
  },

  light: {
    padding: "16px",
    borderRadius: "14px",
    backgroundColor: "var(--accent-light)",
  },
};

// Focus handler for inputs
export const handleInputFocus = (e) => {
  e.target.style.borderColor = "var(--accent-primary)";
  e.target.style.boxShadow =
    "0 0 0 4px color-mix(in srgb, var(--accent-primary) 15%, transparent)";
};

export const handleInputBlur = (e) => {
  e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
  e.target.style.boxShadow = "none";
};

// Hover handlers for buttons
export const handleButtonHover = (e, isLoading = false) => {
  if (!isLoading) {
    e.target.style.transform = "translateY(-2px)";
    e.target.style.boxShadow =
      "0 15px 40px color-mix(in srgb, var(--accent-primary) 50%, transparent)";
  }
};

export const handleButtonLeave = (e) => {
  e.target.style.transform = "translateY(0)";
  e.target.style.boxShadow =
    "0 10px 30px color-mix(in srgb, var(--accent-primary) 40%, transparent)";
};
