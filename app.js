/******************************************************************
 * Workbook Automation Tool
 * app.js V2
 * Part 1A
 * Globals • DOM Cache • Bootstrap • Initialization
 ******************************************************************/
"use strict";

/* ============================================================
   APPLICATION STATE
============================================================ */

const AppState = {

    workbook: null,
    workbookName: "",
    workbookType: "",
    selectedSheet: "",

    prompt: {
        offer: "",
        context: "",
        sheet: "",
        final: ""
    },

    dirty: false,

    loading: false,

    workflowStep: 1

};

/* ============================================================
   DOM CACHE
============================================================ */

const UI = {

    /* Header */

    projectRef:
        document.getElementById("projectRef"),

    taskNumber:
        document.getElementById("taskNumber"),

    fetchButton:
        document.getElementById("fetchWorkbookBtn"),

    /* KPI */

    workbookName:
        document.getElementById("workbookName"),

    workbookType:
        document.getElementById("workbookType"),

    sheetCount:
        document.getElementById("sheetCount"),

    piiStatus:
        document.getElementById("piiStatus"),

    aiStatus:
        document.getElementById("aiStatus"),

    /* Prompt Builder */

    sheetSelector:
        document.getElementById("sheetSelector"),

    offer:
        document.getElementById("offerDescription"),

    context:
        document.getElementById("workbookContext"),

    sheetPrompt:
        document.getElementById("sheetPrompt"),

    finalPrompt:
        document.getElementById("finalPrompt"),

    /* Preview */

    previewButton:
        document.getElementById("previewPromptBtn"),

    previewArea:
        document.getElementById("previewPrompt"),

    previewModal:
        document.getElementById("promptPreviewModal"),

    copyButton:
        document.getElementById("copyPromptBtn"),

    copyPreviewButton:
        document.getElementById("copyPreviewBtn"),

    /* Status */

    offerStatus:
        document.getElementById("offerStatus"),

    workbookStatus:
        document.getElementById("workbookStatus"),

    sheetStatus:
        document.getElementById("sheetStatus"),

    piiResult:
        document.getElementById("piiResult"),

    validationResult:
        document.getElementById("validationResult"),

    /* Loading */

    loadingOverlay:
        document.getElementById("loadingOverlay"),

    /* Toast */

    liveToast:
        document.getElementById("liveToast")

};

/* ============================================================
   BOOTSTRAP COMPONENTS
============================================================ */

const BootstrapUI = {

    toast: null,

    previewModal: null

};

/* ============================================================
   INITIALIZE
============================================================ */

function initializeApplication() {

    initializeBootstrap();

    cacheDefaults();

    registerBaseEvents();

    resetInterface();

    console.log(
        "Workbook Automation Tool Initialized"
    );

}

/* ============================================================
   BOOTSTRAP
============================================================ */

function initializeBootstrap() {

    if (UI.liveToast) {

        BootstrapUI.toast =
            bootstrap.Toast.getOrCreateInstance(
                UI.liveToast
            );

    }

    if (UI.previewModal) {

        BootstrapUI.previewModal =
            bootstrap.Modal.getOrCreateInstance(
                UI.previewModal
            );

    }

}

/* ============================================================
   DEFAULT VALUES
============================================================ */

function cacheDefaults() {

    AppState.workflowStep = 1;

    AppState.loading = false;

    AppState.dirty = false;

}

/* ============================================================
   RESET UI
============================================================ */

function resetInterface() {

    if (UI.workbookName)
        UI.workbookName.textContent = "Not Loaded";

    if (UI.workbookType)
        UI.workbookType.textContent = "-";

    if (UI.sheetCount)
        UI.sheetCount.textContent = "0";

    if (UI.aiStatus)
        UI.aiStatus.textContent = "Ready";

    if (UI.piiStatus)
        UI.piiStatus.textContent = "None";

    [
        UI.offer,
        UI.context,
        UI.sheetPrompt,
        UI.finalPrompt
    ].forEach(element => {

        if (!element) return;

        element.value = "";

        element.readOnly = true;

    });

}

/******************************************************************
 * Part 1B
 * Event Registration
 * Workflow
 * Loading
 * Toast
 * Common Helpers
 ******************************************************************/

