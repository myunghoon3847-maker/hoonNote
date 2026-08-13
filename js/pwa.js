(() => {
  "use strict";

  const feedback = window.HoonNoteFeedback || null;
  const installAppButton = document.querySelector("#installAppButton");
  const pwaUpdateBanner = document.querySelector("#pwaUpdateBanner");
  const applyUpdateButton = document.querySelector("#applyUpdateButton");
  const dismissUpdateButton = document.querySelector("#dismissUpdateButton");
  const pwaStatusText = document.querySelector("#pwaStatusText");
  const pwaHelpButton = document.querySelector("#pwaHelpButton");
  const pwaInstallHelp = document.querySelector("#pwaInstallHelp");

  let deferredInstallPrompt = null;
  let serviceWorkerRegistration = null;
  let isApplyingUpdate = false;
  let hasReloadedForUpdate = false;
  let updateApplyTimer = null;
  let periodicUpdateTimer = null;
  const UPDATE_APPLY_TIMEOUT_MS = 10000;
  const PERIODIC_UPDATE_INTERVAL_MS = 30 * 60 * 1000;

  function isStandaloneMode() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  function isTrustedWebActivity() {
    const referrer = document.referrer || "";
    return referrer.startsWith("android-app://com.hooncompany.hoonnote");
  }

  function isPackagedAppMode() {
    return isStandaloneMode() || isTrustedWebActivity();
  }

  function isIosDevice() {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  }

  function applyPackagedAppUi() {
    if (!isTrustedWebActivity()) {
      return;
    }

    document.documentElement.dataset.appContext = "twa";

    if (pwaHelpButton) {
      pwaHelpButton.hidden = true;
    }

    if (pwaInstallHelp) {
      pwaInstallHelp.hidden = true;
    }
  }

  function setInstallButtonVisible(isVisible) {
    if (!installAppButton) {
      return;
    }

    installAppButton.hidden = !isVisible;
    installAppButton.setAttribute("aria-hidden", String(!isVisible));
  }

  function setPwaStatus(message) {
    if (pwaStatusText) {
      pwaStatusText.textContent = message;
    }
  }

  function refreshInstallStatus() {
    if (isPackagedAppMode()) {
      setInstallButtonVisible(false);
      setPwaStatus(
        isTrustedWebActivity()
          ? "Google Play용 Creative Note 앱으로 실행 중입니다."
          : "Creative Note가 이 기기에 앱으로 설치되어 실행 중입니다."
      );
      return;
    }

    if (deferredInstallPrompt) {
      setInstallButtonVisible(true);
      setPwaStatus("이 기기에 Creative Note를 앱으로 설치할 수 있습니다.");
      return;
    }

    setInstallButtonVisible(false);

    if (isIosDevice()) {
      setPwaStatus("Safari의 공유 메뉴에서 홈 화면에 추가할 수 있습니다.");
      return;
    }

    setPwaStatus("현재 브라우저에서 실행 중입니다. 설치 방법은 아래 안내에서 확인할 수 있습니다.");
  }

  function showUpdateBanner() {
    if (!pwaUpdateBanner) {
      return;
    }

    pwaUpdateBanner.hidden = false;
    pwaUpdateBanner.setAttribute("aria-hidden", "false");
  }

  function hideUpdateBanner() {
    if (!pwaUpdateBanner) {
      return;
    }

    pwaUpdateBanner.hidden = true;
    pwaUpdateBanner.setAttribute("aria-hidden", "true");
  }

  async function handleInstallClick() {
    if (!deferredInstallPrompt) {
      refreshInstallStatus();

      if (pwaInstallHelp) {
        pwaInstallHelp.hidden = false;
      }

      if (pwaHelpButton) {
        pwaHelpButton.textContent = "설치 방법 접기";
      }

      return;
    }

    feedback?.setButtonBusy?.(
      installAppButton,
      true,
      "설치 확인 중...",
      "앱 설치"
    );

    try {
      await deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;

      if (choice && choice.outcome === "accepted") {
        setPwaStatus("Creative Note 설치를 진행하고 있습니다.");
      } else {
        setPwaStatus("설치를 취소했습니다. 필요할 때 다시 설치할 수 있습니다.");
      }
    } catch (error) {
      console.error("PWA 설치 요청 실패:", error);
      setPwaStatus("자동 설치 창을 열지 못했습니다. 설치 방법 안내를 확인하세요.");
      feedback?.show?.("브라우저가 자동 설치 창을 열지 못했습니다. 메뉴의 설치 방법 안내를 따라 진행하세요.", {
        state: "warning",
        title: "앱 설치 안내",
        duration: 6500,
      });
    } finally {
      deferredInstallPrompt = null;
      feedback?.setButtonBusy?.(
        installAppButton,
        false,
        "설치 확인 중...",
        "앱 설치"
      );
      refreshInstallStatus();
    }
  }

  function handleHelpClick() {
    if (!pwaInstallHelp || !pwaHelpButton) {
      return;
    }

    const willShow = pwaInstallHelp.hidden;
    pwaInstallHelp.hidden = !willShow;
    pwaHelpButton.textContent = willShow ? "설치 방법 접기" : "설치 방법 보기";
  }

  function handleWaitingWorker(registration) {
    if (!registration || !registration.waiting) {
      return;
    }

    serviceWorkerRegistration = registration;
    showUpdateBanner();
  }

  async function applyServiceWorkerUpdate() {
    const waitingWorker = serviceWorkerRegistration?.waiting;

    if (!waitingWorker || isApplyingUpdate) {
      return;
    }

    if (typeof hasUnsavedEditorChanges === "function" && hasUnsavedEditorChanges()) {
      const shouldProceed = window.confirm(
        "저장하지 않은 메모 내용이 있습니다. 업데이트를 적용하면 새로고침되어 내용이 사라질 수 있습니다. 그래도 업데이트할까요?"
      );

      if (!shouldProceed) {
        return;
      }
    }

    isApplyingUpdate = true;

    feedback?.setButtonBusy?.(
      applyUpdateButton,
      true,
      "업데이트 적용 중...",
      "업데이트"
    );

    waitingWorker.postMessage({ type: "SKIP_WAITING" });

    if (updateApplyTimer) {
      window.clearTimeout(updateApplyTimer);
    }

    updateApplyTimer = window.setTimeout(() => {
      if (!isApplyingUpdate || hasReloadedForUpdate) {
        return;
      }

      isApplyingUpdate = false;
      feedback?.setButtonBusy?.(
        applyUpdateButton,
        false,
        "업데이트 적용 중...",
        "업데이트"
      );
      feedback?.show?.("업데이트 적용이 지연되고 있습니다. 앱을 완전히 닫았다가 다시 실행하세요.", {
        state: "warning",
        title: "업데이트 대기 중",
        duration: 8000,
      });
    }, UPDATE_APPLY_TIMEOUT_MS);
  }

  function watchRegistration(registration) {
    if (!registration) {
      return;
    }

    serviceWorkerRegistration = registration;

    if (registration.waiting && navigator.serviceWorker.controller) {
      handleWaitingWorker(registration);
    }

    registration.addEventListener("updatefound", () => {
      const installingWorker = registration.installing;

      if (!installingWorker) {
        return;
      }

      installingWorker.addEventListener("statechange", () => {
        if (
          installingWorker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          handleWaitingWorker(registration);
        }
      });
    });
  }

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      setPwaStatus("이 브라우저는 앱 설치와 자동 업데이트를 지원하지 않습니다.");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register(
        "./service-worker.js?v=471",
        { updateViaCache: "none" }
      );

      watchRegistration(registration);

      window.addEventListener("focus", () => {
        registration.update().catch(() => {});
      });

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          registration.update().catch(() => {});
        }
      });

      window.addEventListener("pageshow", (event) => {
        if (event.persisted) {
          registration.update().catch(() => {});
        }
      });

      if (periodicUpdateTimer) {
        window.clearInterval(periodicUpdateTimer);
      }
      periodicUpdateTimer = window.setInterval(() => {
        if (navigator.onLine !== false) {
          registration.update().catch(() => {});
        }
      }, PERIODIC_UPDATE_INTERVAL_MS);
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      setPwaStatus("앱 업데이트 기능을 초기화하지 못했습니다. 새로고침 후 다시 확인하세요.");
      feedback?.show?.("자동 업데이트 기능을 준비하지 못했습니다. 인터넷 연결을 확인하고 페이지를 새로고침하세요.", {
        state: "warning",
        title: "업데이트 확인 실패",
        actionLabel: "새로고침",
        onAction: () => window.location.reload(),
      });
    }
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    refreshInstallStatus();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    setInstallButtonVisible(false);
    setPwaStatus("Creative Note 설치가 완료되었습니다.");
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!isApplyingUpdate || hasReloadedForUpdate) {
        return;
      }

      hasReloadedForUpdate = true;
      if (updateApplyTimer) {
        window.clearTimeout(updateApplyTimer);
        updateApplyTimer = null;
      }
      window.location.reload();
    });
  }

  installAppButton?.addEventListener("click", handleInstallClick);
  pwaHelpButton?.addEventListener("click", handleHelpClick);
  applyUpdateButton?.addEventListener("click", applyServiceWorkerUpdate);
  dismissUpdateButton?.addEventListener("click", hideUpdateBanner);

  applyPackagedAppUi();
  refreshInstallStatus();
  window.addEventListener("load", registerServiceWorker);
})();
