(() => {
  "use strict";

  let activeNotice = null;
  let dismissTimer = null;

  function ensureRegion() {
    let region = document.querySelector("#appNoticeRegion");

    if (region) {
      return region;
    }

    region = document.createElement("div");
    region.id = "appNoticeRegion";
    region.className = "app-notice-region";
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-atomic", "true");
    document.body.appendChild(region);
    return region;
  }

  function clearDismissTimer() {
    if (dismissTimer) {
      window.clearTimeout(dismissTimer);
      dismissTimer = null;
    }
  }

  function dismiss() {
    clearDismissTimer();

    if (!activeNotice) {
      return;
    }

    const notice = activeNotice;
    activeNotice = null;
    notice.classList.remove("is-visible");

    window.setTimeout(() => {
      notice.remove();
    }, 180);
  }

  function show(message, options = {}) {
    const text = String(message || "").trim();

    if (!text) {
      return null;
    }

    const {
      state = "info",
      title = "",
      duration = state === "error" ? 7000 : 4200,
      persistent = false,
      actionLabel = "",
      onAction = null,
    } = options;

    dismiss();

    const region = ensureRegion();
    const notice = document.createElement("section");
    notice.className = "app-notice";
    notice.dataset.state = state;
    notice.setAttribute("role", state === "error" ? "alert" : "status");

    const marker = document.createElement("span");
    marker.className = "app-notice-marker";
    marker.setAttribute("aria-hidden", "true");

    const copy = document.createElement("div");
    copy.className = "app-notice-copy";

    if (title) {
      const heading = document.createElement("strong");
      heading.textContent = title;
      copy.appendChild(heading);
    }

    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    copy.appendChild(paragraph);

    const actions = document.createElement("div");
    actions.className = "app-notice-actions";

    if (actionLabel && typeof onAction === "function") {
      const actionButton = document.createElement("button");
      actionButton.type = "button";
      actionButton.className = "app-notice-action";
      actionButton.textContent = actionLabel;
      actionButton.addEventListener("click", () => {
        dismiss();
        window.setTimeout(() => onAction(), 0);
      });
      actions.appendChild(actionButton);
    }

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "app-notice-close";
    closeButton.setAttribute("aria-label", "안내 닫기");
    closeButton.textContent = "×";
    closeButton.addEventListener("click", dismiss);
    actions.appendChild(closeButton);

    notice.append(marker, copy, actions);
    region.replaceChildren(notice);
    activeNotice = notice;

    window.requestAnimationFrame(() => {
      notice.classList.add("is-visible");
    });

    clearDismissTimer();
    if (!persistent && duration > 0) {
      dismissTimer = window.setTimeout(dismiss, duration);
    }

    return notice;
  }

  function setButtonBusy(button, isBusy, busyText = "처리 중...", normalText = "") {
    if (!button) {
      return;
    }

    if (isBusy) {
      if (!button.dataset.normalText) {
        button.dataset.normalText = normalText || button.textContent || "";
      }
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      button.textContent = busyText;
      return;
    }

    button.disabled = false;
    button.removeAttribute("aria-busy");
    button.textContent = normalText || button.dataset.normalText || button.textContent;
    delete button.dataset.normalText;
  }

  window.HoonNoteFeedback = Object.freeze({
    show,
    dismiss,
    setButtonBusy,
  });
})();
