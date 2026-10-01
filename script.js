/* =========================================
   SHREE RAM TUITIONS — SHARED JAVASCRIPT
   ========================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
  initialiseNavigation();
  updateCopyrightYear();
  initialiseEnquiryForms();
});

/* =========================================
   MOBILE NAVIGATION
   ========================================= */

function initialiseNavigation() {
  const button = document.querySelector(".menu-toggle");
  const navigation = document.getElementById("primary-navigation");

  if (!button || !navigation) {
    return;
  }

  const mobileScreen = window.matchMedia("(max-width: 800px)");

  function closeMenu(restoreFocus = false) {
    navigation.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Open navigation menu");

    if (restoreFocus && mobileScreen.matches) {
      button.focus();
    }
  }

  function openMenu() {
    navigation.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
    button.setAttribute("aria-label", "Close navigation menu");
  }

  button.addEventListener("click", () => {
    const isOpen = button.getAttribute("aria-expanded") === "true";

    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    const isOpen = button.getAttribute("aria-expanded") === "true";

    if (event.key === "Escape" && isOpen) {
      closeMenu(true);
    }
  });

  document.addEventListener("click", (event) => {
    const isOpen = button.getAttribute("aria-expanded") === "true";

    if (
      isOpen &&
      !navigation.contains(event.target) &&
      !button.contains(event.target)
    ) {
      closeMenu(navigation.contains(document.activeElement));
    }
  });

  mobileScreen.addEventListener("change", () => {
    const focusWasInside = navigation.contains(document.activeElement);

    closeMenu(focusWasInside);
  });

  /*
   * Enable the collapsible mobile layout only after
   * the navigation handlers have been attached.
   * Without JavaScript, navigation remains visible.
   */
  document.documentElement.classList.add("js-enabled");
}

/* =========================================
   COPYRIGHT
   ========================================= */

function updateCopyrightYear() {
  const yearElement = document.getElementById("copyright-year");

  if (yearElement) {
    yearElement.textContent = String(new Date().getFullYear());
  }
}

/* =========================================
   SERVICE SELECTION FROM ENQUIRY LINKS
   ========================================= */

function prefillRequestedService(form) {
  const requestedService = new URLSearchParams(
    window.location.search
  ).get("service");

  if (!requestedService) {
    return;
  }

  const service = requestedService.trim().slice(0, 200);

  if (!service) {
    return;
  }

  const serviceField = form.querySelector('[name="service"]');
  const requirementField = form.querySelector('[name="requirement"]');

  /*
   * Match an existing dropdown option by its value
   * or visible text. No HTML is created from the URL.
   */
  if (serviceField instanceof HTMLSelectElement) {
    const matchingOption = Array.from(serviceField.options).find(
      (option) => {
        if (!option.value || option.disabled) {
          return false;
        }

        const requested = service.toLowerCase();

        return (
          option.value.toLowerCase() === requested ||
          option.textContent.trim().toLowerCase() === requested
        );
      }
    );

    if (matchingOption && !serviceField.value) {
      serviceField.value = matchingOption.value;
      serviceField.dispatchEvent(
        new Event("change", { bubbles: true })
      );
      return;
    }
  }

  if (
    serviceField instanceof HTMLInputElement &&
    !serviceField.value
  ) {
    serviceField.value = service;
    return;
  }

  /*
   * Subject-specific links can fill the requirements
   * field when there is no matching service option.
   */
  if (
    requirementField &&
    !requirementField.value &&
    (
      requirementField instanceof HTMLInputElement ||
      requirementField instanceof HTMLTextAreaElement
    )
  ) {
    requirementField.value = service;
  }
}

/* =========================================
   FORM VALIDATION
   ========================================= */

function attachFieldValidation(form) {
  const fields = form.querySelectorAll("input, textarea, select");

  fields.forEach((field) => {
    function validateField() {
      field.setCustomValidity("");

      if (field.disabled) {
        return;
      }

      const value = field.value.trim();

      if (field.required && !value) {
        field.setCustomValidity("Please complete this field.");
        return;
      }

      if (field.name === "name" && value) {
        if (value.length < 2 || value.length > 100) {
          field.setCustomValidity(
            "Please enter a name between 2 and 100 characters."
          );
        }
      }

      if (field.name === "phone" && value) {
        /*
         * Accept Indian mobile numbers with optional
         * +91, 91 or leading 0, and optional spaces/hyphens.
         */
        const indianMobile =
          /^(?:\+91[ -]?|91[ -]?|0)?[6-9](?:[ -]?[0-9]){9}$/;

        if (!indianMobile.test(value)) {
          field.setCustomValidity(
            "Enter a valid 10-digit Indian mobile number, optionally with +91."
          );
        }
      }

      if (field.name === "experience" && value) {
        const experience = Number(value);

        if (
          !Number.isFinite(experience) ||
          experience < 0 ||
          experience > 80 ||
          experience % 0.5 !== 0
        ) {
          field.setCustomValidity(
            "Enter experience between 0 and 80 years, in half-year increments."
          );
        }
      }
    }

    field.addEventListener("input", validateField);
    field.addEventListener("change", validateField);
    field.addEventListener("blur", validateField);

    /*
     * Also validate fields before submission, including
     * values entered by browser autofill.
     */
    field.validateEnquiryField = validateField;
  });
}

