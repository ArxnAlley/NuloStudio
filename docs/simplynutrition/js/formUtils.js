const SimplyForms = (() => {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function showFloatingPill(message, type = "success") {
    const pill = document.createElement("div");
    pill.className =
      "formSuccessPill" + (type === "error" ? " formErrorPill" : "");
    pill.textContent = message;
    document.body.appendChild(pill);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => pill.classList.add("visible")),
    );
    setTimeout(
      () => {
        pill.classList.remove("visible");
        setTimeout(
          () => pill.parentNode && pill.parentNode.removeChild(pill),
          400,
        );
      },
      type === "error" ? 3200 : 2800,
    );
  }

  function showFormError(message) {
    showFloatingPill(message, "error");
  }

  function clearFieldFeedback(form) {
    form
      .querySelectorAll(".formInput, .formSelect, .formTextarea, .vipInput")
      .forEach((field) => {
        field.classList.remove("error", "valid", "inputError");
      });

    form.querySelectorAll(".formErrorText").forEach((error) => error.remove());
  }

  function getPhoneDigits(value) {
    return value.replace(/\D/g, "");
  }

  function hasDigitsOnly(value) {
    return /^\d+$/.test(value);
  }

  function getValidationMessage(field) {
    const rawValue = field.value.trim();
    const fieldType = field.type.toLowerCase();
    const fieldName = (field.name || field.id || "").toLowerCase();
    const isNameField = ["firstname", "lastname", "vipname", "name"].includes(
      fieldName,
    );
    const isMessageField = fieldName === "message";
    const isPhoneField = fieldType === "tel" || fieldName === "phone";

    if (field.hasAttribute("required") && !rawValue) {
      return "This field is required.";
    }

    if (!rawValue) {
      return "";
    }

    if (isNameField && rawValue.length < 2) {
      return "Please enter at least 2 characters.";
    }

    if (fieldType === "email" && !EMAIL_REGEX.test(rawValue)) {
      return "Please enter a valid email address.";
    }

    if (isPhoneField && !hasDigitsOnly(rawValue)) {
      return "Please use digits only.";
    }

    if (isPhoneField && getPhoneDigits(rawValue).length < 10) {
      return "Please enter at least 10 digits.";
    }

    if (isMessageField && rawValue.length < 10) {
      return "Please enter at least 10 characters.";
    }

    return "";
  }

  function showFieldError(field, message) {
    field.classList.add("error", "inputError");
    const error = document.createElement("span");
    error.className = "formErrorText";
    error.textContent = message;
    field.parentNode.appendChild(error);
  }

  function validateForm(form) {
    let isValid = true;
    clearFieldFeedback(form);

    form.querySelectorAll("input, textarea, select").forEach((field) => {
      const message = getValidationMessage(field);
      if (message) {
        isValid = false;
        showFieldError(field, message);
      } else if (field.value.trim()) {
        field.classList.add("valid");
      }
    });

    return isValid;
  }

  function removeFieldErrorState(event) {
    const field = event.target;
    if (
      !(field instanceof HTMLInputElement) &&
      !(field instanceof HTMLTextAreaElement) &&
      !(field instanceof HTMLSelectElement)
    ) {
      return;
    }

    field.classList.remove("error", "inputError");
    const error = field.parentNode.querySelector(".formErrorText");
    if (error) error.remove();
  }

  function attachFieldListeners(form) {
    ["input", "change"].forEach((eventName) => {
      form.addEventListener(eventName, removeFieldErrorState);
    });
  }

  function resetFormState(form) {
    form.reset();
    clearFieldFeedback(form);
  }

  function setupFormSubmission(form, options = {}) {
    if (!form) return;

    const submitButton = form.querySelector('[type="submit"]');
    const originalText = submitButton
      ? submitButton.textContent.trim()
      : "Submit";
    const loadingText = options.loadingText || "Sending...";

    attachFieldListeners(form);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!validateForm(form)) {
        showFormError(
          options.validationErrorMessage ||
            "Please fix the highlighted fields.",
        );
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = loadingText;
      }

      try {
        const response = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error(
            `Form submission failed with status ${response.status}`,
          );
        }

        resetFormState(form);

        if (typeof options.onSuccess === "function") {
          options.onSuccess(form);
        } else if (options.successMessage) {
          showFloatingPill(options.successMessage, "success");
        }
      } catch (error) {
        if (typeof options.onError === "function") {
          options.onError(error, form);
        }
        showFormError(
          options.errorMessage ||
            "Something went wrong. Please check your connection and try again.",
        );
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }
      }
    });
  }

  return {
    EMAIL_REGEX,
    setupFormSubmission,
    showFormError,
    showFloatingPill,
    validateForm,
    resetFormState,
  };
})();

window.SimplyForms = SimplyForms;
