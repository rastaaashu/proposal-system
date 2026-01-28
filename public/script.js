// Get all the elements
const acceptBtn = document.getElementById("btn-accept");
const declineBtn = document.getElementById("btn-decline");
const cancelBtn = document.getElementById("btn-cancel");
const formWrapper = document.getElementById("response-form");
const formTitle = document.getElementById("form-title");
const decisionField = document.getElementById("decisionField");
const statusEl = document.getElementById("status");
const form = document.getElementById("proposalForm");

// Show form when Accept is clicked
acceptBtn.addEventListener("click", () => {
  decisionField.value = "accepted";
  formTitle.textContent = "Accept proposal";
  formTitle.style.color = "#7ee787";
  formWrapper.classList.add("visible");
  statusEl.classList.remove("visible");
  statusEl.textContent = "";
  
  // Smooth scroll to form on mobile
  setTimeout(() => {
    formWrapper.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, 100);
});

// Show form when Decline is clicked
declineBtn.addEventListener("click", () => {
  decisionField.value = "declined";
  formTitle.textContent = "Decline proposal";
  formTitle.style.color = "#ff7b72";
  formWrapper.classList.add("visible");
  statusEl.classList.remove("visible");
  statusEl.textContent = "";
  
  // Smooth scroll to form on mobile
  setTimeout(() => {
    formWrapper.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, 100);
});

// Hide form when Cancel is clicked
cancelBtn.addEventListener("click", () => {
  formWrapper.classList.remove("visible");
  form.reset();
  statusEl.classList.remove("visible");
  statusEl.textContent = "";
});

// Handle form submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  // Show loading state
  statusEl.textContent = "Sending your response...";
  statusEl.className = "status visible";
  statusEl.style.color = "#a78bfa";
  
  // Disable submit button
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";

  // Get form data
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  try {
    // Send to backend
    const response = await fetch("api/proposal/response", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error("Failed to send response");
    }

    const result = await response.json();

    // Show success message
    statusEl.textContent = data.decision === "accepted" 
      ? "✓ Proposal accepted! I'll contact you within 24 hours to discuss next steps."
      : "✓ Response received. Thank you for your time.";
    statusEl.className = "status visible ok";

    // Reset form after 2 seconds
    setTimeout(() => {
      form.reset();
      formWrapper.classList.remove("visible");
      statusEl.classList.remove("visible");
    }, 3000);

  } catch (error) {
    console.error("Error:", error);
    statusEl.textContent = "✗ Error sending response. Please contact me directly via Telegram or email.";
    statusEl.className = "status visible err";
  } finally {
    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>→</span> Submit response';
  }
});

// Auto-resize textarea on mobile
const textarea = document.getElementById("notes");
if (textarea) {
  textarea.addEventListener("input", function() {
    this.style.height = "auto";
    this.style.height = (this.scrollHeight) + "px";
  });
}

// Add touch feedback for mobile buttons
document.querySelectorAll("button").forEach(btn => {
  btn.addEventListener("touchstart", function() {
    this.style.transform = "scale(0.98)";
  });
  
  btn.addEventListener("touchend", function() {
    this.style.transform = "";
  });
});