function validateForm(form) {
  form.querySelectorAll("input, textarea, select").forEach((field) => {
    if (typeof field.validateEnquiryField === "function") {
      field.validateEnquiryField();
    }
  });

  return form.reportValidity();
}

/* =========================================
   FORM STATUS MESSAGES
   ========================================= */

function getFormStatus(form) {
  let status = form.querySelector(".form-status");

  if (!status) {
    status = document.createElement("p");
    status.className = "form-status form-field-full";
    form.appendChild(status);
  }

  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.setAttribute("aria-atomic", "true");

  return status;
}

function showFormStatus(status, message, state) {
  status.dataset.state = state;
  status.textContent = message;
}

/* =========================================
   ENQUIRY AND TEACHER REGISTRATION FORMS
   ========================================= */

function initialiseEnquiryForms() {
  if (
    !("fetch" in window) ||
    !("AbortController" in window)
  ) {
    /*
     * Keep normal HTML form submission available
     * when enhanced submission is unsupported.
     */
    return;
  }

  document.querySelectorAll("form").forEach((form) => {
    const action = new URL(form.action, window.location.href);

    const isSupportedForm =
      action.origin === window.location.origin &&
      (
        action.pathname === "/contact" ||
        action.pathname === "/register-tutor"
      ) &&
      form.method.toLowerCase() === "post";

    if (!isSupportedForm) {
      return;
    }

    const isTeacherRegistration =
      action.pathname === "/register-tutor";

    const status = getFormStatus(form);

    attachFieldValidation(form);

    if (!isTeacherRegistration) {
      prefillRequestedService(form);
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (form.dataset.submitting === "true") {
        return;
      }

      if (!validateForm(form)) {
        return;
      }

      /*
       * Capture the form values before disabling its
       * submission controls.
       */
      const formData = new FormData(form);
      const body = new URLSearchParams();

      for (const [name, value] of formData.entries()) {
        if (typeof value === "string") {
          body.append(name, value.trim());
        }
      }

      const submitButtons = Array.from(
        form.querySelectorAll(
          'button[type="submit"], button:not([type]), input[type="submit"]'
        )
      );

      const previousDisabledStates = submitButtons.map(
        (button) => button.disabled
      );

      const controller = new AbortController();

      const timeout = window.setTimeout(() => {
        controller.abort();
      }, 20000);

      form.dataset.submitting = "true";
      form.setAttribute("aria-busy", "true");

      submitButtons.forEach((button) => {
        button.disabled = true;
      });

      showFormStatus(
        status,
        "Sending your details. Please wait…",
        "loading"
      );

      try {
        const response = await fetch(action.href, {
          method: "POST",
          headers: {
            "Accept": "application/json"
          },
          credentials: "same-origin",
          body,
          signal: controller.signal
        });

        const contentType =
          response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          showFormStatus(
            status,
            "We could not confirm your submission. Please contact us on +91 9213723510 before sending it again.",
            "error"
          );
          return;
        }

        const result = await response.json();

        const serverMessage =
          result &&
          typeof result.message === "string"
            ? result.message
            : "";

        if (!response.ok) {
          showFormStatus(
            status,
            serverMessage ||
              "Your submission could not be completed. Please try again or call +91 9213723510.",
            "error"
          );
          return;
        }

        form.reset();

        form.querySelectorAll("input, textarea, select").forEach(
          (field) => field.setCustomValidity("")
        );

        if (!isTeacherRegistration) {
          prefillRequestedService(form);
        }

        showFormStatus(
          status,
          serverMessage ||
            (
              isTeacherRegistration
                ? "Thank you! Your teacher registration has been received."
                : "Thank you! Your enquiry has been received. We will contact you soon."
            ),
          "success"
        );
      } catch (error) {
        /*
         * A connection failure does not tell us whether
         * the server saved the submission. Keep entered
         * details and avoid claiming it definitely failed.
         */
        const message =
          error.name === "AbortError"
            ? "The request took too long. We could not confirm whether your details were received. Please call +91 9213723510 before sending again."
            : "We could not confirm your submission because of a connection problem. Your details are still here. Please call +91 9213723510 before sending again.";

        showFormStatus(status, message, "error");
      } finally {
        window.clearTimeout(timeout);

        delete form.dataset.submitting;
        form.removeAttribute("aria-busy");

        submitButtons.forEach((button, index) => {
          button.disabled = previousDisabledStates[index];
        });
      }
    });
  });
}