/* ============================================================
   EVENT REGISTRATION
============================================================ */

function registerBaseEvents() {

    UI.fetchButton?.addEventListener(
        "click",
        fetchWorkbook
    );

    UI.sheetSelector?.addEventListener(
        "change",
        handleSheetSelection
    );
}

/* ============================================================
   WORKFLOW
============================================================ */

function setWorkflowStep(step) {

    AppState.workflowStep = step;

    const steps = document.querySelectorAll(".workflow-step");

    steps.forEach((item, index) => {

        item.classList.remove(
            "active",
            "completed"
        );

        if ((index + 1) < step) {

            item.classList.add("completed");

        }

        if ((index + 1) === step) {

            item.classList.add("active");

        }

    });

}

/* ============================================================
   LOADING
============================================================ */

function showLoading() {

    AppState.loading = true;

    UI.loadingOverlay?.classList.remove("d-none");

}

function hideLoading() {

    AppState.loading = false;

    UI.loadingOverlay?.classList.add("d-none");

}

/* ============================================================
   BUTTON STATE
============================================================ */

function disableFetchButton() {

    if (UI.fetchButton) {

        UI.fetchButton.disabled = true;

        UI.fetchButton.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2"></span>
            Fetching...
        `;

    }

}

function enableFetchButton() {

    if (UI.fetchButton) {

        UI.fetchButton.disabled = false;

        UI.fetchButton.innerHTML = `
            <i class="bi bi-cloud-download me-2"></i>
            Fetch Workbook
        `;

    }

}

/* ============================================================
   TOAST
============================================================ */

function showToast(message) {

    if (!BootstrapUI.toast) {

        alert(message);

        return;

    }

    const body =
        UI.liveToast.querySelector(".toast-body");

    if (body) {

        body.innerHTML = `
            <i class="bi bi-check-circle-fill me-2"></i>
            ${message}
        `;

    }

    BootstrapUI.toast.show();

}

/* ============================================================
   STATUS BADGES
============================================================ */

function setBadge(element, text, color) {

    if (!element) return;

    element.className = `badge bg-${color}`;

    element.textContent = text;

}

function updatePromptStatus(section, state) {

    const map = {

        offer: UI.offerStatus,

        workbook: UI.workbookStatus,

        sheet: UI.sheetStatus

    };

    const badge = map[section];

    if (!badge) return;

    switch (state) {

        case "ready":

            setBadge(
                badge,
                "Ready",
                "success"
            );

            break;

        case "editing":

            setBadge(
                badge,
                "Editing",
                "warning"
            );

            break;

        case "waiting":

            setBadge(
                badge,
                "Waiting",
                "secondary"
            );

            break;

        default:

            setBadge(
                badge,
                state,
                "primary"
            );

    }

}

/* ============================================================
   AI STATUS
============================================================ */

function updateAIStatus(message) {

    if (!UI.aiStatus) return;

    UI.aiStatus.textContent = message;

}

/* ============================================================
   PII STATUS
============================================================ */

function updatePIIBadge(hasPII, count = 0) {

    if (!UI.piiStatus) return;

    if (hasPII) {

        UI.piiStatus.className =
            "badge bg-danger";

        UI.piiStatus.textContent =
            `${count} Found`;

    }

    else {

        UI.piiStatus.className =
            "badge bg-success";

        UI.piiStatus.textContent =
            "None";

    }

}

/* ============================================================
   SAFE VALUE
============================================================ */

function safeText(value, fallback = "-") {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        return fallback;

    }

    return value;

}

/******************************************************************
 * Part 1C
 * Clipboard
 * Prompt Preview
 * Local Storage
 * Utility Functions
 * Reset Helpers
 ******************************************************************/

/* ============================================================
   CLIPBOARD
============================================================ */

async function copyToClipboard(text) {

    try {

        if (!text) {

            showToast("Nothing to copy.");

            return false;

        }

        await navigator.clipboard.writeText(text);

        showToast("Copied successfully.");

        return true;

    }

    catch (error) {

        console.error(error);

        alert("Unable to copy.");

        return false;

    }

}

/* ============================================================
   PREVIEW MODAL
============================================================ */

function updatePreview() {

    if (!UI.previewArea || !UI.finalPrompt)
        return;

    UI.previewArea.value =
        UI.finalPrompt.value;

}

function openPreview() {

    updatePreview();

    BootstrapUI.previewModal?.show();

}

function closePreview() {

    BootstrapUI.previewModal?.hide();

}

/* ============================================================
   CHARACTER COUNT
============================================================ */

function characterCount(text) {

    return text
        ? text.length
        : 0;

}

function wordCount(text) {

    if (!text) return 0;

    return text
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .length;

}

/* ============================================================
   LOCAL STORAGE
============================================================ */

const STORAGE_KEY =
    "WorkbookAutomationDraft";

function saveDraft() {

    try {

        const draft = {

            offer:
                UI.offer?.value || "",

            context:
                UI.context?.value || "",

            sheet:
                UI.sheetPrompt?.value || "",

            prompt:
                UI.finalPrompt?.value || "",

            selectedSheet:
                UI.sheetSelector?.value || "",

            savedOn:
                new Date().toISOString()

        };

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(draft)
        );

    }

    catch (error) {

        console.warn(error);

    }

}

function loadDraft() {

    try {

        const draft =
            JSON.parse(
                localStorage.getItem(STORAGE_KEY)
            );

        if (!draft) return;

        if (UI.offer)
            UI.offer.value =
                draft.offer || "";

        if (UI.context)
            UI.context.value =
                draft.context || "";

        if (UI.sheetPrompt)
            UI.sheetPrompt.value =
                draft.sheet || "";

        if (UI.finalPrompt)
            UI.finalPrompt.value =
                draft.prompt || "";

    }

    catch (error) {

        console.warn(error);

    }

}

function clearDraft() {

    localStorage.removeItem(
        STORAGE_KEY
    );

}

/* ============================================================
   RESET PROMPT BUILDER
============================================================ */

function clearPromptBuilder() {

    [

        UI.offer,

        UI.context,

        UI.sheetPrompt,

        UI.finalPrompt

    ].forEach(element => {

        if (element)
            element.value = "";

    });

    updatePromptStatus(
        "offer",
        "waiting"
    );

    updatePromptStatus(
        "workbook",
        "waiting"
    );

    updatePromptStatus(
        "sheet",
        "waiting"
    );

}

/* ============================================================
   RESET SHEET LIST
============================================================ */

function resetSheetSelector() {

    if (!UI.sheetSelector)
        return;

    UI.sheetSelector.innerHTML = `
        <option value="">
            Select Worksheet
        </option>
    `;

}

/* ============================================================
   DATE
============================================================ */

function today() {

    return new Date()
        .toLocaleDateString();

}

/* ============================================================
   DELAY
============================================================ */

function delay(ms) {

    return new Promise(resolve => {

        setTimeout(resolve, ms);

    });

}

/* ============================================================
   DEBUG LOGGER
============================================================ */

function log(...message) {

    console.log(
        "[Workbook Tool]",
        ...message
    );

}

/* ============================================================
   INITIAL STATE
============================================================ */

setWorkflowStep(1);

updatePromptStatus(
    "offer",
    "waiting"
);

updatePromptStatus(
    "workbook",
    "waiting"
);

updatePromptStatus(
    "sheet",
    "waiting"
);

loadDraft();

log("Globals Loaded");

/******************************************************************
 * END OF 01_globals.js
 ******************************************************************/

/******************************************************************
 * 02_fetchWorkbook.js
 * Part 2A
 * Workbook Fetch API
 ******************************************************************/

/* ============================================================
   FETCH WORKBOOK
============================================================ */

async function fetchWorkbook() {

    const projectReference =
        UI.projectRef?.value.trim();

    const taskNumber =
        UI.taskNumber?.value.trim();

    if (!projectReference) {

        showToast("Please enter Project Reference.");

        UI.projectRef?.focus();

        return;

    }

    if (!taskNumber) {

        showToast("Please enter Task Number.");

        UI.taskNumber?.focus();

        return;

    }

    try {

        disableFetchButton();

        showLoading();

        setWorkflowStep(1);

        updateAIStatus("Searching Project...");

        const response = await fetch(
            "/fetch_workbook",
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    project_reference:
                        projectReference,

                    task_number:
                        taskNumber

                })

            }
        );

        if (!response.ok) {

            const error =
                await response.json()
                    .catch(() => ({}));

            throw new Error(

                error.error ||

                "Unable to fetch workbook."

            );

        }

        const data =
            await response.json();

        AppState.workbook =
            data;

        setWorkflowStep(2);

        updateAIStatus(
            "Workbook Downloaded"
        );

        loadWorkbook(data);

    }

    catch (error) {

        console.error(error);

        hideLoading();

        enableFetchButton();

        showToast(error.message);

    }

}

/* ============================================================
   LOAD WORKBOOK
============================================================ */

function loadWorkbook(data) {

    AppState.workbookName =
        data.workbook_name || "";

    AppState.workbookType =
        data.workbook_type || "";

    UI.workbookName.textContent =
        safeText(data.workbook_name);

    UI.workbookType.textContent =
        safeText(data.workbook_type);

    UI.sheetCount.textContent =
        data.sheet_count || 0;

    updatePIIBadge(

        data.has_pii || false,

        data.pii_count || 0

    );

    populateSheets(

        data.sheets || []

    );

    enablePromptBuilder();

    loadDefaultSheet();

    setWorkflowStep(3);

    updateAIStatus(

        "Workbook Loaded"

    );

    hideLoading();

    enableFetchButton();

    showToast(

        "Workbook loaded successfully."

    );

}

/******************************************************************
 * Part 2B
 * Sheet Loader
 * Prompt Builder Population
 ******************************************************************/

/* ============================================================
   POPULATE SHEET DROPDOWN
============================================================ */

function populateSheets(sheetList) {

    resetSheetSelector();

    if (!Array.isArray(sheetList))
        return;

    sheetList.forEach(sheet => {

        const option =
            document.createElement("option");

        option.value = sheet;

        option.textContent = sheet;

        UI.sheetSelector.appendChild(option);

    });

}

/* ============================================================
   SHEET CHANGED
============================================================ */

function handleSheetSelection() {

    const sheetName =
        UI.sheetSelector.value;

    if (!sheetName)
        return;

    AppState.selectedSheet =
        sheetName;

    setWorkflowStep(4);

    updateAIStatus(
        "Loading Sheet..."
    );

    loadSelectedSheet(sheetName);

}

/* ============================================================
   LOAD SHEET DATA
============================================================ */

function loadSelectedSheet(sheetName) {

    const sheet =
        AppState.workbook
            ?.sheet_data?.[sheetName];

    if (!sheet) {

        showToast(
            "Unable to load worksheet."
        );

        return;

    }

    /* Store */

    AppState.prompt.offer =
        sheet.offer_description || "";

    AppState.prompt.context =
        sheet.workbook_context || "";

    AppState.prompt.sheet =
        sheet.sheet_prompt || "";

    AppState.prompt.final =
        sheet.generated_prompt || "";

    /* Populate UI */

    UI.offer.value =
        AppState.prompt.offer;

    UI.context.value =
        AppState.prompt.context;

    UI.sheetPrompt.value =
        AppState.prompt.sheet;

    UI.finalPrompt.value =
        AppState.prompt.final;

    /* Update Status */

    updatePromptStatus(
        "offer",
        "ready"
    );

    updatePromptStatus(
        "workbook",
        "ready"
    );

    updatePromptStatus(
        "sheet",
        "ready"
    );

    updatePreview();

    saveDraft();

    setWorkflowStep(5);

    updateAIStatus(
        "Prompt Builder Ready"
    );

    showToast(
        `${sheetName} loaded`
    );

}

/* ============================================================
   LOAD FIRST SHEET
============================================================ */

function loadDefaultSheet() {

    if (!UI.sheetSelector)
        return;

    if (
        UI.sheetSelector.options.length <= 1
    )
        return;

    UI.sheetSelector.selectedIndex = 1;

    handleSheetSelection();

}

/* ============================================================
   REFRESH CURRENT SHEET
============================================================ */

function refreshCurrentSheet() {

    if (!AppState.selectedSheet)
        return;

    loadSelectedSheet(
        AppState.selectedSheet
    );

}

/* ============================================================
   CLEAR WORKBOOK
============================================================ */

function clearWorkbook() {

    AppState.workbook = null;

    AppState.selectedSheet = "";

    AppState.workbookName = "";

    AppState.workbookType = "";

    if (UI.workbookName)
        UI.workbookName.textContent =
            "Not Loaded";

    if (UI.workbookType)
        UI.workbookType.textContent =
            "-";

    if (UI.sheetCount)
        UI.sheetCount.textContent =
            "0";

    resetSheetSelector();

    clearPromptBuilder();

    updateAIStatus(
        "Ready"
    );

    updatePIIBadge(false);

    setWorkflowStep(1);

}

/******************************************************************
 * 03_promptBuilder.js
 * Part 3A
 * Prompt Builder
 * Edit Mode
 ******************************************************************/

"use strict";

/* ============================================================
   EDIT STATE
============================================================ */

const EditState = {

    offer: false,

    workbook: false,

    sheet: false

};

/* ============================================================
   REGISTER EDIT EVENTS
============================================================ */

function registerPromptBuilderEvents() {

    document
        .getElementById("editOfferBtn")
        ?.addEventListener(
            "click",
            () => toggleEditor("offer")
        );

    document
        .getElementById("editWorkbookBtn")
        ?.addEventListener(
            "click",
            () => toggleEditor("workbook")
        );

    document
        .getElementById("editSheetBtn")
        ?.addEventListener(
            "click",
            () => toggleEditor("sheet")
        );

}

/* ============================================================
   TOGGLE EDITOR
============================================================ */

function toggleEditor(section) {

    switch (section) {

        case "offer":

            toggleTextarea(

                UI.offer,

                "offer",

                "editOfferBtn"

            );

            break;

        case "workbook":

            toggleTextarea(

                UI.context,

                "workbook",

                "editWorkbookBtn"

            );

            break;

        case "sheet":

            toggleTextarea(

                UI.sheetPrompt,

                "sheet",

                "editSheetBtn"

            );

            break;

    }

}

/* ============================================================
   GENERIC TOGGLE
============================================================ */

function toggleTextarea(

    textarea,

    key,

    buttonId

) {

    if (!textarea) return;

    const button =

        document.getElementById(buttonId);

    EditState[key] =

        !EditState[key];

    textarea.readOnly =

        !EditState[key];

    textarea.classList.toggle(

        "border-primary",

        EditState[key]

    );

    if (EditState[key]) {

        button.innerHTML = `

            <i class="bi bi-check-lg"></i>

            Save

        `;

        textarea.focus();

        updatePromptStatus(

            key,

            "editing"

        );

        expandSection(textarea);

    }

    else {

        button.innerHTML = `

            <i class="bi bi-pencil"></i>

            Edit

        `;

        updatePromptStatus(

            key,

            "ready"

        );

        regeneratePrompt();

        saveDraft();

        showToast(

            "Changes saved."

        );

    }

}

/******************************************************************
 * Part 3B
 * Auto Save
 * Dirty Tracking
 * Accordion
 * Live Prompt Refresh
 ******************************************************************/

/* ============================================================
   AUTO SAVE TIMERS
============================================================ */

const AutoSave = {

    timers: {}

};

/* ============================================================
   REGISTER INPUT EVENTS
============================================================ */

function registerPromptInputEvents() {

    [
        UI.offer,
        UI.context,
        UI.sheetPrompt
    ].forEach(element => {

        if (!element) return;

        element.addEventListener(

            "input",

            handlePromptInput

        );

    });

}

/* ============================================================
   INPUT EVENT
============================================================ */

function handlePromptInput(event) {

    AppState.dirty = true;

    const textarea = event.target;

    let section = "offer";

    if (textarea === UI.context)
        section = "workbook";

    if (textarea === UI.sheetPrompt)
        section = "sheet";

    updatePromptStatus(
        section,
        "editing"
    );

    debounceSave(section);

}

/* ============================================================
   DEBOUNCE SAVE
============================================================ */

function debounceSave(section) {

    clearTimeout(
        AutoSave.timers[section]
    );

    AutoSave.timers[section] =
        setTimeout(() => {

            regeneratePrompt();

            saveDraft();

            AppState.dirty = false;

            updatePromptStatus(
                section,
                "ready"
            );

        }, 500);

}

/* ============================================================
   EXPAND CURRENT SECTION
============================================================ */

function expandSection(textarea) {

    const collapse =
        textarea.closest(".collapse");

    if (!collapse)
        return;

    bootstrap
        .Collapse
        .getOrCreateInstance(collapse)
        .show();

    const icon =
        collapse
            .closest(".prompt-section")
            ?.querySelector(
                ".accordion-toggle i"
            );

    if (icon) {

        icon.className =
            "bi bi-chevron-down";

    }

}

/* ============================================================
   COLLAPSE ICONS
============================================================ */

function initializeAccordions() {

    document
        .querySelectorAll(".collapse")
        .forEach(section => {

            section.addEventListener(

                "shown.bs.collapse",

                () => {

                    const icon =
                        section
                            .closest(".prompt-section")
                            ?.querySelector(
                                ".accordion-toggle i"
                            );

                    if (icon)
                        icon.className =
                            "bi bi-chevron-down";

                }

            );

            section.addEventListener(

                "hidden.bs.collapse",

                () => {

                    const icon =
                        section
                            .closest(".prompt-section")
                            ?.querySelector(
                                ".accordion-toggle i"
                            );

                    if (icon)
                        icon.className =
                            "bi bi-chevron-right";

                }

            );

        });

}

/* ============================================================
   RESET EDIT MODE
============================================================ */

function resetEditors() {

    EditState.offer = false;
    EditState.workbook = false;
    EditState.sheet = false;

    UI.offer.readOnly = true;
    UI.context.readOnly = true;
    UI.sheetPrompt.readOnly = true;

}

/* ============================================================
   KEYBOARD SHORTCUTS
============================================================ */

document.addEventListener(

    "keydown",

    event => {

        /* CTRL + S */

        if (

            event.ctrlKey &&

            event.key.toLowerCase() === "s"

        ) {

            event.preventDefault();

            regeneratePrompt();

            saveDraft();

            showToast(
                "Draft Saved"
            );

        }

        /* CTRL + ENTER */

        if (

            event.ctrlKey &&

            event.key === "Enter"

        ) {

            event.preventDefault();

            regeneratePrompt();

            showToast(
                "Prompt Updated"
            );

        }

    }

);

/* ============================================================
   INITIALIZE PROMPT BUILDER
============================================================ */

function initializePromptBuilder() {

    registerPromptBuilderEvents();

    registerPromptInputEvents();

    initializeAccordions();

    resetEditors();

}

/******************************************************************
 * 04_promptGeneration.js
 * Part 4A
 * Prompt Generation Engine
 ******************************************************************/

"use strict";

/* ============================================================
   REGENERATE PROMPT
============================================================ */

function regeneratePrompt() {

    const offer =
        UI.offer?.value.trim() || "";

    const context =
        UI.context?.value.trim() || "";

    const instructions =
        UI.sheetPrompt?.value.trim() || "";

    AppState.prompt.offer = offer;
    AppState.prompt.context = context;
    AppState.prompt.sheet = instructions;

    const prompt = buildPrompt(
        offer,
        context,
        instructions
    );

    AppState.prompt.final = prompt;

    if (UI.finalPrompt) {

        UI.finalPrompt.value = prompt;

    }

    syncPromptPreview();

    updatePromptMetrics();

}

/* ============================================================
   BUILD PROMPT
============================================================ */

function buildPrompt(

    offer,

    context,

    instructions

) {

    return [

        "# Workbook Validation Prompt",

        "",

        "You are an expert workbook validation assistant.",

        "",

        "## Offer Description",

        offer || "Not Available",

        "",

        "## Workbook Context",

        context || "Not Available",

        "",

        "## Sheet Instructions",

        instructions || "Not Available",

        "",

        "## Validation Tasks",

        "- Review workbook data",

        "- Validate business rules",

        "- Identify inconsistencies",

        "- Explain every issue found",

        "- Provide corrected values where applicable",

        "",

        "## Output Format",

        "Return findings as a structured report."

    ].join("\n");

}

/* ============================================================
   SYNC PREVIEW
============================================================ */

function syncPromptPreview() {

    if (

        UI.previewArea &&

        UI.finalPrompt

    ) {

        UI.previewArea.value =

            UI.finalPrompt.value;

    }

}

/* ============================================================
   PROMPT METRICS
============================================================ */

function updatePromptMetrics() {

    const prompt =

        UI.finalPrompt?.value || "";

    AppState.prompt.characters =

        prompt.length;

    AppState.prompt.words =

        prompt

            .trim()

            .split(/\s+/)

            .filter(Boolean)

            .length;

}

/* ============================================================
   AUTO REGENERATE
============================================================ */

function refreshGeneratedPrompt() {

    regeneratePrompt();

    saveDraft();

}

/* ============================================================
   CLEAR GENERATED PROMPT
============================================================ */

function clearGeneratedPrompt() {

    AppState.prompt.final = "";

    if (UI.finalPrompt)

        UI.finalPrompt.value = "";

    if (UI.previewArea)

        UI.previewArea.value = "";

}

/******************************************************************
 * Part 4B
 * Preview
 * Copy
 * Download
 * GPT Workspace
 ******************************************************************/

"use strict";

/* ============================================================
   SHOW PROMPT PREVIEW
============================================================ */

async function showPromptPreview() {

    regeneratePrompt();

    const safe = await validatePrompt();

    if (!safe) return;

    syncPromptPreview();

    BootstrapUI.previewModal?.show();

    setWorkflowStep(6);

    updateAIStatus("GPT Ready");

}

/* ============================================================
   CLOSE PREVIEW
============================================================ */

function closePromptPreview() {

    BootstrapUI.previewModal?.hide();

}

/* ============================================================
   COPY GENERATED PROMPT
============================================================ */

async function copyPrompt() {

    regeneratePrompt();

    const safe = await validatePrompt();

    if (!safe) return;

    await copyToClipboard(

        UI.finalPrompt.value

    );

    updateAIStatus("Prompt Copied");

}

/* ============================================================
   COPY PREVIEW
============================================================ */

async function copyPreviewPrompt() {

    await copyToClipboard(

        UI.previewArea.value

    );

}

/* ============================================================
   DOWNLOAD PROMPT
============================================================ */

function downloadPrompt() {

    regeneratePrompt();

    const blob = new Blob(

        [UI.finalPrompt.value],

        {

            type: "text/plain"

        }

    );

    const url =

        URL.createObjectURL(blob);

    const link =

        document.createElement("a");

    link.href = url;

    link.download =

        "Workbook_AI_Prompt.txt";

    link.click();

    URL.revokeObjectURL(url);

}

/* ============================================================
   OPEN GPT
============================================================ */

function openGPTWorkspace() {

    const iframe =

        document.getElementById(

            "gptIframe"

        );

    if (iframe) {

        iframe.src =

            "https://chatgpt.com";

        return;

    }

    window.open(

        "https://chatgpt.com",

        "_blank"

    );

}

/* ============================================================
   VALIDATION
============================================================ */

async function validatePrompt() {

    if (

        !UI.finalPrompt ||

        !UI.finalPrompt.value.trim()

    ) {

        showToast(

            "Generate a prompt first."

        );

        return false;

    }

    if (

        typeof scanPromptForPII !==

        "function"

    ) {

        return true;

    }

    return await scanPromptForPII();

}

/* ============================================================
   PROMPT SUMMARY
============================================================ */

function promptSummary() {

    return {

        characters:

            AppState.prompt.characters,

        words:

            AppState.prompt.words,

        sheet:

            AppState.selectedSheet,

        workbook:

            AppState.workbookName

    };

}

/* ============================================================
   BUTTON EVENTS
============================================================ */

function registerPromptActions() {

    UI.previewButton?.addEventListener(

        "click",

        showPromptPreview

    );

    UI.copyButton?.addEventListener(

        "click",

        copyPrompt

    );

    UI.copyPreviewButton?.addEventListener(

        "click",

        copyPreviewPrompt

    );

}

/* ============================================================
   INITIALIZE
============================================================ */

function initializePromptGeneration() {

    registerPromptActions();

    syncPromptPreview();

}

/******************************************************************
 * 05_piiWorkflow.js
 * Part 5A
 * PII Scanner
 * Prompt Validation
 ******************************************************************/

"use strict";

/* ============================================================
   PII SCAN
============================================================ */

async function scanPromptForPII() {

    try {

        showLoading();

        updateAIStatus("Scanning Prompt...");

        const response = await fetch(

            "/scan_pii",

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    prompt:

                        UI.finalPrompt.value

                })

            }

        );

        const result =
            await response.json();

        hideLoading();

        if (!response.ok) {

            throw new Error(

                result.error ||

                "PII Scan Failed"

            );

        }

        updatePIIInformation(result);

        return !result.has_pii;

    }

    catch (error) {

        hideLoading();

        console.error(error);

        showError(

            error.message

        );

        return false;

    }

}

/* ============================================================
   UPDATE PII STATUS
============================================================ */

function updatePIIInformation(result) {

    updatePIIBadge(

        result.has_pii,

        result.count || 0

    );

    if (!UI.piiResult)

        return;

    if (result.has_pii) {

        UI.piiResult.className =

            "badge bg-danger";

        UI.piiResult.innerHTML =

            `${result.count} PII Found`;

    }

    else {

        UI.piiResult.className =

            "badge bg-success";

        UI.piiResult.innerHTML =

            "No PII Found";

    }

    if (UI.validationResult) {

        UI.validationResult.className =

            result.has_pii

                ? "badge bg-danger"

                : "badge bg-success";

        UI.validationResult.innerHTML =

            result.has_pii

                ? "Failed"

                : "Passed";

    }

    updateAIStatus(

        result.has_pii

            ? "PII Detected"

            : "Prompt Safe"

    );

}

/* ============================================================
   PROMPT SAFETY
============================================================ */

function isPromptSafe(result) {

    return !result.has_pii;

}

/* ============================================================
   VALIDATION SUMMARY
============================================================ */

function validationSummary(result) {

    return {

        safe:

            !result.has_pii,

        piiCount:

            result.count || 0,

        types:

            result.types || {}

    };

}

/******************************************************************
 * Part 5B
 * Error Handling
 * Application Reset
 * Initialization
 ******************************************************************/

"use strict";

/* ============================================================
   ERROR HANDLER
============================================================ */

function showError(message) {

    console.error(message);

    updateAIStatus("Error");

    showToast(message || "Unexpected error occurred.");

}

/* ============================================================
   RESET APPLICATION
============================================================ */

function resetApplication() {

    clearWorkbook();

    clearGeneratedPrompt();

    clearDraft();

    AppState.dirty = false;

    AppState.selectedSheet = "";

    AppState.prompt = {

        offer: "",

        context: "",

        sheet: "",

        final: "",

        characters: 0,

        words: 0

    };

    resetEditors();

    updateAIStatus("Ready");

    updatePIIBadge(false);

    showToast("Application Reset");

}

/* ============================================================
   ENABLE INPUTS
============================================================ */

function enablePromptBuilder() {

    [

        UI.offer,

        UI.context,

        UI.sheetPrompt,

        UI.finalPrompt

    ].forEach(item => {

        if (item)

            item.disabled = false;

    });

}

/* ============================================================
   DISABLE INPUTS
============================================================ */

function disablePromptBuilder() {

    [

        UI.offer,

        UI.context,

        UI.sheetPrompt,

        UI.finalPrompt

    ].forEach(item => {

        if (item)

            item.disabled = true;

    });

}

/* ============================================================
   GLOBAL ERROR EVENTS
============================================================ */

window.addEventListener(

    "error",

    event => {

        console.error(event.error);

        showError(

            event.message

        );

    }

);

window.addEventListener(

    "unhandledrejection",

    event => {

        console.error(

            event.reason

        );

        showError(

            "Unexpected application error."

        );

    }

);

/* ============================================================
   APPLICATION STARTUP
============================================================ */

document.addEventListener(

    "DOMContentLoaded",

    () => {

        initializeApplication();

        initializePromptBuilder();

        initializePromptGeneration();

        disablePromptBuilder();

        updateAIStatus("Ready");

        console.log(

            "Workbook Validation Tool Ready"

        );

    }

);

/* ============================================================
   PUBLIC API
============================================================ */

window.WorkbookApp = {

    fetchWorkbook,

    regeneratePrompt,

    showPromptPreview,

    copyPrompt,

    copyPreviewPrompt,

    refreshCurrentSheet,

    resetApplication,

    scanPromptForPII

};